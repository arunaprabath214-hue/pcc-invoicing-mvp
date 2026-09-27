import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { formatLKR } from '../utils'

const money = (n) => formatLKR(Number(n || 0))

export default function FinanceDashboard() {
  const [data, setData] = useState({ income:0, expenses:0, receivables:0, pending:0, transactions:[] })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0,10)
    const [{ data: tx }, { data: inv }, { data: req }] = await Promise.all([
      supabase.from('finance_transactions').select('*').order('created_at',{ascending:false}).limit(10),
      supabase.from('invoices').select('balance_amount').gt('balance_amount',0),
      supabase.from('finance_requests').select('id').eq('status','pending')
    ])
    const rows = tx || []
    setData({
      income: rows.filter(x=>x.transaction_type==='income' && x.transaction_date===today).reduce((s,x)=>s+Number(x.amount),0),
      expenses: rows.filter(x=>x.transaction_type==='expense' && x.transaction_date===today).reduce((s,x)=>s+Number(x.amount),0),
      receivables: (inv||[]).reduce((s,x)=>s+Number(x.balance_amount||0),0),
      pending: (req||[]).length,
      transactions: rows
    })
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  if (loading) return <><Header title="Finance Hub" subtitle="Financial control center" /><main className="app-content"><div className="loading-state">Loading Finance Hub...</div></main></>

  return <>
    <Header title="Finance Hub" subtitle="Financial control center" />
    <main className="app-content">
      <div className="stat-grid">
        <div className="stat-box"><div className="stat-label">Today's Income</div><div className="stat-value text-success">{money(data.income)}</div></div>
        <div className="stat-box"><div className="stat-label">Today's Expenses</div><div className="stat-value text-danger">{money(data.expenses)}</div></div>
        <div className="stat-box"><div className="stat-label">Net Movement</div><div className="stat-value">{money(data.income-data.expenses)}</div></div>
        <div className="stat-box"><div className="stat-label">Receivables</div><div className="stat-value text-warning">{money(data.receivables)}</div></div>
      </div>

      <div className="card">
        <div className="flex-between">
          <h2 className="card-title">Approval Queue</h2>
          <span className={data.pending ? 'badge badge-unpaid' : 'badge badge-paid'}>{data.pending} pending</span>
        </div>
        <p className="text-dim" style={{fontSize:13,marginBottom:0}}>Finance requests waiting for Director review.</p>
      </div>

      <div className="section-heading">Recent Transactions</div>
      {data.transactions.length===0 ? (
        <div className="empty-state"><div className="emoji">💰</div><p>No finance transactions yet.</p></div>
      ) : data.transactions.map(t=>(
        <div className="list-card" key={t.id}>
          <div className="list-card-main">
            <div className="list-card-title">{t.description}</div>
            <div className="list-card-sub">{t.transaction_date} · {t.transaction_type}</div>
          </div>
          <div className={'list-card-amount '+(t.transaction_type==='income'?'text-success':'text-danger')}>
            {t.transaction_type==='income'?'+':'-'} {money(t.amount)}
          </div>
        </div>
      ))}
    </main>
  </>
}
