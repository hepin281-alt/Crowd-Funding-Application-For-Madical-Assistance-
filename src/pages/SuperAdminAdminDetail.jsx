import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminAdminDetail() {
    const { adminId } = useParams()
    const navigate = useNavigate()
    const [admin, setAdmin] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [resetResult, setResetResult] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAdmin()
    }, [adminId])

    const fetchAdmin = async () => {
        try {
            setLoading(true)
            setError('')
            const response = await axiosInstance.get(`/super-admin/admins/${adminId}`)
            setAdmin(response.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load hospital admin details')
        } finally {
            setLoading(false)
        }
    }

    const markVerified = async () => {
        if (!admin || admin.is_verified) return
        try {
            setSaving(true)
            setError('')
            await axiosInstance.patch(`/super-admin/admins/${admin.id}/verification`, { is_verified: true })
            setAdmin((prev) => ({ ...prev, is_verified: true }))
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update verification status')
        } finally {
            setSaving(false)
        }
    }

    const toggleLoginAccess = async () => {
        if (!admin) return
        try {
            setSaving(true)
            setError('')
            const next = !admin.login_disabled
            await axiosInstance.patch(`/super-admin/admins/${admin.id}/login-access`, { login_disabled: next })
            setAdmin((prev) => ({ ...prev, login_disabled: next }))
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update login access')
        } finally {
            setSaving(false)
        }
    }

    const resetAdminPassword = async () => {
        if (!admin) return
        try {
            setSaving(true)
            setError('')
            const response = await axiosInstance.post(`/super-admin/admins/${admin.id}/password-reset`)
            setResetResult(response.data || null)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initiate password reset')
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (value) => {
        if (!value) return '-'
        return new Date(value).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatLastSeen = (value) => {
        if (!value) return 'Never logged in'
        return formatDate(value)
    }

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="super-admin-page p-6 max-w-none mx-auto">
                    <DataCard>
                        <div className="p-8 text-center text-slate-600">Loading admin details...</div>
                    </DataCard>
                </div>
            </SuperAdminLayout>
        )
    }

    if (!admin) {
        return (
            <SuperAdminLayout>
                <div className="super-admin-page p-6 max-w-none mx-auto">
                    <DataCard>
                        <div className="p-8 text-center">
                            <p className="text-slate-700 font-medium">Hospital admin not found</p>
                            <button
                                className="mt-4 px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300"
                                onClick={() => navigate('/super-admin/admins')}
                            >
                                Back to Admins
                            </button>
                        </div>
                    </DataCard>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-admin-admin-detail p-4 lg:p-6 xl:p-8 max-w-none mx-auto">
                <SectionHeader
                    title="Hospital Admin Actions"
                    description="Manage hospital admin account settings separately from hospital-level actions"
                    action={
                        <button
                            className="sa-admin-btn sa-admin-btn-secondary"
                            onClick={() => navigate('/super-admin/admins')}
                        >
                            Back to Admins
                        </button>
                    }
                />

                {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 super-admin-error-banner">
                        {error}
                    </div>
                )}

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DataCard>
                        <div className="p-6">
                            <h3 className="sa-admin-title">Admin Profile</h3>
                            <div className="space-y-3 text-sm sa-admin-meta">
                                <p><span className="sa-admin-meta-label">Name:</span> {admin.name}</p>
                                <p><span className="sa-admin-meta-label">Email:</span> {admin.email}</p>
                                <p><span className="sa-admin-meta-label">Phone:</span> {admin.phone || admin.hospital_phone || '-'}</p>
                                <p><span className="sa-admin-meta-label">Joined:</span> {formatDate(admin.created_at)}</p>
                                <p><span className="sa-admin-meta-label">Last Seen:</span> {formatLastSeen(admin.last_seen_at)}</p>
                                <div className="pt-1">
                                    <StatusBadge
                                        status={admin.is_verified ? 'verified' : 'unverified'}
                                        label={admin.is_verified ? 'Admin Verified' : 'Admin Unverified'}
                                    />
                                </div>
                                <div className="pt-1">
                                    <StatusBadge
                                        status={admin.login_disabled ? 'suspended' : 'active'}
                                        label={admin.login_disabled ? 'Login Disabled' : 'Login Enabled'}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {!admin.is_verified && (
                                    <button
                                        type="button"
                                        onClick={markVerified}
                                        disabled={saving}
                                        className="sa-admin-btn sa-admin-btn-success"
                                    >
                                        {saving ? 'Saving...' : 'Mark as Verified'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={toggleLoginAccess}
                                    disabled={saving}
                                    className={`sa-admin-btn ${admin.login_disabled ? 'sa-admin-btn-success' : 'sa-admin-btn-danger'}`}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : admin.login_disabled
                                            ? 'Enable Login'
                                            : 'Disable Login'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetAdminPassword}
                                    disabled={saving}
                                    className="sa-admin-btn sa-admin-btn-info"
                                >
                                    {saving ? 'Saving...' : 'Reset Password'}
                                </button>
                            </div>

                            {resetResult && (
                                <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 sa-admin-reset-result">
                                    <p className="font-semibold">Password reset token generated.</p>
                                    {resetResult.expires_at && (
                                        <p className="mt-1">Expires: {formatDate(resetResult.expires_at)}</p>
                                    )}
                                    {resetResult.resetToken && (
                                        <p className="mt-1 break-all">
                                            Token: {resetResult.resetToken}
                                        </p>
                                    )}
                                    {resetResult.resetUrl && (
                                        <p className="mt-1 break-all">
                                            URL: {resetResult.resetUrl}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </DataCard>

                    <DataCard>
                        <div className="p-6">
                            <h3 className="sa-admin-title">Linked Hospital Context</h3>
                            {admin.linked_hospital ? (
                                <div className="space-y-3 text-sm sa-admin-meta">
                                    <p><span className="sa-admin-meta-label">Hospital:</span> {admin.linked_hospital.name}</p>
                                    <p><span className="sa-admin-meta-label">License:</span> {admin.linked_hospital.license_number || '-'}</p>
                                    <p><span className="sa-admin-meta-label">City:</span> {admin.linked_hospital.city || '-'}</p>
                                    <div>
                                        <StatusBadge
                                            status={admin.linked_hospital.suspended ? 'suspended' : admin.linked_hospital.verified_at ? 'active' : 'pending'}
                                            label={admin.linked_hospital.suspended ? 'Hospital Suspended' : admin.linked_hospital.verified_at ? 'Hospital Active' : 'Hospital Pending'}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <Link
                                            to={`/super-admin/hospitals?hospitalId=${admin.linked_hospital.id}`}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Open Hospital Actions
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600">No linked hospital found for this admin account.</p>
                            )}
                        </div>
                    </DataCard>
                </div>
            </div>
        </SuperAdminLayout>
    )
}
