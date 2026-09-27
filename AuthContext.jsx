import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)
const ADMIN_EMAIL = 'arunaprabath214@gmail.com'
const EMPLOYEE_EMAIL = 'purecustomcreation@gmail.com'
const ALLOWED_EMAILS = [ADMIN_EMAIL, EMPLOYEE_EMAIL]

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [authError, setAuthError] = useState('')

  async function loadProfile(user) {
    if (!user) { setProfile(null); return }
    const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
    setProfile(data || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      await loadProfile(sess?.user)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    setAuthError('')
    if (!ALLOWED_EMAILS.includes(email.trim().toLowerCase())) {
      setAuthError('This email is not authorized for PCC Business OS.')
      return false
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setAuthError(error.message)
    return !error
  }

  async function signUp(email, password) {
    setAuthError('')
    const normalized = email.trim().toLowerCase()
    if (!ALLOWED_EMAILS.includes(normalized)) {
      setAuthError('Only the two authorized PCC account emails can be registered.')
      return false
    }
    const { error } = await supabase.auth.signUp({ email: normalized, password })
    if (error) setAuthError(error.message)
    return !error
  }

  async function signOut() { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{
    session, profile, role: profile?.role || null, isAdmin: profile?.role === 'admin',
    signIn, signUp, signOut, authError, setAuthError
  }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
