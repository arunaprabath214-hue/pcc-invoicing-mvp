import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import BottomNav from './components/BottomNav'
import InvoiceGenerator from './screens/InvoiceGenerator'
import Customers from './screens/Customers'
import Products from './screens/Products'
import CustomerPrices from './screens/CustomerPrices'
import Payments from './screens/Payments'
import Ledger from './screens/Ledger'

function AppRoutes() {
  const { session } = useAuth()

  if (session === undefined) {
    return (
      <div className="loading-state" style={{ paddingTop: '40vh' }}>
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<InvoiceGenerator />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/prices" element={<CustomerPrices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
