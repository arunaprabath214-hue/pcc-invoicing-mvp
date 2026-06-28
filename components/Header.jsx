import { useAuth } from '../AuthContext'

export default function Header({ title, subtitle }) {
  const { signOut } = useAuth()
  return (
    <header className="app-header no-print">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      <button className="icon-btn" onClick={signOut} title="Sign out">
        ⏻
      </button>
    </header>
  )
}
