import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CampaignCard({ campaign, canDonate, onDonated }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const c = campaign
  const percent = Math.min(
    100,
    Math.round(((c.amountRaised || 0) / c.amountNeeded) * 100)
  )
  const isHospitalVerified =
    c.status === 'hospital_verified' || c.status === 'active'

  const handleDonate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await api.donations.create(c._id, amt)
      setAmount('')
      onDonated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="case-card card campaign-card">
      {isHospitalVerified && (
        <span className="case-status status-verified badge-hospital">
          ✓ Verified by Hospital
        </span>
      )}

      <Link to={`/campaigns/${c._id}`} className="campaign-card-link">
        <h3>{c.patientName}</h3>
        {c.hospital?.name && (
          <p className="campaign-hospital">{c.hospital.name}</p>
        )}
        <p className="case-desc">{c.description}</p>
        <div className="case-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="progress-text">
            ₹{(c.amountRaised || 0).toLocaleString()} raised of ₹
            {c.amountNeeded.toLocaleString()} ({percent}%)
          </p>
        </div>
      </Link>

      {canDonate && user ? (
        <form onSubmit={handleDonate} className="donate-form">
          <input
            type="number"
            min="1"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'Donating...' : 'Donate'}
          </button>
          {error && <p className="auth-error">{error}</p>}
        </form>
      ) : (
        <Link to="/signup?role=donor">
          <button className="btn btn-primary btn-full">
            Sign up to Donate
          </button>
        </Link>
      )}
    </div>
  )
}
