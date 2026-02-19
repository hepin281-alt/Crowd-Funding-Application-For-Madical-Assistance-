import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function HospitalAdminDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.hospitalAdmin
      .pending()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const refresh = () => {
    api.hospitalAdmin.pending().then(setCampaigns).catch(() => {})
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
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="empty-state">No pending campaigns. Great job!</p>
          ) : (
            <div className="case-list">
              {campaigns.map((c) => (
                <div key={c._id} className="case-item card">
                  <div className="case-item-header">
                    <h3>{c.patientName}</h3>
                    <span className="case-date">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <p className="case-desc">{c.description}</p>
                  <p className="case-amount">
                    Amount requested: ₹{c.amountNeeded?.toLocaleString()}
                  </p>
                  <p className="case-campaigner">
                    Campaigner: {c.campaigner?.name} ({c.campaigner?.email})
                  </p>
                  <Link to={`/hospital/verify/${c._id}`}>
                    <button className="btn btn-primary">Verify with IPD No</button>
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
