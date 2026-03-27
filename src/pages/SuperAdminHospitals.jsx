import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import HospitalVerificationView from '../components/HospitalVerificationView'
import { SectionHeader, DataCard, StatusBadge, Button } from '../components/SuperAdminComponents'

export default function SuperAdminHospitals() {
    const [hospitals, setHospitals] = useState([])
    const [filteredHospitals, setFilteredHospitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
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

    const suspendHospital = async (hospitalId, reason) => {
        try {
            setActionInProgress(hospitalId)
            await axiosInstance.post(`/super-admin/hospitals/${hospitalId}/suspend`, { reason })
            setHospitals(
                hospitals.map((h) =>
                    h.id === hospitalId ? { ...h, suspended: true, suspension_reason: reason } : h
                )
            )
            setShowModal(false)
            alert('Hospital suspended successfully!')
        } catch (err) {
            alert('Error suspending hospital: ' + (err.response?.data?.error || err.message))
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
            <div className="super-admin-page super-admin-hospitals-page p-8 max-w-7xl mx-auto">
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
                                <input
                                    type="text"
                                    placeholder="Hospital name or license"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
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
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hospital</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">License</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHospitals.map((hospital) => (
                                            <tr key={hospital.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{hospital.name}</div>
                                                    <div className="text-xs text-slate-600">{hospital.city}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{hospital.license_number}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-900">{hospital.admin?.name}</div>
                                                    <div className="text-xs text-slate-600">{hospital.admin?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={getStatusType(hospital)} label={
                                                        hospital.suspended ? 'Suspended' :
                                                            hospital.verified_at ? 'Active' : 'Pending'
                                                    } />
                                                </td>
                                                <td className="px-6 py-4">
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
                        </DataCard>
                    )}
                </div>

                {/* Hospital Detail Modal */}
                {showModal && selectedHospital && (
                    <div className="fixed inset-0 bg-black/50 z-50 p-6">
                        <div className="h-full bg-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col">
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

                            <div className="flex-1 p-6 overflow-y-auto">
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
