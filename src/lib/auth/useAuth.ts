import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './context'

/** The session, for any component that needs to know who is signed in. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
