import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Header from '../components/Header'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('case_qty', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  return (
    <>
      <Header title="Products" subtitle="Bottle sizes & case quantities" />
      <main className="app-content">
        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="card">
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{p.size}</div>
                  <div className="text-dim" style={{ fontSize: 13 }}>{p.product_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{p.case_qty}</div>
                  <div className="text-faint" style={{ fontSize: 11 }}>bottles / case</div>
                </div>
              </div>
            </div>
          ))
        )}
        <p className="text-faint" style={{ fontSize: 12, marginTop: 16 }}>
          Case quantity rules are fixed: 500ml = 28/case, 1000ml = 15/case, 1500ml = 12/case.
        </p>
      </main>
    </>
  )
}
