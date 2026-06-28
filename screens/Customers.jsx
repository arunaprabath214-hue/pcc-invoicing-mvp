import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'

const emptyForm = {
  business_name: '',
  owner_name: '',
  phone: '',
  location: '',
  customer_grade: '',
  notes: '',
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function loadCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('business_name', { ascending: true })
    if (!error) setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(c) {
    setEditingId(c.id)
    setForm({
      business_name: c.business_name || '',
      owner_name: c.owner_name || '',
      phone: c.phone || '',
      location: c.location || '',
      customer_grade: c.customer_grade || '',
      notes: c.notes || '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.business_name.trim()) {
      setError('Business name is required.')
      return
    }
    setSaving(true)
    setError('')

    if (editingId) {
      const { error } = await supabase.from('customers').update(form).eq('id', editingId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('customers').insert(form)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    loadCustomers()
  }

  const filtered = customers.filter((c) =>
    c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header title="Customers" subtitle={`${customers.length} businesses`} />
      <main className="app-content">
        <div className="field" style={{ marginBottom: 16 }}>
          <input
            placeholder="🔍 Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🏪</div>
            <p>No customers yet.<br />Tap + to add your first customer.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="list-card" onClick={() => openEdit(c)}>
              <div className="list-card-main">
                <div className="list-card-title">{c.business_name}</div>
                <div className="list-card-sub">
                  {c.location || 'No location'}
                  {c.customer_grade ? ` · Grade ${c.customer_grade}` : ''}
                  {c.phone ? ` · ${c.phone}` : ''}
                </div>
              </div>
              <div className="text-faint">›</div>
            </div>
          ))
        )}
      </main>

      <button className="fab-add no-print" onClick={openAdd}>+</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="field">
                <label>Business Name *</label>
                <input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="e.g. Seema Cafe & Restaurant"
                  required
                />
              </div>
              <div className="field">
                <label>Owner Name</label>
                <input
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="07XXXXXXXX"
                  />
                </div>
                <div className="field">
                  <label>Grade</label>
                  <input
                    value={form.customer_grade}
                    onChange={(e) => setForm({ ...form, customer_grade: e.target.value })}
                    placeholder="A / B / C"
                  />
                </div>
              </div>
              <div className="field">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Kandy"
                />
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
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
