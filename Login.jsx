import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function Login() {
  const { signIn, signUp, authError, setAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setInfo('')
    setAuthError('')

    if (mode === 'signin') {
      await signIn(email, password)
    } else {
      const ok = await signUp(email, password)
      if (ok) setInfo('Account created. You can sign in now (check email if confirmation is required).')
    }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="emoji">💧</div>
          <h1>Pure Custom Creation</h1>
          <p>Bottle Supply Invoicing</p>
        </div>

        {authError && <div className="error-banner">{authError}</div>}
        {info && <div className="success-banner">{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-16">
          {mode === 'signin' ? (
            <span className="text-dim" style={{ fontSize: 13 }}>
              No account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setAuthError(''); }}>
                Create one
              </a>
            </span>
          ) : (
            <span className="text-dim" style={{ fontSize: 13 }}>
              Have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setAuthError(''); }}>
                Sign in
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
