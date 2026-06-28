import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { formatLKR, formatDate, todayISO } from '../utils'

const emptyForm = {
  customer_id: '',
  product_id: '',
  label_cost: '',
  old_bottle_price_without_label: '',
  current_bottle_price_without_label: '',
  current_total_selling_price: '',
  effective_date: todayISO(),
  notes: '',
}

export default function CustomerPrices() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCustomer, setFilterCustomer] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadAll() {
    setLoading(true)
    const [{ data: c }, { data: p }, { data: cp }] = await Promise.all([
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('products').select('*').order('case_qty', { ascending: false }),
      supabase
        .from('customer_prices')
        .select('*, customers(business_name), products(product_name, size, case_qty)')
        .order('effective_date', { ascending: false }),
    ])
    setCustomers(c || [])
    setProducts(p || [])
    setPrices(cp || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyForm, customer_id: filterCustomer || '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setForm({
      customer_id: row.customer_id,
      product_id: row.product_id,
      label_cost: row.label_cost ?? '',
      old_bottle_price_without_label: row.old_bottle_price_without_label ?? '',
      current_bottle_price_without_label: row.current_bottle_price_without_label ?? '',
      current_total_selling_price: row.current_total_selling_price ?? '',
      effective_date: row.effective_date || todayISO(),
      notes: row.notes || '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.customer_id || !form.product_id || !form.current_bottle_price_without_label) {
      setError('Customer, product, and current bottle price are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      customer_id: form.customer_id,
      product_id: form.product_id,
      label_cost: form.label_cost === '' ? 0 : Number(form.label_cost),
      old_bottle_price_without_label: form.old_bottle_price_without_label === '' ? null : Number(form.old_bottle_price_without_label),
      current_bottle_price_without_label: Number(form.current_bottle_price_without_label),
      current_total_selling_price: form.current_total_selling_price === '' ? null : Number(form.current_total_selling_price),
      effective_date: form.effective_date,
      notes: form.notes || null,
    }

    if (editingId) {
      const { error } = await supabase.from('customer_prices').update(payload).eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('customer_prices').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    loadAll()
  }

  const filteredPrices = filterCustomer
    ? prices.filter((p) => p.customer_id === filterCustomer)
    : prices

  return (
    <>
      <Header title="Customer Prices" subtitle="Bottle prices without label cost" />
      <main className="app-content">
        <div className="field">
          <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-state">Loading prices...</div>
        ) : filteredPrices.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🏷️</div>
            <p>No price records yet.<br />Tap + to add a customer price.</p>
          </div>
        ) : (
          filteredPrices.map((row) => (
            <div key={row.id} className="list-card" onClick={() => openEdit(row)}>
              <div className="list-card-main">
                <div className="list-card-title">
                  {row.customers?.business_name} — {row.products?.size}
                </div>
                <div className="list-card-sub">
                  Label Rs.{row.label_cost} · Effective {formatDate(row.effective_date)}
                </div>
              </div>
              <div className="list-card-amount">
                {formatLKR(row.current_bottle_price_without_label)}
                <div className="text-faint" style={{ fontSize: 11, fontWeight: 500 }}>per bottle (no label)</div>
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
            <h2 className="modal-title">{editingId ? 'Edit Price' : 'Add Customer Price'}</h2>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="field">
                <label>Customer *</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Product Size *</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  required
                >
                  <option value="">Select size</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.size} ({p.case_qty}/case)</option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Label Cost (prepaid)</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={form.label_cost}
                    onChange={(e) => setForm({ ...form, label_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="field">
                  <label>Old Bottle Price</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={form.old_bottle_price_without_label}
                    onChange={(e) => setForm({ ...form, old_bottle_price_without_label: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Current Bottle Price (no label) *</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={form.current_bottle_price_without_label}
                    onChange={(e) => setForm({ ...form, current_bottle_price_without_label: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="field">
                  <label>Total Selling Price (ref)</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={form.current_total_selling_price}
                    onChange={(e) => setForm({ ...form, current_total_selling_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="field">
                <label>Effective Date</label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
