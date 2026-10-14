import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getStoredToken, storeToken } from '../api/client'

/**
 * @typedef {Object} AppContextValue
 * @property {{id: string, email: string} | null} user - The logged-in user, or null.
 * @property {(token: string, user: {id: string, email: string}) => void} signIn
 * @property {() => void} signOut
 */

const AppContext = createContext(/** @type {AppContextValue | undefined} */ (undefined))
const USER_KEY = 'micromentor_user'

function readStoredUser() {
  try {
    if (!getStoredToken()) return null
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Holds the signed-in user for every screen. All real data (profile, mentors,
 * bookings) is loaded from the Python API, which reads/writes Supabase.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AppProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const signIn = useCallback((token, nextUser) => {
    storeToken(token)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    } catch {
      /* ignore */
    }
    setUser(nextUser)
  }, [])

  const signOut = useCallback(() => {
    storeToken(null)
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
  }, [])

  // The API client fires this when the server says the token is no longer valid.
  useEffect(() => {
    window.addEventListener('micromentor:logout', signOut)
    return () => window.removeEventListener('micromentor:logout', signOut)
  }, [signOut])

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/** @returns {AppContextValue} */
export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider')
  return ctx
}
