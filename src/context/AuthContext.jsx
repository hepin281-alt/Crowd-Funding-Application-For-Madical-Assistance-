import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

function normalizeRole(role) {
  if (role === 'admin') return 'super_admin'
  if (role === 'donor' || role === 'campaigner') return 'user'
  return role
}

function normalizeUser(userData) {
  const rawRole = userData?.originalRole || userData?.rawRole || userData?.role
  return {
    ...userData,
    id: userData?.id || userData?._id,
    originalRole: rawRole,
    role: normalizeRole(rawRole),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('carefund_token')
    const storedUser = localStorage.getItem('carefund_user')
    if (!token) {
      setLoading(false)
      return
    }
    api.auth
      .me()
      .then(({ user }) => {
        const normalizedUser = normalizeUser(user)
        setUser(normalizedUser)
        localStorage.setItem('carefund_user', JSON.stringify(normalizedUser))
      })
      .catch(() => {
        localStorage.removeItem('carefund_token')
        localStorage.removeItem('carefund_user')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return

    const ping = () => {
      api.auth.ping().catch(() => {
        // Ignore heartbeat failures; normal auth flow handles invalid sessions.
      })
    }

    ping()
    const timer = setInterval(ping, 30000)

    return () => clearInterval(timer)
  }, [user])

  const login = (userData, token) => {
    const user = normalizeUser(userData)
    setUser(user)
    localStorage.setItem('carefund_user', JSON.stringify(user))
    localStorage.setItem('carefund_token', token)
  }

  const updateUser = (userData) => {
    const user = normalizeUser(userData)
    setUser(user)
    localStorage.setItem('carefund_user', JSON.stringify(user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('carefund_token')
    localStorage.removeItem('carefund_user')
  }

  const isAdmin = user?.role === 'hospital_admin'
  const isUser = user?.role === 'user'
  const isSuperAdmin = user?.role === 'super_admin'
  const isDonor = user?.originalRole === 'donor' || (user?.role === 'user' && user?.originalRole !== 'campaigner')
  const isCampaigner = user?.originalRole === 'campaigner' || user?.role === 'user'
  const needsVerification = !user?.is_verified

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        loading,
        isAdmin,
        isUser,
        isSuperAdmin,
        isDonor,
        isCampaigner,
        needsVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
