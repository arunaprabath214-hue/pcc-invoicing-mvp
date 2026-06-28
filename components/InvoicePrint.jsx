import { formatLKR, formatDate } from '../utils'

const COMPANY = {
  name: 'PURE CUSTOM CREATION',
  tagline: 'Custom Branded Water Bottle Supply',
  address: 'Kandy, Sri Lanka',
  phone: '+94 76 188 2745',
  email: 'purecustomcreation@gmail.com',
  payment: 'Payment due upon delivery unless otherwise agreed.',
}

export default function InvoicePrint({ invoice, items, customer }) {
  if (!invoice) return null

  const totalPaid = invoice.paid_amount || 0
  const isPaid = Number(invoice.balance_amount || 0) <= 0
  const isSettlement = Boolean(invoice.is_settlement)
  const title = isSettlement ? 'SETTLEMENT' : 'INVOICE'

  return (
    <div className="invoice-paper luxury-invoice" id="printable-invoice">
      <div className="luxury-topline" />

      <header className="luxury-header">
        <div className="brand-block">
          <div className="brand-mark">PCC</div>
          <div>
            <h1>{COMPANY.name}</h1>
            <p>{COMPANY.tagline}</p>
            <p>{COMPANY.address}</p>
          </div>
        </div>

        <div className="doc-title-block">
          <div className="doc-title">{title}</div>
          <div className={isPaid ? 'status-pill paid' : 'status-pill unpaid'}>
            {isPaid ? 'PAID' : 'UNPAID'}
          </div>
        </div>
      </header>

      <section className="invoice-info-grid">
        <div className="info-card bill-to-card">
          <div className="small-label">Invoice To</div>
          <div className="customer-name">{customer?.business_name}</div>
          {customer?.owner_name && <div>{customer.owner_name}</div>}
          {customer?.location && <div>{customer.location}</div>}
          {customer?.phone && <div>{customer.phone}</div>}
        </div>

        <div className="info-card invoice-meta-card">
          <div className="meta-row"><span>Invoice No</span><strong>{invoice.invoice_no}</strong></div>
          <div className="meta-row"><span>Date</span><strong>{formatDate(invoice.invoice_date)}</strong></div>
          <div className="meta-row"><span>Payment Terms</span><strong>{isSettlement ? 'Settlement' : 'Due on Delivery'}</strong></div>
          <div className="meta-row"><span>Reference</span><strong>{isSettlement ? 'Previous Balance' : 'Bottle Supply'}</strong></div>
        </div>
      </section>

      {isSettlement ? (
        <table className="luxury-table settlement-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td>{it.description}</td>
                <td className="num">{formatLKR(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="num">Cases</th>
                <th className="num">Bottles</th>
                <th className="num">Unit Price</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.size} Branded Water Bottle</td>
                  <td className="num">{it.cases}</td>
                  <td className="num">{it.bottles}</td>
                  <td className="num">{formatLKR(it.unit_price_without_label)}</td>
                  <td className="num">{formatLKR(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="prepaid-note luxury-note">
            Label cost already prepaid. This invoice is for bottle supply only.
          </div>
        </>
      )}

      <section className="invoice-lower-grid">
        <div className="notes-panel">
          <div className="notes-title">Notes / Terms & Conditions</div>
          {isSettlement ? (
            <ol>
              <li>This bill is issued for previous outstanding settlement only.</li>
              <li>Settlement must be completed as agreed before future supply continues.</li>
              <li>This settlement does not change current bottle supply prices.</li>
            </ol>
          ) : (
            <ol>
              <li>Label printing cost is prepaid and is not included in this invoice.</li>
              <li>This invoice covers bottle supply cost only.</li>
              <li>Payment due upon delivery unless otherwise agreed in writing.</li>
              <li>Cap colour and stock availability are subject to factory availability.</li>
              <li>Goods are considered accepted once received and verified.</li>
            </ol>
          )}
        </div>

        <div className="totals-panel">
          <div className="totals-row"><span>Subtotal</span><span>{formatLKR(invoice.subtotal)}</span></div>
          <div className="totals-row"><span>Discount</span><span>{formatLKR(0)}</span></div>
          <div className="totals-row"><span>Rounding</span><span>{formatLKR(invoice.rounding_adjustment)}</span></div>
          <div className="totals-row"><span>Paid Amount</span><span>{formatLKR(totalPaid)}</span></div>
          <div className="totals-row"><span>Balance Due</span><span>{formatLKR(invoice.balance_amount)}</span></div>
          <div className="totals-row grand"><span>Grand Total</span><span>{formatLKR(invoice.total_amount)}</span></div>
        </div>
      </section>

      {invoice.notes && invoice.notes !== 'Label cost already prepaid. This invoice is for bottle supply only.' && (
        <div className="invoice-note-line"><strong>Note:</strong> {invoice.notes}</div>
      )}

      <section className="payment-sign-grid">
        <div className="payment-details">
          <div className="small-label">Payment Details</div>
          <div>{COMPANY.payment}</div>
          <div>Contact: {COMPANY.phone}</div>
          <div>Email: {COMPANY.email}</div>
        </div>

        <div className="signature-area">
          <div className="signature-line"><span>Received By</span></div>
          <div className="signature-line"><span>Authorized Signature</span></div>
        </div>
      </section>

      <footer className="luxury-footer">
        <span>{COMPANY.phone}</span>
        <span>{COMPANY.address}</span>
        <span>{COMPANY.name}</span>
      </footer>
    </div>
  )
}
