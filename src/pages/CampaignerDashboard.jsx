import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function CampaignerDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.campaigns
      .my()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const statusLabel = (s) => {
    const map = {
      pending_hospital_verification: 'Awaiting Hospital Verification',
      hospital_verified: 'Verified by Hospital',
      active: 'Active - Receiving Donations',
      rejected: 'Rejected',
      completed: 'Completed',
    }
    return map[s] || s
  }

  return (
    <div className="dashboard campaigner-dashboard">
      <div className="container">
        <h1>My Campaigns</h1>
        <p className="welcome-text">Welcome, {user?.name}.</p>

        <Link to="/campaigner/create">
          <button className="btn btn-primary">Create Campaign</button>
        </Link>

        <section className="campaign-list">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : campaigns.length === 0 ? (
            <div className="empty-state card">
              <p>You haven't created any campaigns yet.</p>
              <Link to="/campaigner/create">
                <button className="btn btn-primary">Create Campaign</button>
              </Link>
            </div>
          ) : (
            <div className="case-list">
              {campaigns.map((c) => (
                <div key={c._id} className="case-item card campaign-item">
                  <div className="case-item-header">
                    <h3>{c.patientName}</h3>
                    <span className={`status-badge status-${c.status}`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <p className="case-desc">{c.description}</p>
                  <p className="case-hospital">{c.hospital?.name}</p>
                  <p className="case-amount">
                    ₹{(c.amountRaised || 0).toLocaleString()} / ₹
                    {c.amountNeeded.toLocaleString()} raised
                  </p>
                  {c.status === 'hospital_verified' && c.amountRaised > 0 && (
                    <Link to={`/campaigner/campaign/${c._id}/invoice`}>
                      <button className="btn btn-secondary">Upload Invoice</button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
