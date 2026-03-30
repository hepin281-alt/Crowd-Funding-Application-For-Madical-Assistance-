import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function HospitalAdminDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [overview, setOverview] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const allowedTabs = ['pending', 'active', 'history', 'financials', 'profile']
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return allowedTabs.includes(tab) ? tab : 'pending'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const setTab = (tabKey) => {
    setActiveTab(tabKey)
    const next = new URLSearchParams(searchParams)
    next.set('tab', tabKey)
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [ov, fin] = await Promise.all([
          api.hospitalAdmin.overview().catch(() => null),
          api.hospitalAdmin.financials().catch(() => null),
        ])
        setOverview(ov)
        setFinancials(fin)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  useEffect(() => {
    if (!['pending', 'active', 'history'].includes(activeTab)) return

    const loadCampaigns = async () => {
      setLoadingCampaigns(true)
      try {
        const list = await api.hospitalAdmin.campaigns({
          tab: activeTab,
          search: searchTerm,
          status: statusFilter,
        })
        setCampaigns(Array.isArray(list) ? list : [])
      } catch (_) {
        setCampaigns([])
      } finally {
        setLoadingCampaigns(false)
      }
    }

    loadCampaigns()
  }, [activeTab, searchTerm, statusFilter])

  const refreshAll = async () => {
    setLoading(true)
    try {
      const [ov, fin] = await Promise.all([
        api.hospitalAdmin.overview().catch(() => null),
        api.hospitalAdmin.financials().catch(() => null),
      ])
      setOverview(ov)
      setFinancials(fin)
    } finally {
      setLoading(false)
    }
  }

  const tabLabel = {
    pending: 'Verification Queue',
    active: 'Active Campaigns',
    history: 'Verification History',
    financials: 'Financials & Proofs',
    profile: 'Hospital Profile',
  }[activeTab]

  const campaignStatusClass = (status) => {
    if (status === 'pending_hospital_verification') return 'status-pending_hospital_verification'
    if (status === 'hospital_verified' || status === 'active') return 'status-active'
    if (status === 'completed') return 'status-active'
    if (status === 'rejected') return 'status-needs_info'
    if (status === 'needs_info') return 'status-needs_info'
    return 'status-badge'
  }

  return (
    <div className="dashboard hospital-admin-dashboard">
      <div className="container">
        <h1>Hospital Admin Verification Hub</h1>
        <p className="welcome-text">Welcome, {user?.name}. Review authenticity, track campaign outcomes, and monitor hospital payouts.</p>

        {loading ? (
          <p className="loading-text">Loading dashboard...</p>
        ) : (
          <>
            <div className="dashboard-stats">
              <div className="stat-card card">
                <span className="stat-value">{overview?.metrics?.totalVerified || 0}</span>
                <span className="stat-label">Total Verified</span>
              </div>
              <div className="stat-card card">
                <span className="stat-value">₹{(overview?.metrics?.totalFundsRaised || 0).toLocaleString()}</span>
                <span className="stat-label">Total Funds Raised</span>
              </div>
              <div className="stat-card card">
                <span className="stat-value">{overview?.metrics?.activePatients || 0}</span>
                <span className="stat-label">Active Patients</span>
              </div>
              <div className="stat-card card">
                <span className="stat-value">₹{(overview?.metrics?.pendingPayouts || 0).toLocaleString()}</span>
                <span className="stat-label">Pending Payouts</span>
              </div>
            </div>

            {(overview?.notifications || []).length > 0 && (
              <section className="pending-cases">
                <h2>Action Required</h2>
                <div className="case-list">
                  {overview.notifications.map((n, idx) => (
                    <div key={`${n.type}-${idx}`} className="case-item card">
                      <p className="case-meta"><strong>{n.type === 'payout' ? 'Finance Alert' : 'Verification Alert'}</strong></p>
                      <p className="case-desc">{n.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pending-cases">
              <div className="portal-sections-layout">
                <aside className="portal-sections-sidebar card">
                  <h3>Hospital Sections</h3>
                  {[
                    { key: 'profile', label: 'Overview' },
                    { key: 'pending', label: `Campaigns (${overview?.metrics?.pendingRequests || 0})` },
                    { key: 'active', label: 'Active Campaigns' },
                    { key: 'history', label: 'History' },
                    { key: 'financials', label: 'Financials' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`portal-section-btn ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </aside>

                <div className="portal-sections-content">
                  <h2>{tabLabel}</h2>

                  {['pending', 'active', 'history'].includes(activeTab) && (
                    <>
                      <div className="pending-filters">
                        <div className="filter-item">
                          <label>Search by Patient / Doctor / Title</label>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="e.g. Raj Kumar or Dr. Sharma"
                            className="form-input"
                          />
                        </div>
                        <div className="filter-item">
                          <label>Status</label>
                          <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="pending_hospital_verification">Pending Verification</option>
                            <option value="hospital_verified">Verified</option>
                            <option value="active">Active</option>
                            <option value="needs_info">Needs Info</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <button className="btn btn-secondary" onClick={refreshAll}>Refresh</button>
                      </div>

                      {loadingCampaigns ? (
                        <p className="loading-text">Loading campaigns...</p>
                      ) : campaigns.length === 0 ? (
                        <div className="empty-state card">
                          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
                          <p>No campaigns found for this view.</p>
                          <button className="btn btn-secondary" onClick={refreshAll}>Refresh</button>
                        </div>
                      ) : (
                        <div className="case-list">
                          {campaigns.map((c) => (
                            <div key={c._id} className="case-item card">
                              <div className="case-item-header">
                                <h3>{c.patientName}</h3>
                                <span className={`status-badge ${campaignStatusClass(c.status)}`}>{c.status}</span>
                              </div>
                              <p className="case-meta"><strong>Doctor:</strong> {c.treatingDoctorName || '—'}</p>
                              <p className="case-meta"><strong>Condition:</strong> {c.medicalCondition || '—'}</p>
                              <p className="case-meta"><strong>Campaigner:</strong> {c.campaigner?.name || '—'} ({c.campaigner?.email || '—'})</p>
                              <p className="case-desc">{c.campaignTitle || c.description}</p>
                              <p className="case-amount">
                                ₹{(c.amountRaised || 0).toLocaleString()} / ₹{(c.amountNeeded || 0).toLocaleString()}
                              </p>
                              {activeTab === 'pending' ? (
                                <Link to={`/hospital/verify/${c._id}`}>
                                  <button className="btn btn-primary">Review & Verify</button>
                                </Link>
                              ) : (
                                <Link to={`/campaigns/${c._id}`}>
                                  <button className="btn btn-secondary">View Campaign</button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'financials' && (
                    <div className="case-list">
                      <div className="case-item card">
                        <h3>Payout Summary</h3>
                        <p className="case-meta"><strong>Pending Transfer:</strong> ₹{(financials?.totals?.pendingPayoutAmount || 0).toLocaleString()}</p>
                        <p className="case-meta"><strong>Paid Out:</strong> ₹{(financials?.totals?.paidOutAmount || 0).toLocaleString()}</p>
                      </div>

                      <div className="case-item card">
                        <h3>Pending Payout Queue</h3>
                        {(financials?.pendingPayouts || []).length === 0 ? (
                          <p className="case-desc">No pending payouts.</p>
                        ) : (
                          <div className="case-list">
                            {financials.pendingPayouts.map((p) => (
                              <div key={p._id} className="case-item">
                                <p className="case-meta"><strong>{p.patientName || 'Campaign'}</strong> - ₹{(p.amount || 0).toLocaleString()}</p>
                                <p className="case-date">{p.status} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="case-item card">
                        <h3>Utilization Proofs</h3>
                        {(financials?.utilizationProofs || []).length === 0 ? (
                          <p className="case-desc">No utilization proofs yet.</p>
                        ) : (
                          <div className="case-list">
                            {financials.utilizationProofs.map((u) => (
                              <div key={u._id} className="case-item">
                                <p className="case-meta"><strong>{u.patientName || 'Campaign'}</strong></p>
                                {u.documentUrl ? (
                                  <a href={u.documentUrl} target="_blank" rel="noreferrer">View Invoice / Bill</a>
                                ) : (
                                  <p className="case-date">No document</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'profile' && (
                    <div className="case-list">
                      <div className="case-item card">
                        <h3>Hospital Verification Status</h3>
                        <p className="case-meta"><strong>Name:</strong> {user?.name || '—'}</p>
                        <p className="case-meta"><strong>Email:</strong> {user?.email || overview?.hospital?.adminEmail || '—'}</p>
                        <p className="case-meta"><strong>Contact Number:</strong> {overview?.hospital?.contactPhone || user?.hospital_phone || user?.phone || '—'}</p>
                        <p className="case-meta"><strong>Hospital:</strong> {overview?.hospital?.name || user?.hospital_name || '—'}</p>
                        <p className="case-meta"><strong>License:</strong> {overview?.hospital?.licenseNumber || user?.license_number || '—'}</p>
                        <p className="case-meta"><strong>City:</strong> {overview?.hospital?.city || '—'}</p>
                        <p className="case-meta"><strong>Status:</strong> {overview?.hospital?.verified ? 'Verified' : 'Pending Verification'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
