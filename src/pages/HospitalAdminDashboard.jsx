import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function HospitalAdminDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctorFilter, setDoctorFilter] = useState('')

  useEffect(() => {
    api.hospitalAdmin
      .pending()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const refresh = () => {
    api.hospitalAdmin.pending().then(setCampaigns).catch(() => { })
  }

  return (
    <div className="dashboard hospital-admin-dashboard">
      <div className="container">
        <h1>Hospital Verification</h1>
        <p className="welcome-text">Welcome, {user?.name}. Verify campaigns claiming admission at your facility.</p>

        <div className="dashboard-stats">
          <div className="stat-card card">
            <span className="stat-value">{campaigns.length}</span>
            <span className="stat-label">Pending Verification</span>
          </div>
        </div>

        <section className="pending-cases">
          <h2>Campaigns Awaiting Verification</h2>
          <div className="pending-filters">
            <div className="filter-item">
              <label>Filter by Doctor</label>
              <input
                type="text"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                placeholder="Search by doctor name"
                className="form-input"
              />
            </div>
            <button className="btn btn-secondary" onClick={refresh}>Refresh Queue</button>
          </div>
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="empty-state">No pending campaigns. Great job!</p>
          ) : (
            <div className="case-list">
              {campaigns
                .filter((c) => {
                  if (!doctorFilter.trim()) return true
                  return (c.treatingDoctorName || '')
                    .toLowerCase()
                    .includes(doctorFilter.trim().toLowerCase())
                })
                .map((c) => (
                  <div key={c._id} className="case-item card">
                    <div className="case-item-header">
                      <h3>{c.patientName}</h3>
                      <span className="case-date">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                    <p className="case-meta">
                      <strong>Doctor:</strong> {c.treatingDoctorName || '—'}
                    </p>
                    <p className="case-meta">
                      <strong>Diagnosis:</strong> {c.medicalCondition || '—'}
                    </p>
                    <p className="case-desc">{c.description}</p>
                    <p className="case-amount">
                      Amount requested: ₹{c.amountNeeded?.toLocaleString()}
                    </p>
                    <p className="case-campaigner">
                      Campaigner: {c.campaigner?.name} ({c.campaigner?.email})
                    </p>
                    <Link to={`/hospital/verify/${c._id}`}>
                      <button className="btn btn-primary">Review & Verify</button>
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
