import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import InvoicePrint from '../components/InvoicePrint'
import { formatLKR, todayISO, round2 } from '../utils'

export default function InvoiceGenerator() {
  const [mode, setMode] = useState('bottle') // 'bottle' | 'settlement'
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [roundingAdj, setRoundingAdj] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [lineItems, setLineItems] = useState([]) // {product_id, size, case_qty, cases, unit_price_without_label}
  const [customerPriceMap, setCustomerPriceMap] = useState({}) // product_id -> price row

  // settlement mode fields
  const [settlementDesc, setSettlementDesc] = useState('Previous outstanding settlement')
  const [settlementAmount, setSettlementAmount] = useState('')

  // add-line form
  const [selProductId, setSelProductId] = useState('')
  const [selCases, setSelCases] = useState('')

  const [savedInvoice, setSavedInvoice] = useState(null) // {invoice, items, customer}
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomersAndProducts()
  }, [])

  async function loadCustomersAndProducts() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('products').select('*').order('case_qty', { ascending: false }),
    ])
    setCustomers(c || [])
    setProducts(p || [])
  }

  useEffect(() => {
    if (!customerId) {
      setCustomerPriceMap({})
      setLineItems([])
      return
    }
    loadCustomerPrices(customerId)
  }, [customerId])

  async function loadCustomerPrices(custId) {
    const { data } = await supabase
      .from('customer_prices')
      .select('*')
      .eq('customer_id', custId)
      .order('effective_date', { ascending: false })

    // keep only latest price per product_id
    const map = {}
    for (const row of data || []) {
      if (!map[row.product_id]) map[row.product_id] = row
    }
    setCustomerPriceMap(map)
    setLineItems([])
    setSavedInvoice(null)
  }

  function addLineItem() {
    setError('')
    if (!selProductId) { setError('Select a product size first.'); return }
    if (!selCases || Number(selCases) <= 0) { setError('Enter a valid case count.'); return }

    const product = products.find((p) => p.id === selProductId)
    const priceRow = customerPriceMap[selProductId]

    if (!priceRow) {
      setError(`No price set for this customer at ${product.size}. Add it in Customer Prices first.`)
      return
    }

    const cases = Number(selCases)
    const bottles = cases * product.case_qty
    const unitPrice = Number(priceRow.current_bottle_price_without_label)
    const lineTotal = round2(bottles * unitPrice)

    // if same product already added, merge
    const existingIdx = lineItems.findIndex((li) => li.product_id === selProductId)
    if (existingIdx >= 0) {
      const updated = [...lineItems]
      const merged = { ...updated[existingIdx] }
      merged.cases = round2(merged.cases + cases)
      merged.bottles = round2(merged.bottles + bottles)
      merged.line_total = round2(merged.line_total + lineTotal)
      updated[existingIdx] = merged
      setLineItems(updated)
    } else {
      setLineItems([
        ...lineItems,
        {
          product_id: selProductId,
          size: product.size,
          case_qty: product.case_qty,
          cases,
          bottles,
          unit_price_without_label: unitPrice,
          line_total: lineTotal,
        },
      ])
    }

    setSelProductId('')
    setSelCases('')
  }

  function removeLineItem(idx) {
    setLineItems(lineItems.filter((_, i) => i !== idx))
  }

  const subtotal = mode === 'settlement'
    ? round2(Number(settlementAmount) || 0)
    : round2(lineItems.reduce((sum, li) => sum + li.line_total, 0))
  const total = round2(subtotal + (Number(roundingAdj) || 0))
  const balance = round2(total - (Number(paidAmount) || 0))

  async function handleSaveInvoice() {
    setError('')
    if (!customerId) { setError('Select a customer.'); return }

    if (mode === 'bottle' && lineItems.length === 0) {
      setError('Add at least one line item.')
      return
    }
    if (mode === 'settlement' && (!settlementAmount || Number(settlementAmount) <= 0)) {
      setError('Enter a valid settlement amount.')
      return
    }

    setSaving(true)

    const invoicePayload = {
      customer_id: customerId,
      invoice_date: invoiceDate,
      subtotal,
      rounding_adjustment: Number(roundingAdj) || 0,
      total_amount: total,
      paid_amount: Number(paidAmount) || 0,
      notes: mode === 'settlement'
        ? settlementDesc
        : 'Label cost already prepaid. This invoice is for bottle supply only.',
    }

    const { data: invoiceRow, error: invErr } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select()
      .single()

    if (invErr) {
      setError('Failed to save invoice: ' + invErr.message)
      setSaving(false)
      return
    }

    let itemsForPrint = lineItems

    if (mode === 'settlement') {
      const settlementItem = {
        invoice_id: invoiceRow.id,
        product_id: products[0]?.id, // placeholder FK, required by schema
        cases: 0,
        bottles: 0,
        unit_price_without_label: subtotal,
        line_total: subtotal,
      }
      const { error: itemsErr } = await supabase.from('invoice_items').insert(settlementItem)
      if (itemsErr) {
        setError('Invoice saved but item failed: ' + itemsErr.message)
        setSaving(false)
        return
      }
      itemsForPrint = [{ description: settlementDesc, line_total: subtotal }]
    } else {
      const itemsPayload = lineItems.map((li) => ({
        invoice_id: invoiceRow.id,
        product_id: li.product_id,
        cases: li.cases,
        bottles: li.bottles,
        unit_price_without_label: li.unit_price_without_label,
        line_total: li.line_total,
      }))

      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload)

      if (itemsErr) {
        setError('Invoice saved but items failed: ' + itemsErr.message)
        setSaving(false)
        return
      }
    }

    // if paid amount > 0, log a payment row too
    if (Number(paidAmount) > 0) {
      await supabase.from('payments').insert({
        customer_id: customerId,
        invoice_id: invoiceRow.id,
        amount: Number(paidAmount),
        payment_method: 'cash',
        payment_date: invoiceDate,
        notes: 'Recorded at invoice creation',
      })
    }

    const customer = customers.find((c) => c.id === customerId)
    setSavedInvoice({
      invoice: { ...invoiceRow, is_settlement: mode === 'settlement' },
      items: itemsForPrint,
      customer,
    })
    setSaving(false)
  }

  function handlePrint() {
    window.print()
  }

  function startNewInvoice() {
    setSavedInvoice(null)
    setLineItems([])
    setCustomerId('')
    setRoundingAdj('0')
    setPaidAmount('0')
    setSettlementAmount('')
    setSettlementDesc('Previous outstanding settlement')
    setMode('bottle')
    setError('')
  }

  // ============ SAVED / PRINT VIEW ============
  if (savedInvoice) {
    return (
      <>
        <Header title="Invoice Created" subtitle={savedInvoice.invoice.invoice_no} />
        <main className="app-content">
          <div className="success-banner no-print">
            ✅ Invoice {savedInvoice.invoice.invoice_no} saved successfully.
          </div>

          <div className="btn-block-row no-print mb-16">
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / Save PDF</button>
            <button className="btn btn-secondary" onClick={startNewInvoice}>+ New Invoice</button>
          </div>

          <div className="invoice-print-wrapper">
            <InvoicePrint
              invoice={savedInvoice.invoice}
              items={savedInvoice.items}
              customer={savedInvoice.customer}
            />
          </div>
        </main>
      </>
    )
  }

  // ============ BUILD FORM ============
  const selectedCustomer = customers.find((c) => c.id === customerId)
  const availableProductIds = Object.keys(customerPriceMap)

  return (
    <>
      <Header title="Invoice Generator" subtitle="Bottle supply only — label prepaid" />
      <main className="app-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="btn-block-row mb-16">
          <button
            type="button"
            className={mode === 'bottle' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setMode('bottle')}
          >
            🧴 Bottle Supply
          </button>
          <button
            type="button"
            className={mode === 'settlement' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setMode('settlement')}
          >
            📋 Settlement
          </button>
        </div>

        <div className="card">
          <div className="card-title">Customer & Date</div>
          <div className="field">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.business_name}</option>
              ))}
            </select>
          </div>
          <div className="field mb-0">
            <label>Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
        </div>

        {mode === 'settlement' && customerId && (
          <div className="card">
            <div className="card-title">Settlement Details</div>
            <div className="field">
              <label>Description</label>
              <input
                value={settlementDesc}
                onChange={(e) => setSettlementDesc(e.target.value)}
                placeholder="e.g. Previous outstanding settlement"
              />
            </div>
            <div className="field mb-0">
              <label>Settlement Amount (Rs.) *</label>
              <input
                type="number" step="0.01" inputMode="decimal"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                placeholder="e.g. 23290"
              />
            </div>
          </div>
        )}

        {mode === 'bottle' && customerId && (
          <div className="card">
            <div className="card-title">Add Bottle Line Item</div>

            {availableProductIds.length === 0 ? (
              <p className="text-warning" style={{ fontSize: 13 }}>
                ⚠️ No prices set for {selectedCustomer?.business_name}. Go to Customer Prices and add pricing first.
              </p>
            ) : (
              <>
                <div className="field">
                  <label>Product Size</label>
                  <select value={selProductId} onChange={(e) => setSelProductId(e.target.value)}>
                    <option value="">Select size</option>
                    {products
                      .filter((p) => availableProductIds.includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.size} — {p.case_qty} bottles/case — {formatLKR(customerPriceMap[p.id]?.current_bottle_price_without_label)}/bottle
                        </option>
                      ))}
                  </select>
                </div>
                <div className="field-row">
                  <div className="field mb-0">
                    <label>Number of Cases</label>
                    <input
                      type="number" inputMode="decimal" step="0.5" min="0"
                      value={selCases}
                      onChange={(e) => setSelCases(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
                {selProductId && selCases && (
                  <p className="helper-text">
                    = {Number(selCases) * (products.find(p => p.id === selProductId)?.case_qty || 0)} bottles
                  </p>
                )}
                <button type="button" className="btn btn-secondary mt-16" onClick={addLineItem}>
                  + Add Line Item
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'bottle' && lineItems.length > 0 && (
          <div className="card">
            <div className="card-title">Invoice Items</div>
            {lineItems.map((li, idx) => (
              <div key={idx} className="list-card" style={{ marginBottom: 8 }}>
                <div className="list-card-main">
                  <div className="list-card-title">{li.size} Bottle</div>
                  <div className="list-card-sub">
                    {li.cases} cases × {li.case_qty}/case = {li.bottles} bottles @ {formatLKR(li.unit_price_without_label)}
                  </div>
                </div>
                <div className="list-card-amount">
                  {formatLKR(li.line_total)}
                  <div>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      style={{ marginTop: 6, padding: '4px 10px', fontSize: 12 }}
                      onClick={() => removeLineItem(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {((mode === 'bottle' && lineItems.length > 0) || (mode === 'settlement' && customerId)) && (
          <div className="card">
            <div className="card-title">Totals</div>

            <div className="field-row">
              <div className="field">
                <label>Rounding Adjustment</label>
                <input
                  type="number" step="0.01" inputMode="decimal"
                  value={roundingAdj}
                  onChange={(e) => setRoundingAdj(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Paid Amount (now)</label>
                <input
                  type="number" step="0.01" inputMode="decimal"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="divider" />

            <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="text-dim">Subtotal</span>
              <strong>{formatLKR(subtotal)}</strong>
            </div>
            <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="text-dim">Total Amount</span>
              <strong>{formatLKR(total)}</strong>
            </div>
            <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="text-dim">Balance Due</span>
              <strong className={balance > 0 ? 'text-danger' : 'text-success'}>{formatLKR(balance)}</strong>
            </div>

            <button
              type="button"
              className="btn btn-primary mt-16"
              onClick={handleSaveInvoice}
              disabled={saving || (mode === 'settlement' && !settlementAmount)}
            >
              {saving ? 'Saving...' : '✅ Generate & Save Invoice'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
