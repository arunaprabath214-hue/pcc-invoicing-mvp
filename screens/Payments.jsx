import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { formatLKR, formatDate, todayISO } from '../utils'

const emptyForm = {
  customer_id: '',
  invoice_id: '',
  amount: '',
  payment_method: 'cash',
  payment_date: todayISO(),
  notes: '',
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customerInvoices, setCustomerInvoices] = useState([])

  async function loadAll() {
    setLoading(true)
    const [{ data: pay }, { data: c }] = await Promise.all([
      supabase
        .from('payments')
        .select('*, customers(business_name), invoices(invoice_no)')
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setPayments(pay || [])
    setCustomers(c || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function openAdd() {
    setForm(emptyForm)
    setError('')
    setCustomerInvoices([])
    setShowModal(true)
  }

  async function handleCustomerChange(custId) {
    setForm({ ...form, customer_id: custId, invoice_id: '' })
    if (!custId) { setCustomerInvoices([]); return }
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_no, total_amount, balance_amount, status')
      .eq('customer_id', custId)
      .neq('status', 'paid')
      .order('invoice_date', { ascending: false })
    setCustomerInvoices(data || [])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.customer_id || !form.amount || Number(form.amount) <= 0) {
      setError('Customer and a valid amount are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      customer_id: form.customer_id,
      invoice_id: form.invoice_id || null,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date,
      notes: form.notes || null,
    }

    const { error: payErr } = await supabase.from('payments').insert(payload)
    if (payErr) { setError(payErr.message); setSaving(false); return }

    // if linked to invoice, update invoice paid_amount
    if (form.invoice_id) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('paid_amount')
        .eq('id', form.invoice_id)
        .single()

      if (inv) {
        const newPaid = Number(inv.paid_amount || 0) + Number(form.amount)
        await supabase.from('invoices').update({ paid_amount: newPaid }).eq('id', form.invoice_id)
      }
    }

    setSaving(false)
    setShowModal(false)
    loadAll()
  }

  return (
    <>
      <Header title="Payments" subtitle={`${payments.length} payment records`} />
      <main className="app-content">
        {loading ? (
          <div className="loading-state">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💵</div>
            <p>No payments recorded yet.<br />Tap + to record a payment.</p>
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="list-card">
              <div className="list-card-main">
                <div className="list-card-title">{p.customers?.business_name || 'Unknown'}</div>
                <div className="list-card-sub">
                  {formatDate(p.payment_date)} · {p.payment_method}
                  {p.invoices?.invoice_no ? ` · ${p.invoices.invoice_no}` : ' · General payment'}
                </div>
              </div>
              <div className="list-card-amount text-success">
                + {formatLKR(p.amount)}
              </div>
            </div>
          ))
        )}
      </main>

      <button className="fab-add no-print" onClick={openAdd}>+</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">Record Payment</h2>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="field">
                <label>Customer *</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>

              {form.customer_id && (
                <div className="field">
                  <label>Apply to Invoice (optional)</label>
                  <select
                    value={form.invoice_id}
                    onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
                  >
                    <option value="">General payment (no specific invoice)</option>
                    {customerInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_no} — Balance {formatLKR(inv.balance_amount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field-row">
                <div className="field">
                  <label>Amount *</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="field">
                  <label>Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Payment Date</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="btn-block-row">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
