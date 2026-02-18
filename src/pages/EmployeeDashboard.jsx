import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [hospitals, setHospitals] = useState([])
  const [pendingInvoices, setPendingInvoices] = useState([])
  const [matchedInvoices, setMatchedInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    Promise.all([
      api.employee.hospitals().catch(() => []),
      api.invoices.pending().catch(() => []),
      api.invoices.matched().catch(() => []),
    ]).then(([h, p, m]) => {
      setHospitals(h)
      setPendingInvoices(p)
      setMatchedInvoices(m)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch()
  }, [])

  const handleMatch = async (id) => {
    try {
      await api.invoices.match(id)
      fetch()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSettle = async (id) => {
    if (!confirm('Trigger payout to hospital? Receipts will be generated for donors.')) return
    try {
      await api.invoices.settle(id)
      fetch()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="dashboard employee-dashboard">
      <div className="container">
        <h1>Platform Admin</h1>
        <p className="welcome-text">Welcome, {user?.name}. Manage hospitals and invoices.</p>

        <section>
          <h2>Hospitals</h2>
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : (
            <div className="stat-cards">
              {hospitals.map((h) => (
                <div key={h._id} className="stat-card card">
                  <strong>{h.name}</strong>
                  <p>{h.city} - {h.contactEmail}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="invoice-section">
          <h2>Pending Invoices (Match)</h2>
          {pendingInvoices.length === 0 ? (
            <p className="empty-state">No pending invoices</p>
          ) : (
            <div className="case-list">
              {pendingInvoices.map((inv) => (
                <div key={inv._id} className="case-item card">
                  <h3>{inv.campaign?.patientName}</h3>
                  <p>Amount: ₹{inv.amount?.toLocaleString()}</p>
                  <a href={inv.documentUrl} target="_blank" rel="noreferrer">View Invoice</a>
                  <button className="btn btn-primary" onClick={() => handleMatch(inv._id)}>
                    Match
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="invoice-section">
          <h2>Matched Invoices (Settle)</h2>
          {matchedInvoices.length === 0 ? (
            <p className="empty-state">No matched invoices</p>
          ) : (
            <div className="case-list">
              {matchedInvoices.map((inv) => (
                <div key={inv._id} className="case-item card">
                  <h3>{inv.campaign?.patientName}</h3>
                  <p>Amount: ₹{inv.amount?.toLocaleString()}</p>
                  <button className="btn btn-primary" onClick={() => handleSettle(inv._id)}>
                    Settle (Payout to Hospital)
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
