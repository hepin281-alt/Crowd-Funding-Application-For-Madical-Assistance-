import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyIdentity from './pages/VerifyIdentity'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import CampaignCreate from './pages/CampaignCreate'
import Dashboard from './pages/Dashboard'
import AdminPendingVerification from './pages/AdminPendingVerification'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, needsVerification } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  // Check if user has the allowed role
  let hasAllowedRole = false
  if (allowedRole === 'admin') {
    // Admins can be either 'admin' or 'hospital_admin'
    hasAllowedRole = user.role === 'admin' || user.role === 'hospital_admin'
  } else if (allowedRole === 'user') {
    hasAllowedRole = user.role === 'user'
  }

  if (allowedRole && !hasAllowedRole) {
    const routes = { user: '/dashboard', admin: '/admin-dashboard', hospital_admin: '/admin-dashboard' }
    return <Navigate to={routes[user.role] || '/'} replace />
  }

  if (needsVerification && (allowedRole === 'admin' || user.role === 'hospital_admin')) {
    // Hospital admins go to pending verification page, regular admins to verify-identity
    if (user.role === 'hospital_admin') {
      return <Navigate to="/admin-pending-verification" replace />
    } else {
      return <Navigate to="/verify-identity" replace />
    }
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="verify-identity" element={<VerifyIdentity />} />
        <Route path="admin-pending-verification" element={<AdminPendingVerification />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute allowedRole="user">
              <CampaignCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
