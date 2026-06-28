import { formatLKR, formatDate } from '../utils'

const COMPANY = {
  nameTop: 'PURE',
  nameBottom: 'CUSTOM CREATION',
  legalName: 'PURE CUSTOM CREATION',
  tagline: 'Bottled Branding | Labels | Packaging Support',
  descriptor: 'Customized branded water bottles, labels, packaging and brand support',
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
      <div className="brand-ribbon">
        <span>Premium Brand Supply</span>
        <span>{COMPANY.address}</span>
      </div>

      <header className="luxury-header refined-header">
        <div className="brand-block refined-brand">
          <div className="monogram-frame">
            <span>P</span>
            <i />
            <span>C</span>
          </div>
          <div className="wordmark-block">
            <div className="wordmark-primary">{COMPANY.nameTop}</div>
            <div className="wordmark-secondary">{COMPANY.nameBottom}</div>
            <div className="brand-tagline">{COMPANY.tagline}</div>
            <div className="brand-descriptor">{COMPANY.descriptor}</div>
          </div>
        </div>

        <div className="doc-title-block refined-doc-title">
          <div className="doc-title">{title}</div>
          <div className={isPaid ? 'status-pill paid' : 'status-pill unpaid'}>
            {isPaid ? 'Paid' : 'Unpaid'}
          </div>
        </div>
      </header>

      <section className="invoice-info-grid refined-info-grid">
        <div className="info-card bill-to-card">
          <div className="small-label">Prepared For</div>
          <div className="customer-name">{customer?.business_name}</div>
          {customer?.owner_name && <div>{customer.owner_name}</div>}
          {customer?.location && <div>Delivery Location: {customer.location}</div>}
          {customer?.phone && <div>Contact: {customer.phone}</div>}
        </div>

        <div className="info-card invoice-meta-card refined-meta-card">
          <div className="meta-row"><span>Document No</span><strong>{invoice.invoice_no}</strong></div>
          <div className="meta-row"><span>Issue Date</span><strong>{formatDate(invoice.invoice_date)}</strong></div>
          <div className="meta-row"><span>Terms</span><strong>{isSettlement ? 'Settlement' : 'Due on Delivery'}</strong></div>
          <div className="meta-row"><span>Service</span><strong>{isSettlement ? 'Previous Balance' : 'Bottle Supply'}</strong></div>
        </div>
      </section>

      {isSettlement ? (
        <table className="luxury-table settlement-table refined-table">
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
          <table className="luxury-table refined-table">
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

          <div className="prepaid-note refined-note">
            Label cost already prepaid. This document covers bottle supply only.
          </div>
        </>
      )}

      <section className="invoice-lower-grid refined-lower-grid">
        <div className="notes-panel refined-notes">
          <div className="notes-title">Business Terms</div>
          {isSettlement ? (
            <ol>
              <li>This document is issued for previous outstanding settlement only.</li>
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

        <div className="totals-panel refined-totals">
          <div className="totals-row"><span>Subtotal</span><span>{formatLKR(invoice.subtotal)}</span></div>
          <div className="totals-row"><span>Discount</span><span>{formatLKR(0)}</span></div>
          <div className="totals-row"><span>Rounding</span><span>{formatLKR(invoice.rounding_adjustment)}</span></div>
          <div className="totals-row"><span>Paid Amount</span><span>{formatLKR(totalPaid)}</span></div>
          <div className="totals-row"><span>Balance Due</span><span>{formatLKR(invoice.balance_amount)}</span></div>
          <div className="totals-row grand"><span>Total Payable</span><span>{formatLKR(invoice.total_amount)}</span></div>
        </div>
      </section>

      {invoice.notes && invoice.notes !== 'Label cost already prepaid. This invoice is for bottle supply only.' && (
        <div className="invoice-note-line"><strong>Note:</strong> {invoice.notes}</div>
      )}

      <section className="payment-sign-grid refined-payment-grid">
        <div className="payment-details refined-payment">
          <div className="small-label">Payment Details</div>
          <div>{COMPANY.payment}</div>
          <div>{COMPANY.phone}</div>
          <div>{COMPANY.email}</div>
        </div>

        <div className="signature-area refined-signatures">
          <div className="signature-line"><span>Received By</span></div>
          <div className="signature-line"><span>Authorized Signature</span></div>
        </div>
      </section>

      <footer className="luxury-footer refined-footer">
        <span>Thank you for choosing {COMPANY.legalName}</span>
      </footer>
    </div>
  )
}
