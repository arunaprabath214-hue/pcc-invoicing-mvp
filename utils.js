export function formatLKR(amount) {
  const n = Number(amount) || 0
  return 'Rs. ' + n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
