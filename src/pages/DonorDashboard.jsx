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

  const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

  const handleDownloadReceipt = async (id) => {
    try {
      await api.receipts.downloadReceiptFile(id)
    } catch (err) {
      alert(err.message || 'Failed to download receipt')
    }
  }

  const handleDownloadCertificate = async (id) => {
    try {
      await api.receipts.downloadCertificateFile(id)
    } catch (err) {
      alert(err.message || 'Failed to download certificate')
    }
  }

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
                      {d.created_at
                        ? new Date(d.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <span className="donation-amount">₹{parseFloat(d.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {receipts.length > 0 && (
          <section className="receipts-section">
            <h2>Receipts & Certificates</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Download your donation receipts, appreciation certificates, and utilization proofs.</p>
            <div className="receipts-grid">
              {receipts.map((r) => {
                const utilized = !!r.utilization_proof || r.certificate_issued
                return (
                  <div key={r._id} className="receipt-card card">
                    <div className="receipt-card-header">
                      <h3>{r.campaign?.patientName}</h3>
                      <span className={`status-badge ${utilized ? 'status-paid' : 'status-pending'}`}>
                        {utilized ? '✓ Utilized' : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="receipt-card-content">
                      <p><strong>Amount:</strong> ₹{parseFloat(r.amount).toLocaleString()}</p>
                      {r.invoice?.amount && (
                        <p><strong>Invoice Amount:</strong> ₹{parseFloat(r.invoice.amount).toLocaleString()}</p>
                      )}
                      <p>
                        <strong>Date:</strong>{' '}
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString('en-IN')
                          : '—'}
                      </p>
                    </div>

                    <div className="receipt-card-actions">
                      <Link to={`/receipts/${r._id}`}>
                        <button className="btn btn-secondary btn-sm">View Details</button>
                      </Link>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownloadReceipt(r._id)}
                        title="Download receipt PDF"
                      >
                        📄 Receipt
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownloadCertificate(r._id)}
                        title="Download appreciation certificate"
                      >
                        🎖️ Certificate
                      </button>
                      {r.invoice?.documentUrl && (
                        <a href={r.invoice.documentUrl} target="_blank" rel="noreferrer">
                          <button className="btn btn-secondary btn-sm">View Invoice</button>
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
