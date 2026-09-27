import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { formatLKR, formatDate, todayISO } from '../utils'

const emptyForm = {
  customer_id: '', invoice_id: '', amount: '', payment_method: 'cash',
  payment_date: todayISO(), notes: '', reference: ''
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customerInvoices, setCustomerInvoices] = useState([])

  async function loadAll() {
    setLoading(true)
    const [{ data: pay }, { data: c }] = await Promise.all([
      supabase.from('payments').select('*, customers(business_name), invoices(invoice_no)')
        .order('payment_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setPayments(pay || [])
    setCustomers(c || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  function openAdd() {
    setForm({ ...emptyForm, payment_date: todayISO() })
    setError('')
    setCustomerInvoices([])
    setShowModal(true)
  }

  async function handleCustomerChange(custId) {
    setForm(f => ({ ...f, customer_id: custId, invoice_id: '' }))
    if (!custId) { setCustomerInvoices([]); return }
    const { data } = await supabase.from('invoices')
      .select('id, invoice_no, total_amount, balance_amount, status')
      .eq('customer_id', custId).gt('balance_amount', 0)
      .order('invoice_date', { ascending: false })
    setCustomerInvoices(data || [])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.customer_id || !form.amount || Number(form.amount) <= 0) {
      setError('Customer and a valid amount are required.'); return
    }
    if (!['cash', 'bank_transfer'].includes(form.payment_method)) {
      setError('For Finance Hub, payment method must be Cash or Bank Transfer.'); return
    }
    if (form.invoice_id) {
      const inv = customerInvoices.find(i => i.id === form.invoice_id)
      if (inv && Number(form.amount) > Number(inv.balance_amount) + 0.005) {
        setError('Payment cannot be greater than the invoice balance.'); return
      }
    }

    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: payErr } = await supabase.from('payments').insert({
      customer_id: form.customer_id,
      invoice_id: form.invoice_id || null,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date,
      notes: [form.reference ? 'Ref: ' + form.reference : '', form.notes].filter(Boolean).join(' | ') || null,
      created_by: user?.id || null,
    })
    if (payErr) { setError(payErr.message); setSaving(false); return }

    if (form.invoice_id) {
      const { data: inv } = await supabase.from('invoices')
        .select('paid_amount, total_amount').eq('id', form.invoice_id).single()
      if (inv) {
        const newPaid = Math.min(Number(inv.total_amount), Number(inv.paid_amount || 0) + Number(form.amount))
        await supabase.from('invoices').update({
          paid_amount: newPaid,
          status: newPaid >= Number(inv.total_amount) ? 'paid' : 'partial',
        }).eq('id', form.invoice_id)
      }
    }

    setSaving(false); setShowModal(false); loadAll()
  }

  return <>
    <Header title="Payments" subtitle={`${payments.length} payment records`} />
    <main className="app-content">
      {loading ? <div className="loading-state">Loading payments...</div> :
       payments.length === 0 ? <div className="empty-state"><div className="emoji">💵</div><p>No payments recorded yet.<br />Tap + to record a payment.</p></div> :
       payments.map(p => <div key={p.id} className="list-card">
         <div className="list-card-main">
           <div className="list-card-title">{p.customers?.business_name || 'Unknown'}</div>
           <div className="list-card-sub">{formatDate(p.payment_date)} · {p.payment_method}{p.invoices?.invoice_no ? ` · ${p.invoices.invoice_no}` : ' · General payment'}</div>
         </div>
         <div className="list-card-amount text-success">+ {formatLKR(p.amount)}</div>
       </div>)}
    </main>

    <button className="fab-add no-print" onClick={openAdd}>+</button>

    {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" /><h2 className="modal-title">Record Payment</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="field"><label>Customer *</label>
            <select value={form.customer_id} onChange={e => handleCustomerChange(e.target.value)} required>
              <option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          {form.customer_id && <div className="field"><label>Apply to Invoice</label>
            <select value={form.invoice_id} onChange={e => setForm(f => ({...f, invoice_id:e.target.value}))}>
              <option value="">General payment</option>
              {customerInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_no} — Balance {formatLKR(inv.balance_amount)}</option>)}
            </select>
          </div>}
          <div className="field-row">
            <div className="field"><label>Amount *</label><input type="number" step="0.01" min="0.01" inputMode="decimal" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} required /></div>
            <div className="field"><label>Method *</label><select value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option></select></div>
          </div>
          <div className="field"><label>Payment Date</label><input type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))}/></div>
          <div className="field"><label>Reference</label><input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="Bank reference / receipt no." /></div>
          <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="btn-block-row"><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Record Payment'}</button></div>
        </form>
      </div>
    </div>}
  </>
}
