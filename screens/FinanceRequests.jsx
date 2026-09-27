import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'
import { useAuth } from '../AuthContext'
import { formatLKR } from '../utils'

const empty = { request_type:'expense', title:'', description:'', amount:'', supplier_name:'', notes:'' }

export default function FinanceRequests() {
  const [requests,setRequests]=useState([])
  const [categories,setCategories]=useState([])
  const [form,setForm]=useState(empty)
  const [show,setShow]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  async function load(){
    const [{data:r},{data:c}]=await Promise.all([
      supabase.from('finance_requests').select('*, expense_categories(name)').order('requested_at',{ascending:false}),
      supabase.from('expense_categories').select('*').eq('is_active',true).order('name')
    ])
    setRequests(r||[]); setCategories(c||[])
  }
  useEffect(()=>{load()},[])

  async function save(e){
    e.preventDefault(); setSaving(true); setError('')
    const {data:{user}}=await supabase.auth.getUser()
    const {error}=await supabase.from('finance_requests').insert({
      request_type:form.request_type,title:form.title,description:form.description||null,
      amount:Number(form.amount),category_id:form.category_id||null,
      supplier_name:form.supplier_name||null,notes:form.notes||null,requested_by:user?.id||null
    })
    if(error){setError(error.message);setSaving(false);return}
    setForm(empty);setShow(false);setSaving(false);load()
  }

  async function complete(id){
    if(!isAdmin)return
    const method=window.prompt('Payment method: cash or bank_transfer','bank_transfer')
    if(!['cash','bank_transfer'].includes(method))return
    const reference=window.prompt('Payment reference (optional)')||null
    const {error}=await supabase.rpc('complete_finance_request',{p_request_id:id,p_payment_method:method,p_reference:reference})
    if(error)setError(error.message);else load()
  }

  async function decide(id,decision){
    const {data:{user}}=await supabase.auth.getUser()
    const note=window.prompt(decision==='approved'?'Approval note (optional)':'Reason for rejection (optional)') || null
    const {error}=await supabase.from('finance_requests').update({
      status:decision,reviewed_by:user?.id||null,reviewed_at:new Date().toISOString(),review_note:note
    }).eq('id',id).eq('status','pending')
    if(error){setError(error.message);return}
    await supabase.from('finance_approvals').insert({finance_request_id:id,approver_id:user?.id||null,decision,note})
    load()
  }

  return <>
    <Header title="Finance Requests" subtitle="Request → review → approval → payment" />
    <main className="app-content">
      {error && <div className="error-banner">{error}</div>}
      <div className="btn-block-row" style={{marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>{setError('');setShow(true)}}>+ New Request</button>
      </div>
      {requests.length===0 ? <div className="empty-state"><div className="emoji">🧾</div><p>No finance requests yet.</p></div> :
        requests.map(r=><div className="card" key={r.id}>
          <div className="flex-between"><strong>{r.title}</strong><span className={'badge badge-'+(r.status==='approved'?'paid':r.status==='rejected'?'unpaid':'partial')}>{r.status}</span></div>
          <div className="text-dim" style={{fontSize:13,marginTop:5}}>{r.request_type} · {formatLKR(r.amount)}{r.expense_categories?.name?' · '+r.expense_categories.name:''}</div>
          {r.description && <p style={{fontSize:13}}>{r.description}</p>}
          {isAdmin && r.status==='pending' && <div className="btn-block-row"><button className="btn btn-success" onClick={()=>decide(r.id,'approved')}>Approve</button><button className="btn btn-danger" onClick={()=>decide(r.id,'rejected')}>Reject</button></div>}
        </div>)
      }
    </main>

    {show && <div className="modal-overlay" onClick={()=>setShow(false)}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/><h2 className="modal-title">New Finance Request</h2>
        <form onSubmit={save}>
          <div className="field"><label>Request Type</label><select value={form.request_type} onChange={e=>setForm({...form,request_type:e.target.value})}><option value="expense">Expense</option><option value="supplier_payment">Supplier Payment</option><option value="transfer">Transfer</option><option value="other">Other</option></select></div>
          <div className="field"><label>Title *</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Factory payment"/></div>
          <div className="field"><label>Amount *</label><input required type="number" step="0.01" min="0.01" inputMode="decimal" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></div>
          <div className="field"><label>Category</label><select value={form.category_id||''} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Supplier / Payee</label><input value={form.supplier_name} onChange={e=>setForm({...form,supplier_name:e.target.value})}/></div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div className="btn-block-row"><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving?'Submitting...':'Submit Request'}</button></div>
        </form>
      </div>
    </div>}
  </>
}
