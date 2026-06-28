import { formatLKR, formatDate } from '../utils'

export default function InvoicePrint({ invoice, items, customer, payments }) {
  if (!invoice) return null

  const totalPaid = invoice.paid_amount || 0

  return (
    <div className="invoice-paper" id="printable-invoice">
      <div className="inv-header">
        <div>
          <p className="biz-name">Pure Custom Creation</p>
          <div className="biz-meta">
            Custom Branded Water Bottle Supply<br />
            Kandy / Nuwara Eliya District, Sri Lanka
          </div>
        </div>
        <div className="inv-meta">
          <div className="inv-no">{invoice.invoice_no}</div>
          <div>Date: {formatDate(invoice.invoice_date)}</div>
          <div style={{ textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
            {invoice.status}
          </div>
        </div>
      </div>

      <div className="cust-block">
        <div className="label">Bill To</div>
        <div className="name">{customer?.business_name}</div>
        {customer?.owner_name && <div>{customer.owner_name}</div>}
        {customer?.location && <div>{customer.location}</div>}
        {customer?.phone && <div>{customer.phone}</div>}
      </div>

      {invoice.is_settlement ? (
        <table className="inv-table">
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
        <table className="inv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Cases</th>
              <th className="num">Bottles</th>
              <th className="num">Unit Price</th>
              <th className="num">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td>{it.size} Bottle</td>
                <td className="num">{it.cases}</td>
                <td className="num">{it.bottles}</td>
                <td className="num">{formatLKR(it.unit_price_without_label)}</td>
                <td className="num">{formatLKR(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!invoice.is_settlement && (
        <div className="prepaid-note">
          Label cost already prepaid. This invoice is for bottle supply only.
        </div>
      )}

      <div className="totals-block">
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{formatLKR(invoice.subtotal)}</span>
        </div>
        <div className="totals-row">
          <span>Rounding Adjustment</span>
          <span>{formatLKR(invoice.rounding_adjustment)}</span>
        </div>
        <div className="totals-row grand">
          <span>Total Amount</span>
          <span>{formatLKR(invoice.total_amount)}</span>
        </div>
        <div className="totals-row">
          <span>Paid Amount</span>
          <span>{formatLKR(totalPaid)}</span>
        </div>
        <div className="totals-row balance">
          <span>Balance Due</span>
          <span>{formatLKR(invoice.balance_amount)}</span>
        </div>
      </div>

      {invoice.notes && invoice.notes !== 'Label cost already prepaid. This invoice is for bottle supply only.' && (
        <div style={{ marginTop: 14, fontSize: 12 }}>
          <strong>Note:</strong> {invoice.notes}
        </div>
      )}

      <div className="terms-block">
        <div className="terms-title">Terms & Conditions</div>
        <div>1. Label printing cost is paid in advance and is not included in this invoice.</div>
        <div>2. This invoice covers bottle supply cost only.</div>
        <div>3. Payment due upon delivery unless otherwise agreed.</div>
        <div>4. Please verify quantities upon receipt; claims after 24 hours will not be accepted.</div>
        <div>5. Goods once delivered are not returnable.</div>
      </div>

      <div className="sign-block">
        <div className="sign-line">Received By</div>
        <div className="sign-line">Authorized Signature</div>
      </div>
    </div>
  )
}
