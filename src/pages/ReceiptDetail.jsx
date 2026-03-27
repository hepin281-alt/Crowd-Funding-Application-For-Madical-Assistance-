import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function ReceiptDetail() {
    const { id } = useParams()
    const [receipt, setReceipt] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [downloading, setDownloading] = useState({
        receipt: false,
        certificate: false,
        utilization: false,
    })

    useEffect(() => {
        Promise.all([
            api.receipts.get(id),
        ]).then(([data]) => {
            setReceipt(data)
        }).catch((err) => {
            setError(err.message || 'Receipt not found')
        }).finally(() => setLoading(false))
    }, [id])

    const handleDownloadReceipt = async () => {
        setDownloading(prev => ({ ...prev, receipt: true }))
        try {
            await api.receipts.downloadReceiptFile(id)
        } catch (err) {
            setError(err.message || 'Failed to download receipt')
        } finally {
            setDownloading(prev => ({ ...prev, receipt: false }))
        }
    }

    const handleDownloadCertificate = async () => {
        setDownloading(prev => ({ ...prev, certificate: true }))
        try {
            await api.receipts.downloadCertificateFile(id)
        } catch (err) {
            setError(err.message || 'Failed to download certificate')
        } finally {
            setDownloading(prev => ({ ...prev, certificate: false }))
        }
    }

    const handleDownloadUtilization = async () => {
        setDownloading(prev => ({ ...prev, utilization: true }))
        try {
            await api.receipts.downloadUtilizationFile(id)
        } catch (err) {
            setError(err.message || 'Failed to download utilization certificate')
        } finally {
            setDownloading(prev => ({ ...prev, utilization: false }))
        }
    }

    if (loading) {
        return (
            <div className="receipt-page">
                <div className="container">
                    <p className="loading-text">Loading receipt details...</p>
                </div>
            </div>
        )
    }

    if (!receipt || error) {
        return (
            <div className="receipt-page">
                <div className="container">
                    <div className="card">
                        <h1>Receipt Not Found</h1>
                        <p>{error || 'Unable to load receipt details.'}</p>
                        <Link to="/dashboard">
                            <button className="btn btn-primary">Back to Dashboard</button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const receiptNumber = receipt.receipt_number || `RCP-${receipt.id}`
    const isUtilized = receipt.certificate_issued
    const receiptDate = new Date(receipt.receipt_date).toLocaleDateString('en-IN')
    const campaignInfo = receipt.campaign || receipt.Campaign

    return (
        <div className="receipt-page">
            <div className="container">
                <div className="receipt-header">
                    <h1>Donation Receipt</h1>
                    <Link to="/dashboard">
                        <button className="btn btn-secondary">← Back to Dashboard</button>
                    </Link>
                </div>

                <div className="receipt-grid">
                    {/* Receipt Summary */}
                    <div className="card receipt-summary">
                        <div className="receipt-title">
                            <h2>Receipt #{receiptNumber}</h2>
                            <span className={`status-badge ${isUtilized ? 'status-paid' : 'status-pending'}`}>
                                {isUtilized ? '✓ Utilized' : '⏳ Awaiting Hospital Utilization Update'}
                            </span>
                        </div>

                        <hr style={{ margin: '1rem 0', borderColor: '#e5e7eb' }} />

                        <div className="receipt-details">
                            <div className="detail-row">
                                <span className="label">Amount Donated:</span>
                                <span className="value amount">₹{parseFloat(receipt.amount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Receipt Date:</span>
                                <span className="value">{receiptDate}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Patient Name:</span>
                                <span className="value">{campaignInfo?.patient_name || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Hospital:</span>
                                <span className="value">{campaignInfo?.custom_hospital_name || 'Medical Facility'}</span>
                            </div>
                            {campaignInfo?.medical_condition && (
                                <div className="detail-row">
                                    <span className="label">Medical Condition:</span>
                                    <span className="value">{campaignInfo.medical_condition}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Donor Information */}
                    <div className="card donor-info">
                        <h3>Donor Information</h3>
                        <div className="info-section">
                            <p>
                                <strong>Name:</strong> {receipt.donor_name || 'N/A'}
                            </p>
                            <p>
                                <strong>Email:</strong> {receipt.donor_email || 'N/A'}
                            </p>
                            {receipt.donor_phone && (
                                <p>
                                    <strong>Phone:</strong> {receipt.donor_phone}
                                </p>
                            )}
                            {receipt.pan_number && (
                                <p>
                                    <strong>PAN:</strong> {receipt.pan_number}
                                </p>
                            )}
                        </div>

                        {receipt.tax_80g_eligible && (
                            <div className="tax-eligible">
                                <strong className="tax-eligible-title">✓ Eligible for 80G Tax Deduction</strong>
                                <p className="tax-eligible-note">
                                    This donation qualifies for income tax deduction under Section 80G of the Indian Income Tax Act, 1961.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Download Options */}
                    <div className="card download-section">
                        <h3>Download Documents</h3>
                        <p className="download-subtitle">
                            You can download donation receipt, appreciation certificate, and utilization proof for your records.
                        </p>

                        <div className="download-card-grid">
                            <div className="download-card">
                                <p className="download-card-title">Donation Receipt (PDF)</p>
                                <p className="download-card-text">Use this as your official payment proof and donation record.</p>
                                <button
                                    className="btn btn-primary download-btn"
                                    onClick={handleDownloadReceipt}
                                    disabled={downloading.receipt}
                                >
                                    {downloading.receipt ? 'Downloading...' : 'Download Receipt PDF'}
                                </button>
                            </div>

                            <div className="download-card">
                                <p className="download-card-title">Appreciation Certificate</p>
                                <p className="download-card-text">Acknowledge your contribution with a printable certificate.</p>
                                <button
                                    className="btn btn-secondary download-btn"
                                    onClick={handleDownloadCertificate}
                                    disabled={downloading.certificate}
                                >
                                    {downloading.certificate ? 'Downloading...' : 'Download Certificate'}
                                </button>
                            </div>

                            {isUtilized && (
                                <div className="download-card download-card-success">
                                    <p className="download-card-title">Utilization Proof</p>
                                    <p className="download-card-text">Shows how the donated funds were used for treatment.</p>
                                    <button
                                        className="btn download-btn btn-success"
                                        onClick={handleDownloadUtilization}
                                        disabled={downloading.utilization}
                                    >
                                        {downloading.utilization ? 'Downloading...' : 'Download Utilization Proof'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Utilization Status */}
                    {isUtilized && (
                        <div className="card utilization-status">
                            <h3>Utilization Information</h3>
                            <div className="status-info">
                                <p className="status-info-title">
                                    ✓ Your donation has been utilized for medical treatment
                                </p>
                                <p className="status-info-text">
                                    The funds have been disbursed to the hospital and used for patient care. A detailed utilization certificate with invoice references has been prepared for your records. This can be used for tax deduction purposes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                <div className="card receipt-info-card">
                    <h3>Important Information</h3>
                    <ul className="receipt-info-list">
                        <li>This receipt is valid for tax deduction purposes with proof of donation</li>
                        <li>Funds are held in escrow and released only after hospital invoice verification</li>
                        <li>Utilization proof and certificate will be sent to your email when funds are disbursed</li>
                        {receipt.tax_80g_eligible && (
                            <li>Please retain this receipt and the 80G certificate for your ITR filing</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
