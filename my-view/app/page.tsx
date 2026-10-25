"use client";

import { useMemo, useState } from "react";

type Tab = "Customer" | "Delivery" | "Payments" | "Customer Report";
type Customer = { id: string; name: string; contact: string; phone: string; status: "Lead" | "Active" };
type Line = { product: string; qty: number; price: number };
type Delivery = { id: string; customerId: string; date: string; lines: Line[]; total: number; invoiceId: string; paid: number };
type Receipt = { id: string; customerId: string; date: string; amount: number; method: string; invoiceId: string };
const money = (n: number) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 }).format(n);
const today = () => new Date().toISOString().slice(0, 10);
const products = [{name:"Customized Bottle 330ml",price:85},{name:"Customized Bottle 500ml",price:120},{name:"Customized Bottle 1L",price:180}];

export default function HomePage() {
  const [tab,setTab] = useState<Tab>("Customer");
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [deliveries,setDeliveries] = useState<Delivery[]>([]);
  const [receipts,setReceipts] = useState<Receipt[]>([]);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [mode,setMode] = useState<"lead"|"active">("lead");
  const [name,setName] = useState("");
  const [contact,setContact] = useState("");
  const [phone,setPhone] = useState("");
  const [query,setQuery] = useState("");
  const [selected,setSelected] = useState("");
  const [date,setDate] = useState(today());
  const [product,setProduct] = useState(products[1].name);
  const [qty,setQty] = useState("100");
  const [price,setPrice] = useState(String(products[1].price));
  const [lines,setLines] = useState<Line[]>([]);
  const [receiptAmount,setReceiptAmount] = useState("");
  const [method,setMethod] = useState("Bank transfer");
  const [reportDelivery,setReportDelivery] = useState("");
  const [invoiceSent,setInvoiceSent] = useState(false);
  const activeCustomers = customers.filter(c=>c.status==="Active");
  const filteredCustomers = customers.filter(c=>(c.name+" "+c.phone+" "+c.contact).toLowerCase().includes(query.toLowerCase()));
  const selectedCustomer = customers.find(c=>c.id===selected);
  const deliveryTotal = lines.reduce((s,l)=>s+l.qty*l.price,0);
  const selectedDelivery = deliveries.find(d=>d.id===reportDelivery);
  const allocatedByInvoice = (invoiceId:string) => receipts.filter(r=>r.invoiceId===invoiceId).reduce((s,r)=>s+r.amount,0);
  const outstanding = deliveries.reduce((s,d)=>s+Math.max(0,d.total-allocatedByInvoice(d.invoiceId)),0);
  const totalCollected = receipts.reduce((s,r)=>s+r.amount,0);
  const dueInvoices = deliveries.filter(d=>d.total>allocatedByInvoice(d.invoiceId));
  const customerCredit = (customerId:string) => receipts.filter(r=>r.customerId===customerId&&!r.invoiceId).reduce((s,r)=>s+r.amount,0);
  const selectedBalance = selectedDelivery ? Math.max(0,selectedDelivery.total-allocatedByInvoice(selectedDelivery.invoiceId)) : 0;
  const resetMessages=()=>{setMessage("");setError("")};

  function saveCustomer() {
    resetMessages();
    if(!name.trim()||!contact.trim()||!phone.trim()){setError("Business name, contact person and phone number are required.");return;}
    if(customers.some(c=>c.phone.trim()===phone.trim())){setError("A record with this phone number already exists. Search existing customers before adding another.");return;}
    const id=(mode==="lead"?"LEAD-":"CUS-")+Date.now().toString().slice(-7);
    setCustomers(prev=>[...prev,{id,name:name.trim(),contact:contact.trim(),phone:phone.trim(),status:mode==="lead"?"Lead":"Active"}]);
    setMessage(mode==="lead"?"Lead saved in this demo session.":"Active customer saved in this demo session.");
    setName("");setContact("");setPhone("");
  }
  function convertLead(id:string) {
    resetMessages();setCustomers(prev=>prev.map(c=>c.id===id?{...c,status:"Active"}:c));setMessage("Lead converted to active customer in this demo session.");
  }
  function addLine() {
    resetMessages();const q=Number(qty),p=Number(price);
    if(!Number.isFinite(q)||q<=0||!Number.isFinite(p)||p<0){setError("Enter a positive quantity and a valid non-negative unit price.");return;}
    setLines(prev=>[...prev,{product,qty:q,price:p}]);
  }
  function saveDelivery() {
    resetMessages();
    if(!selectedCustomer||selectedCustomer.status!=="Active"){setError("Select an active customer.");return;}
    if(!lines.length){setError("Add at least one product line.");return;}
    const id="DEL-"+Date.now().toString().slice(-7), invoiceId="INV-"+Date.now().toString().slice(-7);
    setDeliveries(prev=>[...prev,{id,customerId:selectedCustomer.id,date,lines:[...lines],total:deliveryTotal,invoiceId,paid:0}]);
    setReportDelivery(id);setMessage("Demo delivery and invoice created in this browser session. No production data was saved.");
    setLines([]);setQty("100");setTab("Customer Report");
  }
  function saveReceipt() {
    resetMessages();const amount=Number(receiptAmount);
    if(!selectedCustomer){setError("Select a customer first.");return;}
    if(!Number.isFinite(amount)||amount<=0){setError("Enter a valid payment amount.");return;}
    const invoiceId=reportDelivery?deliveries.find(d=>d.id===reportDelivery)?.invoiceId||"": "";
    if(invoiceId && amount>Math.max(0,(deliveries.find(d=>d.id===reportDelivery)?.total||0)-allocatedByInvoice(invoiceId))){setError("Payment is higher than the selected invoice balance. Record the excess as unallocated credit instead.");return;}
    setReceipts(prev=>[...prev,{id:"REC-"+Date.now().toString().slice(-7),customerId:selectedCustomer.id,date,amount,method,invoiceId}]);
    setMessage("Receipt recorded in this demo session only.");setReceiptAmount("");
  }

  return <main className="app">
    <header className="header"><div className="logo">P</div><div className="brand"><h1>PCC MY VIEW</h1><p>Sales representative workspace · LKR · Asia/Colombo</p></div><span className="demo">DEMO MODE</span></header>
    <div className="notice"><strong>Demo only.</strong> Records exist only in this browser session and are not saved to PCC MY STORAGE. Use fictional information only. No data is sent to customers.</div>
    <nav className="tabs" aria-label="Main navigation">{(["Customer","Delivery","Payments","Customer Report"] as Tab[]).map(t=><button key={t} className={"tab "+(tab===t?"active":"")} onClick={()=>{setTab(t);resetMessages()}}>{t}</button>)}</nav>
    {(message||error)&&<div className={error?"error":"success"} role="status">{error||message}</div>}
    <div className="layout"><section className="panel">
      {tab==="Customer"&&<><h2>Customer</h2><p className="sub">Register new leads, manage active customers, and start deliveries.</p>
        <div className="actions"><button className={"btn "+(mode==="lead"?"primary":"")} onClick={()=>setMode("lead")}>＋ New lead</button><button className={"btn "+(mode==="active"?"primary":"")} onClick={()=>setMode("active")}>＋ Active customer</button><button className="btn" onClick={()=>{setTab("Delivery");setSelected(activeCustomers[0]?.id||"")}}>Existing customer delivery →</button></div>
        <div className="grid"><div className="field"><label>Business name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Bean & Brew Cafe"/></div><div className="field"><label>Contact person *</label><input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Full name"/></div><div className="field"><label>Phone number *</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07X XXX XXXX" inputMode="tel"/></div><div className="field"><label>Record type</label><select value={mode} onChange={e=>setMode(e.target.value as "lead"|"active")}><option value="lead">Save as lead</option><option value="active">Save as active customer</option></select></div></div>
        <div className="actions"><button className="btn primary" onClick={saveCustomer}>Save {mode==="lead"?"lead":"customer"}</button></div>
        <div className="divider"/><div className="row"><h3>Customer records</h3><input aria-label="Search customers" placeholder="Search name, contact, phone…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="list" style={{marginTop:14}}>{filteredCustomers.length?filteredCustomers.map(c=><div className="item" key={c.id}><div className="itemmain"><strong>{c.name}</strong><small>{c.contact} · {c.phone} · {c.id}</small></div><span className={"pill "+(c.status==="Active"?"green":"")}>{c.status}</span>{c.status==="Lead"&&<button className="btn tiny" onClick={()=>convertLead(c.id)}>Activate</button>}{c.status==="Active"&&<button className="btn tiny" onClick={()=>{setSelected(c.id);setTab("Delivery")}}>Delivery</button>}</div>):<div className="empty">No customer records in this demo session yet. Register a lead above.</div>}</div>
      </>}
      {tab==="Delivery"&&<><h2>Delivery</h2><p className="sub">Record the stock supplied to an active customer. An invoice is created separately from the delivery.</p>
        <div className="grid"><div className="field"><label>Select active customer *</label><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose customer</option>{activeCustomers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="field"><label>Delivery date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div></div>
        <div className="divider"/><h3>Add delivery item</h3><div className="lineitem"><div className="field"><label>Product</label><select value={product} onChange={e=>{setProduct(e.target.value);setPrice(String(products.find(p=>p.name===e.target.value)?.price||0))}}>{products.map(p=><option key={p.name}>{p.name}</option>)}</select></div><div className="field"><label>Quantity</label><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></div><div className="field"><label>Unit price (LKR)</label><input type="number" min="0" step=".01" value={price} onChange={e=>setPrice(e.target.value)}/></div><button className="btn tiny" onClick={addLine}>Add item</button></div>
        <div className="list">{lines.map((l,i)=><div className="item" key={i}><div className="itemmain"><strong>{l.product}</strong><small>{l.qty} × {money(l.price)}</small></div><span className="money">{money(l.qty*l.price)}</span><button className="btn tiny" onClick={()=>setLines(prev=>prev.filter((_,n)=>n!==i))}>Remove</button></div>)}</div>
        <div className="divider"/><div className="row"><span className="muted">Delivery total</span><strong className="money">{money(deliveryTotal)}</strong></div><p className="help">Demo catalogue and prices are fictional. Production product catalogue and stock/cost rules will come from the controlled backend.</p>
        <div className="actions" style={{marginTop:18}}><button className="btn primary" onClick={saveDelivery}>Confirm delivery & prepare invoice</button></div>
        <div className="divider"/><h3>Recent deliveries</h3><div className="list" style={{marginTop:12}}>{deliveries.length?deliveries.map(d=><div className="item" key={d.id}><div className="itemmain"><strong>{d.id} · {customers.find(c=>c.id===d.customerId)?.name||"Customer"}</strong><small>{d.date} · Invoice {d.invoiceId}</small></div><span className="money">{money(d.total)}</span></div>):<div className="empty">No deliveries in this demo session yet.</div>}</div>
      </>}
      {tab==="Payments"&&<><h2>Payments</h2><p className="sub">Record customer receipts. Production allocation rules will be enforced by the backend.</p>
        <div className="grid"><div className="field"><label>Payment date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="field"><label>Customer</label><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.status}</option>)}</select></div><div className="field"><label>Amount received (LKR)</label><input type="number" min="0.01" step=".01" value={receiptAmount} onChange={e=>setReceiptAmount(e.target.value)} placeholder="0.00"/></div><div className="field"><label>Payment method</label><select value={method} onChange={e=>setMethod(e.target.value)}><option>Bank transfer</option><option>Cash</option><option>Cheque</option><option>Other</option></select></div><div className="field wide"><label>Invoice allocation</label><select value={reportDelivery} onChange={e=>setReportDelivery(e.target.value)}><option value="">Unallocated customer credit / advance</option>{deliveries.filter(d=>d.customerId===selected&&d.total>allocatedByInvoice(d.invoiceId)).map(d=><option key={d.id} value={d.id}>{d.invoiceId} · balance {money(d.total-allocatedByInvoice(d.invoiceId))}</option>)}</select></div></div>
        <div className="actions"><button className="btn primary" onClick={()=>{if(reportDelivery){const d=deliveries.find(x=>x.id===reportDelivery);if(d)setReportDelivery(d.id)}saveReceipt()}}>Record receipt (demo)</button></div>
        <div className="divider"/><h3>Receipts</h3><div className="list" style={{marginTop:12}}>{receipts.length?receipts.map(r=><div className="item" key={r.id}><div className="itemmain"><strong>{r.id} · {customers.find(c=>c.id===r.customerId)?.name}</strong><small>{r.date} · {r.method} · {r.invoiceId||"Unallocated credit"}</small></div><span className="money">{money(r.amount)}</span></div>):<div className="empty">No receipts recorded in this demo session.</div>}</div>
      </>}
      {tab==="Customer Report"&&<><h2>Customer report</h2><p className="sub">Generate a delivery-specific summary. Use print preview to save as PDF.</p>
        <div className="field"><label>Select delivery</label><select value={reportDelivery} onChange={e=>setReportDelivery(e.target.value)}><option value="">Choose delivery</option>{deliveries.map(d=><option key={d.id} value={d.id}>{d.id} · {customers.find(c=>c.id===d.customerId)?.name} · {d.date}</option>)}</select></div>
        {selectedDelivery?<div className="report" id="customer-report"><div className="statement-brand"><div className="statement-mark">PCC</div><div className="statement-company"><h3>PURE CUSTOM CREATION</h3><p>Custom branding · Bottled water · Business supplies</p></div><div className="statement-kind"><span>CUSTOMER STATEMENT</span><strong>DELIVERY NOTE</strong></div></div><div className="statement-title"><div><span className="eyebrow">DELIVERY SUMMARY</span><h2>Customer Delivery Statement</h2><p>Thank you for your business. Please find the delivery details below.</p></div><div className="statement-ref"><span>DELIVERY REFERENCE</span><strong>{selectedDelivery.id}</strong><small>{selectedDelivery.date}</small></div></div><div className="statement-meta"><div><span>BILLED TO</span><strong>{customers.find(c=>c.id===selectedDelivery.customerId)?.name}</strong><small>{customers.find(c=>c.id===selectedDelivery.customerId)?.contact}</small><small>{customers.find(c=>c.id===selectedDelivery.customerId)?.phone}</small></div><div><span>INVOICE NUMBER</span><strong>{selectedDelivery.invoiceId}</strong><small>Currency: Sri Lankan Rupees (LKR)</small></div></div><table className="statement-table"><thead><tr><th>DESCRIPTION</th><th>QTY</th><th>UNIT PRICE</th><th>LINE TOTAL</th></tr></thead><tbody>{selectedDelivery.lines.map((l,i)=><tr key={i}><td><strong>{l.product}</strong><small>Supplied by Pure Custom Creation</small></td><td>{l.qty.toLocaleString("en-LK")}</td><td>{money(l.price)}</td><td><strong>{money(l.qty*l.price)}</strong></td></tr>)}</tbody></table><div className="statement-bottom"><div className="statement-note"><strong>Thank you for choosing Pure Custom Creation.</strong><p>Thank you for choosing Pure Custom Creation. Please notify us of any delivery issues or discrepancies within three (3) days of delivery.</p><p>Payment is due within three (3) days of delivery. Payments delayed beyond this period may incur a late fee in accordance with the agreed PCC payment terms.</p></div><div className="statement-totals"><div><span>Invoice total</span><strong>{money(selectedDelivery.total)}</strong></div><div><span>Payments received</span><strong>{money(allocatedByInvoice(selectedDelivery.invoiceId))}</strong></div><div className="statement-balance"><span>Outstanding balance</span><strong>{money(selectedBalance)}</strong></div></div></div><div className="statement-bank"><div className="statement-bank-title"><strong>PAYMENT DETAILS</strong><span>People’s Bank · Bank transfer or QR payment</span></div><div className="statement-bank-grid"><div><span>Bank</span><strong>People’s Bank</strong></div><div><span>Branch</span><strong>Kandy City Center</strong></div><div><span>Account holder</span><strong>MR K G A PRABATH</strong></div><div><span>Account number</span><strong>357200140009618</strong></div><div className="bank-reference"><span>People Pay ID</span><strong>7135457634</strong></div><div className="bank-reference"><span>Payment reference</span><strong>{selectedDelivery.invoiceId}</strong></div></div><div className="statement-qr"><img className="statement-qr-image" src="/payment-qr.jpg" alt="PCC payment QR code" /><p>You can scan the QR code using your bank’s mobile app or a supported digital wallet to pay the required amount. Please verify the amount and recipient details before confirming the payment.</p></div><p>Please use the invoice number as your payment reference and share the transaction confirmation with PCC.</p></div><div className="statement-footer"><span>PURE CUSTOM CREATION</span><span>Customer copy · {selectedDelivery.invoiceId}</span></div></div>:<div className="empty">Create a demo delivery first, then select it here to preview its report.</div>}
        <div className="actions no-print" style={{marginTop:16}}><button className="btn primary" disabled={!selectedDelivery} onClick={()=>window.print()}>Print / Save as PDF</button></div>
      </>}
    </section>
    <aside className="sidecard"><h3>Workspace summary</h3><div className="metric"><span>Active customers</span><strong>{activeCustomers.length}</strong></div><div className="metric"><span>Leads</span><strong>{customers.filter(c=>c.status==="Lead").length}</strong></div><div className="metric"><span>Deliveries recorded</span><strong>{deliveries.length}</strong></div><div className="metric"><span>Customer receipts</span><strong>{money(totalCollected)}</strong></div><div className="metric"><span>Outstanding demo invoices</span><strong>{money(outstanding)}</strong></div><p className="help">Figures update from the current browser session only. Refreshing the page clears all demo records. No production storage is connected.</p><div className="divider"/><h3>Quick actions</h3><div className="list"><button className="btn" onClick={()=>{setTab("Customer");setMode("lead")}}>＋ Register lead</button><button className="btn" onClick={()=>setTab("Delivery")}>＋ New delivery</button><button className="btn" onClick={()=>setTab("Payments")}>＋ Record payment</button><button className="btn" onClick={()=>setTab("Customer Report")}>▤ Customer report</button></div></aside></div>
    <footer className="help" style={{textAlign:"center",padding:"24px 0 8px"}}>PCC MY VIEW · Internal demo prototype · Production database, authentication, permissions and audit controls are not connected.</footer>
  </main>;
}