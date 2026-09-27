import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function Login() {
  const { signIn, signUp, authError, setAuthError } = useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [mode,setMode]=useState('signin')
  const [loading,setLoading]=useState(false)
  const [info,setInfo]=useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setInfo(''); setAuthError('')
    if (mode==='signin') await signIn(email,password)
    else if (await signUp(email,password)) setInfo('Account created. Check email if confirmation is enabled, then sign in.')
    setLoading(false)
  }

  return <div className="auth-screen"><div className="auth-box">
    <div className="auth-logo"><div className="emoji">💧</div><h1>Pure Custom Creation</h1><p>Business OS</p></div>
    {authError && <div className="error-banner">{authError}</div>}
    {info && <div className="success-banner">{info}</div>}
    <form onSubmit={handleSubmit}>
      <div className="field"><label>Email</label><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="PCC account email" required /></div>
      <div className="field"><label>Password</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required /></div>
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Please wait...':mode==='signin'?'Sign In':'Create Account'}</button>
    </form>
    <div className="text-center mt-16">
      {mode==='signin'
        ? <span className="text-dim" style={{fontSize:13}}>First setup? <a href="#" onClick={e=>{e.preventDefault();setMode('signup');setAuthError('')}}>Create authorized account</a></span>
        : <span className="text-dim" style={{fontSize:13}}>Already registered? <a href="#" onClick={e=>{e.preventDefault();setMode('signin');setAuthError('')}}>Sign in</a></span>}
    </div>
  </div></div>
}