import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🧾', label: 'Invoice', end: true },
  { to: '/customers', icon: '🏪', label: 'Customers' },
  { to: '/prices', icon: '🏷️', label: 'Prices' },
  { to: '/payments', icon: '💵', label: 'Payments' },
  { to: '/ledger', icon: '📒', label: 'Ledger' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav no-print">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
