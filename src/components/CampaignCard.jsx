import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CampaignCard({ campaign, onDonated }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const canDonate = user?.role === 'user'

  const c = campaign
  const amountNeeded = Number(c.amountNeeded) || 0
  const amountRaised = Number(c.amountRaised) || 0
  const percent = amountNeeded > 0
    ? Math.min(100, Math.round((amountRaised / amountNeeded) * 100))
    : 0
  const remaining = Math.max(amountNeeded - amountRaised, 0)
  const isFullyFunded = amountNeeded > 0 && amountRaised >= amountNeeded
  const isHospitalVerified =
    c.status === 'hospital_verified' || c.status === 'active'

  const handleDonate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    if (isFullyFunded) {
      setError('This campaign is fully funded')
      return
    }
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (amt > remaining) {
      setError(`You can donate up to ₹${remaining.toLocaleString()}`)
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
      {isFullyFunded ? (
        <span className="case-status status-funded badge-funded">
          ✓ Fully Funded
        </span>
      ) : isHospitalVerified ? (
        <span className="case-status status-verified badge-hospital">
          ✓ Verified by Hospital
        </span>
      ) : null}

      <Link to={`/campaigns/${c._id}`} className="campaign-card-link">
        <h3>{c.patientName}</h3>
        {c.hospital?.name && (
          <p className="campaign-hospital">{c.hospital.name}</p>
        )}
        <p className="case-desc">{c.description}</p>
        <div className="case-progress">
          <div className="progress-bar">
            <div className={`progress-fill ${isFullyFunded ? 'funded' : ''}`} style={{ width: `${percent}%` }} />
          </div>
          <p className="progress-text">
            ₹{amountRaised.toLocaleString()} raised of ₹
            {amountNeeded.toLocaleString()} ({percent}%)
          </p>
          {isFullyFunded ? (
            <p className="funded-message">This campaign has been fully funded. Thank you to all donors!</p>
          ) : (
            <p className="remaining-text">₹{remaining.toLocaleString()} remaining to reach the goal</p>
          )}
        </div>
      </Link>

      {isFullyFunded ? (
        <div className="funded-state">
          <button className="btn btn-primary btn-full" disabled>
            Fully Funded
          </button>
        </div>
      ) : canDonate ? (
        <form onSubmit={handleDonate} className="donate-form">
          <input
            type="number"
            min="1"
            max={remaining > 0 ? remaining : undefined}
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="remaining-text">You can donate up to ₹{remaining.toLocaleString()}</p>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'Donating...' : 'Donate'}
          </button>
          {error && <p className="auth-error">{error}</p>}
        </form>
      ) : user ? (
        <p className="remaining-text">Donation is available only for user accounts.</p>
      ) : (
        <Link to="/signup">
          <button className="btn btn-primary btn-full">
            Sign up to Donate
          </button>
        </Link>
      )}
    </div>
  )
}
