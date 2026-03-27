import { useState } from 'react'
import axiosInstance from '../api/axiosInstance'

/**
 * HospitalVerificationView
 * Side-by-side verification layout with document viewer and checklist
 * Used by Super Admin to verify hospital documents
 */
export default function HospitalVerificationView({ hospital, onVerify, onClose }) {
    const [checks, setChecks] = useState({
        addressMatches: false,
        licenseValid: false,
        bankVerified: false,
    })
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleCheckChange = (key) => {
        setChecks(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const allChecksComplete = Object.values(checks).every(v => v === true)

    const handleAuthorize = async () => {
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
                    {/* Placeholder for document viewer - can be replaced with iframe or PDF viewer */}
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500">
                        <div className="text-4xl">📋</div>
                        <div className="text-center">
                            <p className="font-semibold">Hospital License Document</p>
                            <p className="text-sm mt-2">
                                Displays: {hospital.name}
                            </p>
                            <p className="text-xs mt-1 text-slate-400">
                                License #: {hospital.license_number}
                            </p>
                        </div>
                        {/* Integration point for actual document viewer:
                            <iframe
                                src={hospital.license_document_url}
                                title="Hospital License"
                                className="w-full h-full"
                            />
                        */}
                    </div>
                </div>
            </div>

            {/* Verification Checklist - Right Side (40%) */}
            <div className="verification-checklist">
                <div className="flex-1">
                    <h3>🔍 Verification Checklist</h3>
                    <p className="text-xs text-slate-600 mt-1 mb-4">
                        Complete all checks before authorizing
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
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="verification-action-section">
                    <button
                        onClick={handleAuthorize}
                        disabled={!allChecksComplete || loading}
                        className="verification-btn-authorize"
                    >
                        {loading ? '⏳ Processing...' : '✓ Authorize Hospital'}
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={loading}
                        className="verification-btn-reject"
                    >
                        ✕ Reject & Suspend
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
                    {allChecksComplete ? (
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
