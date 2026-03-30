import { useRef, useState } from 'react'
import { api } from '../api/client'

export default function PartnerWithUs() {
    const [form, setForm] = useState({
        name: '',
        licenseNumber: '',
        adminEmail: '',
        address: '',
        city: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        iban: '',
        swift: '',
    })
    const [documentFile, setDocumentFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [submittedApplication, setSubmittedApplication] = useState(null)
    const [statusForm, setStatusForm] = useState({
        applicationId: '',
        adminEmail: '',
    })
    const [statusResult, setStatusResult] = useState(null)
    const fileInputRef = useRef(null)

    const onChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const onStatusFieldChange = (key, value) => {
        setStatusForm((prev) => ({ ...prev, [key]: value }))
    }

    const formatDateTime = (value) => {
        if (!value) return 'Pending review'
        return new Date(value).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getStatusBadgeClass = (status) => {
        if (status === 'APPROVED') return 'approved'
        if (status === 'REJECTED') return 'rejected'
        return 'pending'
    }

    const clearSelectedDocument = () => {
        setDocumentFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!documentFile) {
            setError('Please upload your medical license document.')
            return
        }

        try {
            setLoading(true)
            const payload = new FormData()
            Object.entries(form).forEach(([key, value]) => payload.append(key, value))
            payload.append('document', documentFile)

            const response = await api.hospitals.apply(payload)
            const application = response?.hospital || null
            if (application?.id && form.adminEmail) {
                setSubmittedApplication(application)
                setStatusForm({
                    applicationId: String(application.id),
                    adminEmail: form.adminEmail,
                })
                setStatusResult({
                    applicationId: application.id,
                    hospitalName: application.name,
                    status: application.status,
                    submittedAt: application.submittedAt,
                    reviewedAt: null,
                    rejectionReason: null,
                    nextStep: application.nextStep,
                })
            }

            setSuccess('Application submitted successfully. Super Admin will review your request shortly.')
            setForm({
                name: '',
                licenseNumber: '',
                adminEmail: '',
                address: '',
                city: '',
                bankName: '',
                bankAccountName: '',
                bankAccountNumber: '',
                iban: '',
                swift: '',
            })
            clearSelectedDocument()
        } catch (err) {
            setError(err.message || 'Failed to submit hospital application')
        } finally {
            setLoading(false)
        }
    }

    const handleCheckStatus = async (e) => {
        e.preventDefault()
        setError('')

        if (!statusForm.applicationId || !statusForm.adminEmail) {
            setError('Please provide application ID and admin email to check status.')
            return
        }

        try {
            setCheckingStatus(true)
            const res = await api.hospitals.applicationStatus(statusForm.applicationId, statusForm.adminEmail)
            setStatusResult(res)
        } catch (err) {
            setError(err.message || 'Failed to check application status')
        } finally {
            setCheckingStatus(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card" style={{ maxWidth: '780px' }}>
                <h1>Partner With Us</h1>
                <p className="auth-subtitle">
                    Apply as a hospital partner. Your application will be reviewed by the CareFund Super Admin team.
                </p>

                {error && <p className="auth-error">{error}</p>}
                {success && <p className="auth-success">{success}</p>}

                {submittedApplication && (
                    <div className="partner-status-overview">
                        <div className="partner-status-head">
                            <p className="title">What happens next?</p>
                            <span className={`partner-status-pill ${getStatusBadgeClass(submittedApplication.status)}`}>
                                {submittedApplication.status}
                            </span>
                        </div>
                        <ul className="partner-status-steps">
                            <li>1. Super Admin validates hospital identity and uploaded license.</li>
                            <li>2. Banking details are reviewed for direct payout readiness.</li>
                            <li>3. Final decision is shared by email and reflected in your status tracker.</li>
                        </ul>
                        <p className="partner-status-meta">
                            Application ID: <strong>{submittedApplication.id}</strong> | Submitted: {formatDateTime(submittedApplication.submittedAt)}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" encType="multipart/form-data">
                    <label>Registered Hospital Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => onChange('name', e.target.value)}
                        placeholder="Hospital legal name"
                        required
                    />

                    <label>Medical License Number</label>
                    <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={(e) => onChange('licenseNumber', e.target.value)}
                        placeholder="License / Registration number"
                        required
                    />

                    <label>Official Admin Email</label>
                    <input
                        type="email"
                        value={form.adminEmail}
                        onChange={(e) => onChange('adminEmail', e.target.value)}
                        placeholder="admin@hospital.org"
                        required
                    />

                    <label>Hospital Address</label>
                    <textarea
                        value={form.address}
                        onChange={(e) => onChange('address', e.target.value)}
                        placeholder="Registered full address"
                        rows={3}
                        required
                    />

                    <label>City</label>
                    <input
                        type="text"
                        value={form.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        placeholder="City"
                        required
                    />

                    <label>Bank Name</label>
                    <input
                        type="text"
                        value={form.bankName}
                        onChange={(e) => onChange('bankName', e.target.value)}
                        placeholder="Bank name"
                        required
                    />

                    <label>Bank Account Name</label>
                    <input
                        type="text"
                        value={form.bankAccountName}
                        onChange={(e) => onChange('bankAccountName', e.target.value)}
                        placeholder="Account holder name"
                        required
                    />

                    <label>Bank Account Number</label>
                    <input
                        type="text"
                        value={form.bankAccountNumber}
                        onChange={(e) => onChange('bankAccountNumber', e.target.value)}
                        placeholder="Account number"
                        required
                    />

                    <label>IBAN (optional)</label>
                    <input
                        type="text"
                        value={form.iban}
                        onChange={(e) => onChange('iban', e.target.value)}
                        placeholder="IBAN"
                    />

                    <label>SWIFT Code (optional)</label>
                    <input
                        type="text"
                        value={form.swift}
                        onChange={(e) => onChange('swift', e.target.value)}
                        placeholder="SWIFT"
                    />

                    <div className="partner-upload-card">
                        <div className="partner-upload-head">
                            <label htmlFor="hospital-license-upload">Medical License Document (PDF/Image)</label>
                            <span className="partner-upload-meta">Max 10MB</span>
                        </div>

                        <input
                            id="hospital-license-upload"
                            ref={fileInputRef}
                            className="partner-upload-input"
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            required={!documentFile}
                        />

                        <div className="partner-upload-body">
                            <label htmlFor="hospital-license-upload" className="partner-upload-btn">
                                Choose Document
                            </label>
                            <span className="partner-upload-filename" title={documentFile?.name || 'No file selected'}>
                                {documentFile?.name || 'No file selected'}
                            </span>
                            {documentFile && (
                                <button
                                    type="button"
                                    className="partner-upload-clear"
                                    onClick={clearSelectedDocument}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <p className="partner-upload-help">
                            Accepted formats: PDF, JPG, PNG, WEBP.
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>

                <div className="partner-status-checker">
                    <p className="title">Track Application Status</p>
                    <form onSubmit={handleCheckStatus} className="auth-form">
                        <label>Application ID</label>
                        <input
                            type="number"
                            min="1"
                            value={statusForm.applicationId}
                            onChange={(e) => onStatusFieldChange('applicationId', e.target.value)}
                            placeholder="e.g. 104"
                            required
                        />

                        <label>Official Admin Email</label>
                        <input
                            type="email"
                            value={statusForm.adminEmail}
                            onChange={(e) => onStatusFieldChange('adminEmail', e.target.value)}
                            placeholder="admin@hospital.org"
                            required
                        />

                        <button type="submit" className="btn btn-secondary btn-full" disabled={checkingStatus}>
                            {checkingStatus ? 'Checking...' : 'Check Status'}
                        </button>
                    </form>

                    {statusResult && (
                        <div className="partner-status-result">
                            <div className="partner-status-head">
                                <p className="title">Current Status</p>
                                <span className={`partner-status-pill ${getStatusBadgeClass(statusResult.status)}`}>
                                    {statusResult.status}
                                </span>
                            </div>
                            <p><strong>Hospital:</strong> {statusResult.hospitalName}</p>
                            <p><strong>Submitted:</strong> {formatDateTime(statusResult.submittedAt)}</p>
                            <p><strong>Reviewed:</strong> {formatDateTime(statusResult.reviewedAt)}</p>
                            <p><strong>Next Step:</strong> {statusResult.nextStep}</p>
                            {statusResult.rejectionReason && (
                                <p><strong>Reason:</strong> {statusResult.rejectionReason}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
