import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

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
        setUser(user)
        localStorage.setItem('carefund_user', JSON.stringify(user))
      })
      .catch(() => {
        localStorage.removeItem('carefund_token')
        localStorage.removeItem('carefund_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, token) => {
    const user = { ...userData, id: userData.id || userData._id }
    setUser(user)
    localStorage.setItem('carefund_user', JSON.stringify(user))
    localStorage.setItem('carefund_token', token)
  }

  const updateUser = (userData) => {
    const user = { ...userData, id: userData.id || userData._id }
    setUser(user)
    localStorage.setItem('carefund_user', JSON.stringify(user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('carefund_token')
    localStorage.removeItem('carefund_user')
  }

  const isEmployee = user?.role === 'employee'
  const isDonor = user?.role === 'donor'
  const isCampaigner = user?.role === 'campaigner'
  const isHospitalAdmin = user?.role === 'hospital_admin'
  const needsVerification =
    (isEmployee || isHospitalAdmin) && !user?.isVerified

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        loading,
        isEmployee,
        isDonor,
        isCampaigner,
        isHospitalAdmin,
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
