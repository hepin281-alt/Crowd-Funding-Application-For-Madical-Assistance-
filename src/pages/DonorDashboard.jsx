import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function DonorDashboard() {
  const { user } = useAuth()
  const [donations, setDonations] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.donations.my().catch(() => []),
      api.receipts.my().catch(() => []),
    ]).then(([d, r]) => {
      setDonations(d)
      setReceipts(r)
    }).finally(() => setLoading(false))
  }, [])

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="dashboard donor-dashboard">
      <div className="container">
        <h1>My Donations</h1>
        <p className="welcome-text">Thank you for helping, {user?.name}.</p>

        <div className="dashboard-stats">
          <div className="stat-card card">
            <span className="stat-value">₹{totalDonated.toLocaleString()}</span>
            <span className="stat-label">Total Donated</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value">{donations.length}</span>
            <span className="stat-label">Campaigns Supported</span>
          </div>
        </div>

        <section className="donation-history">
          <h2>Donation History</h2>
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : donations.length === 0 ? (
            <div className="empty-state card">
              <p>You haven't made any donations yet.</p>
              <Link to="/campaigns">
                <button className="btn btn-primary">Browse Campaigns</button>
              </Link>
            </div>
          ) : (
            <div className="donation-list">
              {donations.map((d) => (
                <div key={d._id} className="donation-item card">
                  <div className="donation-info">
                    <h3>{d.campaign?.patientName || 'Campaign'}</h3>
                    <span className="donation-date">
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <span className="donation-amount">₹{d.amount}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {receipts.length > 0 && (
          <section className="receipts-section">
            <h2>Utilization Receipts</h2>
            <p>Proof of how your donations were used.</p>
            <div className="donation-list">
              {receipts.map((r) => {
                const utilized = !!r.invoice
                return (
                  <div key={r._id} className="donation-item card receipt-item">
                    <div className="donation-info">
                      <h3>{r.campaign?.patientName}</h3>
                      <span>
                        Amount: ₹{r.amount}{' '}
                        {utilized ? (
                          <span className="status-badge status-paid">
                            Funds used to pay invoice
                          </span>
                        ) : (
                          <span className="status-badge status-pending">
                            Awaiting utilization
                          </span>
                        )}
                      </span>
                      {r.invoice?.documentUrl && (
                        <a href={r.invoice.documentUrl} target="_blank" rel="noreferrer">
                          View proof
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <Link to="/campaigns">
          <button className="btn btn-primary">Donate to More Campaigns</button>
        </Link>
      </div>
    </div>
  )
}
