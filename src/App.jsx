import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyIdentity from './pages/VerifyIdentity'
import Campaigns from './pages/Campaigns'
import CampaignCreate from './pages/CampaignCreate'
import InvoiceUpload from './pages/InvoiceUpload'
import HospitalVerify from './pages/HospitalVerify'
import HospitalAdminDashboard from './pages/HospitalAdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import DonorDashboard from './pages/DonorDashboard'
import CampaignerDashboard from './pages/CampaignerDashboard'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, needsVerification } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) {
    const routes = { employee: '/employee', donor: '/donor', campaigner: '/campaigner', hospital_admin: '/hospital-admin' }
    return <Navigate to={routes[user.role] || '/'} replace />
  }
  if ((allowedRole === 'employee' || allowedRole === 'hospital_admin') && needsVerification) {
    return <Navigate to="/verify-identity" replace />
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
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="hospital/verify/:campaignId" element={<HospitalVerify />} />
        <Route
          path="campaigner"
          element={
            <ProtectedRoute allowedRole="campaigner">
              <CampaignerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="campaigner/create"
          element={
            <ProtectedRoute allowedRole="campaigner">
              <CampaignCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="campaigner/campaign/:campaignId/invoice"
          element={
            <ProtectedRoute allowedRole="campaigner">
              <InvoiceUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="hospital-admin"
          element={
            <ProtectedRoute allowedRole="hospital_admin">
              <HospitalAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="donor"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
