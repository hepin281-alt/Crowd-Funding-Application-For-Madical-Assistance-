import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PartnerWithUs from './pages/PartnerWithUs'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Campaigns from './pages/Campaigns'
import DonorCampaigns from './pages/DonorCampaigns'
import CampaignDetail from './pages/CampaignDetail'
import CampaignCreate from './pages/CampaignCreate'
import InvoiceUpload from './pages/InvoiceUpload'
import Dashboard from './pages/Dashboard'
import HospitalAdminDashboard from './pages/HospitalAdminDashboard'
import ReceiptDetail from './pages/ReceiptDetail'
import HospitalVerify from './pages/HospitalVerify'
import AdminPendingVerification from './pages/AdminPendingVerification'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminHospitals from './pages/SuperAdminHospitals'
import SuperAdminAdmins from './pages/SuperAdminAdmins'
import SuperAdminAdminDetail from './pages/SuperAdminAdminDetail'
import SuperAdminCampaigns from './pages/SuperAdminCampaigns'
import SuperAdminFinance from './pages/SuperAdminFinance'
import SuperAdminSettings from './pages/SuperAdminSettings'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, needsVerification, isDonor } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  // Check if user has the allowed role
  let hasAllowedRole = false
  if (allowedRole === 'hospital_admin') {
    hasAllowedRole = user.role === 'hospital_admin'
  } else if (allowedRole === 'user') {
    hasAllowedRole = user.role === 'user' || user.role === 'donor' || user.role === 'campaigner'
  } else if (allowedRole === 'super_admin') {
    hasAllowedRole = user.role === 'super_admin'
  } else {
    hasAllowedRole = true
  }

  if (allowedRole && !hasAllowedRole) {
    const routes = {
      user: '/dashboard',
      donor: '/dashboard',
      campaigner: '/dashboard',
      hospital_admin: '/admin-dashboard',
      super_admin: '/super-admin',
    }
    return <Navigate to={routes[user.role] || '/'} replace />
  }

  if (allowedRole === 'donor' && !isDonor) {
    return <Navigate to="/dashboard" replace />
  }

  if (needsVerification && user.role === 'hospital_admin') {
    return <Navigate to="/admin-pending-verification" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Super Admin Routes - Use dedicated layout, outside main Layout wrapper */}
      <Route
        path="super-admin"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/hospitals"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminHospitals />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/admins"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminAdmins />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/admins/:adminId"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminAdminDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/campaigns"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminCampaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/finance"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminFinance />
          </ProtectedRoute>
        }
      />
      <Route
        path="super-admin/settings"
        element={
          <ProtectedRoute allowedRole="super_admin">
            <SuperAdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Main App Routes with Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="partner-with-us" element={<PartnerWithUs />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="admin-pending-verification" element={<AdminPendingVerification />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route
          path="donor/campaigns"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorCampaigns />
            </ProtectedRoute>
          }
        />
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
          path="campaigner/campaign/:campaignId/invoice"
          element={
            <ProtectedRoute allowedRole="user">
              <InvoiceUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="receipts/:id"
          element={
            <ProtectedRoute allowedRole="user">
              <ReceiptDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="hospital/verify/:campaignId"
          element={
            <ProtectedRoute allowedRole="hospital_admin">
              <HospitalVerify />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-dashboard"
          element={
            <ProtectedRoute allowedRole="hospital_admin">
              <HospitalAdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
