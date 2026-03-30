import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import HospitalVerificationView from '../components/HospitalVerificationView'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminHospitals() {
    const PAGE_SIZE = 10
    const [hospitals, setHospitals] = useState([])
    const [filteredHospitals, setFilteredHospitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedHospital, setSelectedHospital] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [actionInProgress, setActionInProgress] = useState(null)

    useEffect(() => {
        fetchHospitals()
    }, [])

    useEffect(() => {
        filterHospitals()
    }, [hospitals, statusFilter, searchTerm])

    const fetchHospitals = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/super-admin/hospitals')
            setHospitals(response.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load hospitals')
        } finally {
            setLoading(false)
        }
    }

    const filterHospitals = () => {
        let filtered = hospitals

        if (statusFilter !== 'all') {
            filtered = filtered.filter((h) => {
                if (statusFilter === 'active') return h.verified_at
                if (statusFilter === 'pending') return !h.verified_at && !h.suspended
                if (statusFilter === 'suspended') return h.suspended
                return true
            })
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (h) =>
                    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    h.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredHospitals(filtered)
        setCurrentPage(1)
    }

    const formatDate = (value) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        })
    }

    const approveHospital = async (hospitalId) => {
        try {
            setActionInProgress(hospitalId)
            await axiosInstance.post(`/super-admin/hospitals/${hospitalId}/approve`)
            setHospitals(
                hospitals.map((h) =>
                    h.id === hospitalId ? { ...h, verified_at: new Date().toISOString() } : h
                )
            )
            setShowModal(false)
            alert('Hospital approved successfully!')
        } catch (err) {
            alert('Error approving hospital: ' + (err.response?.data?.error || err.message))
        } finally {
            setActionInProgress(null)
        }
    }

    const getStatusType = (hospital) => {
        if (hospital.suspended) return 'suspended'
        if (hospital.verified_at) return 'active'
        return 'pending'
    }

    const onHospitalVerified = (hospitalId) => {
        setHospitals(
            hospitals.map((h) =>
                h.id === hospitalId ? { ...h, verified_at: new Date().toISOString() } : h
            )
        )
        setShowModal(false)
        setSelectedHospital(null)
    }

    const totalHospitals = filteredHospitals.length
    const totalPages = Math.max(1, Math.ceil(totalHospitals / PAGE_SIZE))
    const page = Math.min(currentPage, totalPages)
    const startIndex = (page - 1) * PAGE_SIZE
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalHospitals)
    const pagedHospitals = filteredHospitals.slice(startIndex, endIndex)

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading hospitals...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-admin-hospitals-page p-4 lg:p-6 xl:p-8 max-w-none mx-auto">
                {/* Page Header */}
                <SectionHeader
                    title="Hospital Management"
                    description="Manage hospital partnerships and verifications"
                />

                {/* Filters */}
                <DataCard>
                    <div className="p-6 border-b border-slate-200 super-admin-filters-panel">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters & Search</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Hospitals</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Awaiting Verification</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Search</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Hospital name or license"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={fetchHospitals}
                                    className="w-full px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 transition font-medium"
                                >
                                    Refresh
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

                {/* Hospitals Table */}
                <div className="mt-8">
                    {filteredHospitals.length === 0 ? (
                        <DataCard>
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-3">🏥</div>
                                <p className="text-slate-600 font-medium">No hospitals found</p>
                                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term</p>
                            </div>
                        </DataCard>
                    ) : (
                        <DataCard className="super-admin-table-card">
                            <div className="overflow-x-auto super-admin-table-scroll">
                                <table className="admin-table super-admin-hospitals-table">
                                    <colgroup>
                                        <col style={{ width: '19%' }} />
                                        <col style={{ width: '12%' }} />
                                        <col style={{ width: '19%' }} />
                                        <col style={{ width: '12%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '9%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hospital</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">License</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Requested On</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Active Campaigns</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Quick</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedHospitals.map((hospital) => (
                                            <tr key={hospital.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                <td className="px-6 py-3 align-middle">
                                                    <div className="font-semibold text-slate-900 super-admin-hospital-name truncate" title={hospital.name}>{hospital.name}</div>
                                                    <div className="text-xs text-slate-500 super-admin-hospital-sub truncate" title={hospital.city || 'N/A'}>{hospital.city || 'N/A'}</div>
                                                    {hospital.address === '__AUTO_MIGRATED__' ? (
                                                        <div className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 super-admin-hospital-sub super-admin-request-badge super-admin-request-badge-auto">
                                                            Auto-migrated request
                                                        </div>
                                                    ) : (hospital.bank_account_number === 'PENDING' && hospital.bank_name === 'Pending Verification') ? (
                                                        <div className="mt-1 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 super-admin-hospital-sub super-admin-request-badge super-admin-request-badge-onboarding">
                                                            Onboarding request
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-600 align-middle truncate" title={hospital.license_number || '-'}>{hospital.license_number || '-'}</td>
                                                <td className="px-6 py-3 align-middle">
                                                    <div className="text-sm text-slate-900 truncate" title={hospital.admin?.name || '-'}>{hospital.admin?.name || '-'}</div>
                                                    <div className="text-xs text-slate-600 truncate" title={hospital.admin?.email || '-'}>{hospital.admin?.email || '-'}</div>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-600 align-middle">{formatDate(hospital.created_at)}</td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                        {hospital.active_campaign_count || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <StatusBadge status={getStatusType(hospital)} label={
                                                        hospital.suspended ? 'Suspended' :
                                                            hospital.verified_at ? 'Active' : 'Pending'
                                                    } />
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHospital(hospital)
                                                                setShowModal(true)
                                                            }}
                                                            className="h-8 w-8 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                                                            title="View Docs"
                                                            aria-label="View Docs"
                                                        >
                                                            👁
                                                        </button>
                                                        {!hospital.verified_at && !hospital.suspended && (
                                                            <button
                                                                onClick={() => approveHospital(hospital.id)}
                                                                disabled={actionInProgress === hospital.id}
                                                                className="h-8 w-8 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                                                title="Quick Approve"
                                                                aria-label="Quick Approve"
                                                            >
                                                                {actionInProgress === hospital.id ? '…' : '✓'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedHospital(hospital)
                                                            setShowModal(true)
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm super-admin-action-link"
                                                    >
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
                                <p className="text-xs text-slate-600">
                                    Showing {totalHospitals === 0 ? 0 : startIndex + 1}-{endIndex} of {totalHospitals} hospitals
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-3 py-1.5 text-xs rounded-md font-medium super-admin-pagination-btn"
                                        disabled={page <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    >
                                        Prev
                                    </button>
                                    <span className="text-xs text-slate-600">Page {page} / {totalPages}</span>
                                    <button
                                        className="px-3 py-1.5 text-xs rounded-md font-medium super-admin-pagination-btn"
                                        disabled={page >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </DataCard>
                    )}
                </div>

                {/* Hospital Detail Modal */}
                {showModal && selectedHospital && (
                    <div className="fixed inset-0 bg-black/50 z-50 p-3 lg:p-6 super-admin-verification-overlay">
                        <div className="super-admin-verification-modal h-[92vh] w-[min(1400px,96vw)] mx-auto bg-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Verification Review: {selectedHospital.name}</h2>
                                    <p className="text-sm text-slate-600">License #{selectedHospital.license_number} • {selectedHospital.city}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false)
                                        setSelectedHospital(null)
                                    }}
                                    className="h-10 w-10 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                                <HospitalVerificationView
                                    hospital={selectedHospital}
                                    onVerify={onHospitalVerified}
                                    onClose={() => {
                                        setShowModal(false)
                                        setSelectedHospital(null)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    )
}
