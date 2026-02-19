import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import CaseCard from '../components/CaseCard'

export default function Cases() {
  const { isDonor } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.cases
      .list()
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const refreshCases = () => {
    api.cases.list().then(setCases).catch(() => {})
  }

  return (
    <div className="cases-page">
      <div className="container">
        <h1>Medical Cases</h1>
        <p className="page-desc">Browse verified cases and contribute to help those in need.</p>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : cases.length === 0 ? (
          <div className="empty-state card">
            <p>No verified cases at the moment.</p>
          </div>
        ) : (
          <div className="cases-grid">
            {cases.map((c) => (
              <CaseCard
                key={c._id}
                caseData={c}
                canDonate={isDonor}
                onDonated={refreshCases}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
