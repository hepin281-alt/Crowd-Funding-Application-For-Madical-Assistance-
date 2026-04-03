import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminCampaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [filteredCampaigns, setFilteredCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filterType, setFilterType] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCampaign, setSelectedCampaign] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [auditLogs, setAuditLogs] = useState([])
    const [showLogs, setShowLogs] = useState(false)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    useEffect(() => {
        filterCampaigns()
    }, [campaigns, filterType, searchTerm])

    const fetchCampaigns = async () => {
        try {
            setLoading(true)
            const params = { filter: filterType !== 'all' ? filterType : undefined }
            const response = await axiosInstance.get('/super-admin/campaigns', { params })
            setCampaigns(response.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load campaigns')
        } finally {
            setLoading(false)
        }
    }

    const filterCampaigns = () => {
        let filtered = campaigns

        if (searchTerm) {
            filtered = filtered.filter(
                (c) =>
                    c.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredCampaigns(filtered)
    }

    const abortCampaign = async (campaignId) => {
        try {
            const reason = prompt('Enter abort reason:')
            if (!reason) return

            const confirmed = window.confirm('Abort this campaign permanently? This cannot be reversed from this panel.')
            if (!confirmed) return

            await axiosInstance.post(`/super-admin/campaigns/${campaignId}/abort`, { reason })
            setCampaigns(
                campaigns.map((c) =>
                    c.id === campaignId
                        ? { ...c, reported: true, report_reason: `ABORTED: ${reason}`, rejection_reason: reason, status: 'rejected' }
                        : c
                )
            )
            setSelectedCampaign((prev) =>
                prev && prev.id === campaignId
                    ? { ...prev, reported: true, report_reason: `ABORTED: ${reason}`, rejection_reason: reason, status: 'rejected' }
                    : prev
            )
            alert('Campaign aborted permanently.')
        } catch (err) {
            alert('Error aborting campaign: ' + (err.response?.data?.error || err.message))
        }
    }

    const openCampaignDetails = async (campaign) => {
        try {
            setShowModal(true)
            setDetailsLoading(true)
            setSelectedCampaign(campaign)
            const response = await axiosInstance.get(`/campaigns/${campaign.id}`)
            setSelectedCampaign((prev) => ({ ...prev, ...response.data }))
        } catch (_err) {
            // Keep fallback payload from the table row when detail fetch fails.
        } finally {
            setDetailsLoading(false)
        }
    }

    const closeCampaignDetails = () => {
        setShowModal(false)
        setSelectedCampaign(null)
        setDetailsLoading(false)
    }

    const fetchAuditLogs = async () => {
        try {
            const response = await axiosInstance.get('/super-admin/audit-logs')
            setAuditLogs(response.data.logs)
            setShowLogs(true)
        } catch (err) {
            alert('Error loading audit logs: ' + (err.response?.data?.error || err.message))
        }
    }

    const getDonationVelocity = (campaign) => {
        const createdAt = new Date(campaign.createdAt)
        const now = new Date()
        const days = (now - createdAt) / (1000 * 60 * 60 * 24)
        return days > 0 ? (campaign.raised_amount / days).toFixed(2) : 0
    }

    const getStatusColor = (status) => {
        if (status === 'active') return 'emerald'
        if (status === 'completed') return 'blue'
        if (status === 'rejected') return 'red'
        return 'amber'
    }

    const isCampaignAborted = (campaign) => {
        return Boolean(campaign?.reported && String(campaign?.report_reason || '').startsWith('ABORTED:'))
    }

    const getHospitalName = (campaign) => {
        return campaign?.hospital?.name || campaign?.Hospital?.name || campaign?.['Hospital.name'] || '-'
    }

    const getCampaignerName = (campaign) => {
        return campaign?.campaigner?.name || campaign?.user?.name || campaign?.['user.name'] || '-'
    }

    const getCampaignerEmail = (campaign) => {
        return campaign?.campaigner?.email || campaign?.user?.email || campaign?.['user.email'] || '-'
    }

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading campaigns...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-admin-campaigns-page p-6 xl:p-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <SectionHeader
                    title="Campaign Oversight"
                    description="Monitor campaigns and ensure platform compliance"
                />

                {/* Filters */}
                <DataCard>
                    <div className="p-6 border-b border-slate-200 super-admin-filters-panel">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters & Search</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Filter</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value)
                                        fetchCampaigns()
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Campaigns</option>
                                    <option value="high-value">High Value (₹50k+)</option>
                                    <option value="high-velocity">High Velocity (Rapid)</option>
                                    <option value="reported">Reported Campaigns</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Patient name or title"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={fetchCampaigns}
                                    className="w-full px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 transition font-medium"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={fetchAuditLogs}
                                    className="w-full px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition font-medium"
                                >
                                    Audit Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </DataCard>

                {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 super-admin-error-banner">
                        {error}
                    </div>
                )}

                {/* Campaigns Table */}
                <div className="mt-8">
                    {filteredCampaigns.length === 0 ? (
                        <DataCard>
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="text-slate-600 font-medium">No campaigns found</p>
                                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term</p>
                            </div>
                        </DataCard>
                    ) : (
                        <DataCard className="super-admin-table-card">
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Campaign</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Target</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Raised</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Daily Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCampaigns.map((campaign) => (
                                            <tr key={campaign.id} className={`border-b border-slate-200 hover:bg-slate-50 transition ${campaign.reported ? 'bg-red-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{campaign.campaign_title}</div>
                                                    <div className="text-xs text-slate-600">{campaign.patient_name}</div>
                                                    {campaign.reported && (
                                                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium super-admin-reported-badge">
                                                            {isCampaignAborted(campaign) ? 'ABORTED' : 'REPORTED'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-900">₹{parseFloat(campaign.target_amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-emerald-600">₹{parseFloat(campaign.raised_amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">₹{getDonationVelocity(campaign)}/day</td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={getStatusColor(campaign.status)} label={campaign.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openCampaignDetails(campaign)}
                                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm super-admin-action-link"
                                                        >
                                                            Details
                                                        </button>
                                                        {!isCampaignAborted(campaign) && (
                                                            <button
                                                                onClick={() => abortCampaign(campaign.id)}
                                                                className="text-red-600 hover:text-red-700 font-medium text-sm super-admin-danger-link"
                                                            >
                                                                Abort
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </DataCard>
                    )}
                </div>

                {/* Campaign Detail Modal */}
                {showModal && selectedCampaign && (
                    <div className="fixed inset-0 z-[1000] bg-black/70 p-4 sm:p-6 overflow-y-auto">
                        <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
                            <div className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-white">{selectedCampaign.campaign_title || 'Campaign Details'}</h2>
                                    <button
                                        onClick={closeCampaignDetails}
                                        className="text-slate-300 hover:text-white text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {detailsLoading ? (
                                    <div className="py-10 text-center text-slate-300">Loading campaign details...</div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Campaign Summary */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Patient Name</p>
                                                <p className="font-medium text-white">{selectedCampaign.patient_name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Medical Condition</p>
                                                <p className="font-medium text-white">{selectedCampaign.medical_condition || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Target</p>
                                                <p className="text-lg font-bold text-white">₹{parseFloat(selectedCampaign.target_amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Raised</p>
                                                <p className="text-lg font-bold text-emerald-400">₹{parseFloat(selectedCampaign.raised_amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Hospital</p>
                                                <p className="font-medium text-white">{getHospitalName(selectedCampaign)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Status</p>
                                                <div className="pt-1">
                                                    <StatusBadge status={getStatusColor(selectedCampaign.status)} label={selectedCampaign.status || '-'} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Campaigner</p>
                                                <p className="font-medium text-white">{getCampaignerName(selectedCampaign)}</p>
                                                <p className="text-xs text-slate-400">{getCampaignerEmail(selectedCampaign)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">Created On</p>
                                                <p className="font-medium text-white">{new Date(selectedCampaign.created_at || selectedCampaign.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 mb-2">Description</p>
                                            <p className="text-sm text-slate-200 leading-relaxed">{selectedCampaign.description || '-'}</p>
                                        </div>

                                        {/* Aborted or Report Information */}
                                        {selectedCampaign.reported && (
                                            <div className="bg-red-950/40 border border-red-700 rounded-lg p-4">
                                                <p className="text-xs font-medium text-red-300 mb-1">{isCampaignAborted(selectedCampaign) ? 'Abort Reason' : 'Report Reason'}</p>
                                                <p className="text-red-100">{selectedCampaign.rejection_reason || selectedCampaign.report_reason}</p>
                                            </div>
                                        )}

                                        {/* Close Button */}
                                        <div className="border-t border-slate-700 pt-6">
                                            <button
                                                onClick={closeCampaignDetails}
                                                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs Modal */}
                {showLogs && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
                                    <button
                                        onClick={() => setShowLogs(false)}
                                        className="text-slate-500 hover:text-slate-700 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{log.action}</p>
                                                    <p className="text-sm text-slate-600">By: {log.User?.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                                                </div>
                                                {log.details && (
                                                    <div className="text-right text-xs text-slate-600">
                                                        <pre className="bg-white p-2 rounded border border-slate-200 text-left">{JSON.stringify(log.details, null, 2)}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowLogs(false)}
                                    className="w-full mt-6 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    )
}
