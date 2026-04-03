import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminAdmins() {
    const PAGE_SIZE = 10
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        fetchAdmins()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter])

    const fetchAdmins = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axiosInstance.get('/super-admin/admins')
            setAdmins(response.data || [])
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load admin accounts')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (value) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        })
    }

    const formatLastSeen = (value) => {
        if (!value) return 'Never logged in'
        return new Date(value).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        })
    }

    const getHospitalStatus = (admin) => {
        const hospital = admin.linked_hospital
        if (!hospital) return { status: 'pending', label: 'Not Linked' }
        if (hospital.suspended) return { status: 'suspended', label: 'Suspended' }
        if (hospital.verified_at) return { status: 'active', label: 'Active' }
        return { status: 'pending', label: 'Pending' }
    }

    const getPortalPresence = (admin) => {
        if (admin.online_now) {
            return { status: 'active', label: 'Online' }
        }
        return { status: 'slate', label: 'Offline' }
    }

    const filteredAdmins = useMemo(() => {
        let rows = admins

        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase()
            rows = rows.filter((a) =>
                [
                    a.name,
                    a.email,
                    a.hospital_name,
                    a.license_number,
                    a.linked_hospital?.name,
                    a.linked_hospital?.license_number,
                ]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(q))
            )
        }

        if (statusFilter !== 'all') {
            rows = rows.filter((a) => {
                const h = getHospitalStatus(a)
                if (statusFilter === 'active') return h.status === 'active'
                if (statusFilter === 'pending') return h.status === 'pending'
                if (statusFilter === 'suspended') return h.status === 'suspended'
                return true
            })
        }

        return rows
    }, [admins, searchTerm, statusFilter])

    const totalAdmins = filteredAdmins.length
    const totalPages = Math.max(1, Math.ceil(totalAdmins / PAGE_SIZE))
    const page = Math.min(currentPage, totalPages)
    const startIndex = (page - 1) * PAGE_SIZE
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalAdmins)
    const pagedAdmins = filteredAdmins.slice(startIndex, endIndex)

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading admin accounts...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page p-4 lg:p-6 xl:p-8 max-w-none mx-auto">
                <SectionHeader
                    title="Hospital Admin Accounts"
                    description="Manage hospital admin identities separately from hospital entities"
                />

                <DataCard>
                    <div className="p-6 border-b border-slate-200 super-admin-filters-panel">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters & Search</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Hospital Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All</option>
                                    <option value="active">Hospital Active</option>
                                    <option value="pending">Hospital Pending / Unlinked</option>
                                    <option value="suspended">Hospital Suspended</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Search</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Admin, email, hospital, license"
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
                                    onClick={fetchAdmins}
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

                <div className="mt-8">
                    {filteredAdmins.length === 0 ? (
                        <DataCard>
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-3">👤</div>
                                <p className="text-slate-600 font-medium">No admin accounts found</p>
                                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term</p>
                            </div>
                        </DataCard>
                    ) : (
                        <DataCard className="super-admin-table-card">
                            <div className="overflow-x-auto super-admin-table-scroll">
                                <table className="admin-table">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Portal</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hospital</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">License</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hospital Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Joined On</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Seen</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedAdmins.map((admin) => {
                                            const hospitalStatus = getHospitalStatus(admin)
                                            const portalPresence = getPortalPresence(admin)
                                            const hospitalName = admin.linked_hospital?.name || admin.hospital_name || '-'
                                            const license = admin.linked_hospital?.license_number || admin.license_number || '-'
                                            return (
                                                <tr key={admin.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                    <td className="px-6 py-3 align-middle">
                                                        <div className="font-semibold text-slate-900 truncate" title={admin.name}>{admin.name}</div>
                                                        <div className="text-xs text-slate-500">ID #{admin.id}</div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <div className="text-sm text-slate-900 truncate" title={admin.email}>{admin.email}</div>
                                                        <div className="text-xs text-slate-600 truncate" title={admin.phone || '-'}>{admin.phone || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <StatusBadge status={portalPresence.status} label={portalPresence.label} />
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-slate-700 align-middle truncate" title={hospitalName}>{hospitalName}</td>
                                                    <td className="px-6 py-3 text-sm text-slate-600 align-middle truncate" title={license}>{license}</td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <StatusBadge status={hospitalStatus.status} label={hospitalStatus.label} />
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-slate-600 align-middle">{formatDate(admin.created_at)}</td>
                                                    <td className="px-6 py-3 text-sm text-slate-600 align-middle">{formatLastSeen(admin.last_seen_at)}</td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <Link
                                                            to={`/super-admin/admins/${admin.id}`}
                                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                                        >
                                                            Open Admin
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
                                <p className="text-xs text-slate-600">
                                    Showing {totalAdmins === 0 ? 0 : startIndex + 1}-{endIndex} of {totalAdmins} admins
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
            </div>
        </SuperAdminLayout>
    )
}
