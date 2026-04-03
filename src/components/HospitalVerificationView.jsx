import { useState } from 'react'
import axiosInstance from '../api/axiosInstance'

/**
 * HospitalVerificationView
 * Side-by-side verification layout with document viewer and checklist
 * Used by Super Admin to verify hospital documents
 */
export default function HospitalVerificationView({ hospital, onVerify, onClose }) {
    const isAlreadyApproved = Boolean(hospital?.verified_at) && !hospital?.suspended
    const documentUrl = hospital?.document_url || null
    const documentIsPdf = Boolean(documentUrl && documentUrl.toLowerCase().includes('.pdf'))
    const [checks, setChecks] = useState({
        addressMatches: isAlreadyApproved,
        licenseValid: isAlreadyApproved,
        bankVerified: isAlreadyApproved,
    })
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleCheckChange = (key) => {
        if (isAlreadyApproved) return
        setChecks(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const allChecksComplete = Object.values(checks).every(v => v === true)

    const handleAuthorize = async () => {
        if (isAlreadyApproved) return
        if (!allChecksComplete) {
            setError('Please complete all verification checks before authorizing')
            return
        }

        try {
            setLoading(true)
            await axiosInstance.post(`/super-admin/hospitals/${hospital.id}/approve`, {
                verificationNotes: notes,
                checks
            })
            onVerify(hospital.id)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to verify hospital')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason:')
        if (!reason) return

        try {
            setLoading(true)
            await axiosInstance.post(`/super-admin/hospitals/${hospital.id}/suspend`, {
                reason: `Verification failed: ${reason}`,
                verificationNotes: notes
            })
            onClose()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject hospital')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="verification-split-view">
            {/* Document Viewer - Left Side (60%) */}
            <div className="verification-document-viewer">
                <div className="verification-document-header">
                    📄 Hospital License: {hospital.license_number}
                </div>
                <div className="verification-document-content">
                    {documentUrl ? (
                        <div className="h-full w-full flex flex-col">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                                <span>Uploaded license document</span>
                                <a
                                    href={documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Open in new tab
                                </a>
                            </div>
                            {documentIsPdf ? (
                                <iframe
                                    src={documentUrl}
                                    title={`Hospital License ${hospital.license_number}`}
                                    className="h-full w-full rounded border border-slate-200 bg-white"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center rounded border border-slate-200 bg-white p-2">
                                    <img
                                        src={documentUrl}
                                        alt={`Hospital License ${hospital.license_number}`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 px-6 text-center text-slate-500">
                            <div className="text-4xl">⚠️</div>
                            <div>
                                <p className="font-semibold text-slate-700">No uploaded document for this hospital</p>
                                <p className="mt-2 text-sm">
                                    This record was likely created from the direct hospital-admin signup flow, which currently stores only profile details.
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Verification basis available here: hospital name, admin email, license number, phone, and bank placeholder fields.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Checklist - Right Side (40%) */}
            <div className="verification-checklist">
                <div className="flex-1">
                    <h3>🔍 Verification Checklist</h3>
                    <p className="text-xs text-slate-600 mt-1 mb-4">
                        {isAlreadyApproved ? 'Hospital is already approved. Review details or suspend if needed.' : 'Complete all checks before authorizing'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Check Item 1 */}
                    <div className="verification-check-item">
                        <input
                            type="checkbox"
                            id="addressMatches"
                            checked={checks.addressMatches}
                            onChange={() => handleCheckChange('addressMatches')}
                            disabled={isAlreadyApproved}
                        />
                        <label htmlFor="addressMatches">
                            Address Matches Registration
                        </label>
                    </div>

                    {/* Check Item 2 */}
                    <div className="verification-check-item">
                        <input
                            type="checkbox"
                            id="licenseValid"
                            checked={checks.licenseValid}
                            onChange={() => handleCheckChange('licenseValid')}
                            disabled={isAlreadyApproved}
                        />
                        <label htmlFor="licenseValid">
                            Medical License Valid & Current
                        </label>
                    </div>

                    {/* Check Item 3 */}
                    <div className="verification-check-item">
                        <input
                            type="checkbox"
                            id="bankVerified"
                            checked={checks.bankVerified}
                            onChange={() => handleCheckChange('bankVerified')}
                            disabled={isAlreadyApproved}
                        />
                        <label htmlFor="bankVerified">
                            Bank Account Verified
                        </label>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Verification Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes or observations..."
                            className="w-full p-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={4}
                            disabled={isAlreadyApproved}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="verification-action-section">
                    {!isAlreadyApproved && (
                        <button
                            onClick={handleAuthorize}
                            disabled={!allChecksComplete || loading}
                            className="verification-btn-authorize"
                        >
                            {loading ? '⏳ Processing...' : '✓ Authorize Hospital'}
                        </button>
                    )}
                    <button
                        onClick={handleReject}
                        disabled={loading}
                        className="verification-btn-reject"
                    >
                        {isAlreadyApproved ? '✕ Suspend Hospital' : '✕ Reject & Suspend'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="verification-btn-more-info"
                    >
                        Cancel
                    </button>
                </div>

                {/* Status Indicator */}
                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 text-center">
                    {isAlreadyApproved ? (
                        <span className="text-emerald-600 font-semibold">
                            ✓ Already approved on {new Date(hospital.verified_at).toLocaleDateString('en-IN')}
                        </span>
                    ) : allChecksComplete ? (
                        <span className="text-emerald-600 font-semibold">✓ Ready to authorize</span>
                    ) : (
                        <span>
                            {Object.values(checks).filter(Boolean).length} of 3 checks complete
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
