import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { formatLKR, formatDate } from '../utils'

export default function Ledger() {
  const [customers, setCustomers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('business_name')
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!selectedId) {
      setInvoices([])
      setPayments([])
      return
    }
    loadDetail(selectedId)
  }, [selectedId])

  async function loadDetail(custId) {
    setLoadingDetail(true)
    const [{ data: inv }, { data: pay }] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', custId)
        .order('invoice_date', { ascending: false }),
      supabase
        .from('payments')
        .select('*, invoices(invoice_no)')
        .eq('customer_id', custId)
        .order('payment_date', { ascending: false }),
    ])
    setInvoices(inv || [])
    setPayments(pay || [])
    setLoadingDetail(false)
  }

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
  const totalBalance = invoices.reduce((s, i) => s + Number(i.balance_amount || 0), 0)

  const selectedCustomer = customers.find((c) => c.id === selectedId)

  return (
    <>
      <Header title="Customer Ledger" subtitle="Balances & history" />
      <main className="app-content">
        <div className="field">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        </div>

        {loading && <div className="loading-state">Loading customers...</div>}

        {!selectedId && !loading && (
          <div className="empty-state">
            <div className="emoji">📒</div>
            <p>Select a customer to view their ledger.</p>
          </div>
        )}

        {selectedId && loadingDetail && (
          <div className="loading-state">Loading ledger...</div>
        )}

        {selectedId && !loadingDetail && (
          <>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="stat-label">Total Invoiced</div>
                <div className="stat-value">{formatLKR(totalInvoiced)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Total Paid</div>
                <div className="stat-value text-success">{formatLKR(totalPaid)}</div>
              </div>
              <div className="stat-box" style={{ gridColumn: '1 / -1' }}>
                <div className="stat-label">Outstanding Balance</div>
                <div className={`stat-value ${totalBalance > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatLKR(totalBalance)}
                </div>
              </div>
            </div>

            <div className="section-heading">Invoices ({invoices.length})</div>
            {invoices.length === 0 ? (
              <p className="text-faint" style={{ fontSize: 13 }}>No invoices yet for {selectedCustomer?.business_name}.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="list-card">
                  <div className="list-card-main">
                    <div className="list-card-title">{inv.invoice_no}</div>
                    <div className="list-card-sub">
                      {formatDate(inv.invoice_date)} ·{' '}
                      <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                    </div>
                  </div>
                  <div className="list-card-amount">
                    {formatLKR(inv.total_amount)}
                    <div className="text-faint" style={{ fontSize: 11, fontWeight: 500 }}>
                      Bal: {formatLKR(inv.balance_amount)}
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="section-heading">Payments ({payments.length})</div>
            {payments.length === 0 ? (
              <p className="text-faint" style={{ fontSize: 13 }}>No payments recorded yet.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="list-card">
                  <div className="list-card-main">
                    <div className="list-card-title">
                      {p.invoices?.invoice_no || 'General Payment'}
                    </div>
                    <div className="list-card-sub">
                      {formatDate(p.payment_date)} · {p.payment_method}
                    </div>
                  </div>
                  <div className="list-card-amount text-success">
                    + {formatLKR(p.amount)}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </main>
    </>
  )
}
