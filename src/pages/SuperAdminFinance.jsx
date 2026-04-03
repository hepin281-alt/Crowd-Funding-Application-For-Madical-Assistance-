import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminFinance() {
    const [payoutQueue, setPayoutQueue] = useState([])
    const [transactions, setTransactions] = useState([])
    const [activeTab, setActiveTab] = useState('payouts')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({ page: 1, limit: 50, pages: 1 })
    const [selectedPayout, setSelectedPayout] = useState(null)
    const [showPayoutModal, setShowPayoutModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchData()
    }, [activeTab, pagination.page])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            if (activeTab === 'payouts') {
                const response = await axiosInstance.get('/super-admin/payouts/queue')
                setPayoutQueue(response.data)
            } else {
                const params = { page: pagination.page, limit: pagination.limit }
                const response = await axiosInstance.get('/super-admin/transactions', { params })
                setTransactions(response.data.transactions || [])
                setPagination(response.data.pagination || { page: 1, limit: 50, pages: 1 })
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const getTotalPayouts = () => {
        return payoutQueue.reduce((sum, payout) => sum + Number(payout.requested_amount || 0), 0)
    }

    const getTotalTransactions = () => {
        return transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    }

    const getStatusColor = (status) => {
        if (status === 'PAID' || status === 'succeeded') return 'emerald'
        if (status === 'PENDING' || status === 'pending') return 'amber'
        if (status === 'REJECTED' || status === 'failed') return 'red'
        if (status === 'APPROVED') return 'blue'
        return 'slate'
    }

    const openPayoutDetails = (payout) => {
        setSelectedPayout(payout)
        setShowPayoutModal(true)
    }

    const closePayoutDetails = () => {
        setShowPayoutModal(false)
        setSelectedPayout(null)
    }

    const approvePayout = async () => {
        if (!selectedPayout) return

        try {
            setActionLoading(true)
            setError(null)
            await axiosInstance.post(`/invoices/${selectedPayout.id}/match`)
            await fetchData()
            closePayoutDetails()
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to approve payout')
        } finally {
            setActionLoading(false)
        }
    }

    const approveAndSettlePayout = async () => {
        if (!selectedPayout) return

        try {
            setActionLoading(true)
            setError(null)
            await axiosInstance.post(`/invoices/${selectedPayout.id}/match`)
            await axiosInstance.post(`/invoices/${selectedPayout.id}/settle`)
            await fetchData()
            closePayoutDetails()
            setActiveTab('transactions')
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to settle payout')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading finance data...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-admin-finance-page p-6 xl:p-8 max-w-7xl mx-auto">
                <SectionHeader
                    title="Finance & Payouts"
                    description="Monitor transactions and manage disbursements"
                />

                <div className="super-admin-switch-tabs-wrap mb-8">
                    <div className="super-admin-switch-tabs">
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`super-admin-switch-tab ${activeTab === 'payouts' ? 'active' : ''}`}
                        >
                            Payout Queue ({payoutQueue.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`super-admin-switch-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                        >
                            Transaction Ledger
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 super-admin-error-banner">
                        {error}
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div>
                        <DataCard>
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-lg border border-amber-100 super-admin-payout-summary">
                                <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider">Total Pending Payouts</p>
                                <p className="text-5xl font-bold text-amber-900 mt-3">₹{getTotalPayouts().toLocaleString()}</p>
                                <p className="text-amber-700 text-sm mt-3">{payoutQueue.length} disbursements waiting</p>
                            </div>
                        </DataCard>

                        <div className="mt-8">
                            {payoutQueue.length === 0 ? (
                                <DataCard>
                                    <div className="p-12 text-center">
                                        <div className="text-4xl mb-3">✅</div>
                                        <p className="text-slate-600 font-medium">No pending payouts</p>
                                        <p className="text-slate-500 text-sm mt-1">All disbursements are current</p>
                                    </div>
                                </DataCard>
                            ) : (
                                <DataCard className="super-admin-table-card">
                                    <div className="overflow-x-auto">
                                        <table className="admin-table">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Campaign</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hospital</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payoutQueue.map((payout) => (
                                                    <tr key={payout.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900">{payout.Campaign?.patient_name || 'Unknown'}</div>
                                                            <div className="text-xs text-slate-600">{payout.Campaign?.campaign_title || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-900">{payout.Campaign?.Hospital?.name || '-'}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">₹{Number(payout.requested_amount || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status="amber" label={payout.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <button
                                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                                                onClick={() => openPayoutDetails(payout)}
                                                                type="button"
                                                            >
                                                                Details
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
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div>
                        <DataCard>
                            <div className="p-6 border-b border-slate-200 super-admin-filters-panel">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-end">
                                        <button
                                            onClick={fetchData}
                                            className="w-full px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 transition font-medium"
                                            type="button"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </DataCard>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
                            <DataCard>
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                    <p className="text-blue-700 text-xs font-semibold uppercase tracking-wider">Total Transactions</p>
                                    <p className="text-3xl font-bold text-blue-900 mt-2">₹{getTotalTransactions().toLocaleString()}</p>
                                </div>
                            </DataCard>
                            <DataCard>
                                <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                    <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Transaction Count</p>
                                    <p className="text-3xl font-bold text-emerald-900 mt-2">{transactions.length}</p>
                                </div>
                            </DataCard>
                            <DataCard>
                                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                                    <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Average Transaction</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">
                                        ₹{transactions.length > 0 ? (getTotalTransactions() / transactions.length).toLocaleString() : 0}
                                    </p>
                                </div>
                            </DataCard>
                        </div>

                        {transactions.length === 0 ? (
                            <DataCard>
                                <div className="p-12 text-center">
                                    <div className="text-4xl mb-3">💸</div>
                                    <p className="text-slate-600 font-medium">No transactions found</p>
                                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                                </div>
                            </DataCard>
                        ) : (
                            <>
                                <DataCard className="super-admin-table-card">
                                    <div className="overflow-x-auto">
                                        <table className="admin-table">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Transaction ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Campaign</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((transaction) => (
                                                    <tr key={transaction.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{transaction.id}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-900">{transaction.DisbursementRequest?.Campaign?.patient_name || '-'}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">₹{Number(transaction.amount || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge
                                                                status={getStatusColor(transaction.DisbursementRequest?.status || 'PAID')}
                                                                label={transaction.DisbursementRequest?.status || 'PAID'}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </DataCard>

                                <div className="mt-6 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 disabled:opacity-50 transition super-admin-pagination-btn"
                                        type="button"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-slate-900 font-medium">
                                        Page {pagination.page} of {pagination.pages || 1}
                                    </span>
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages || 1, pagination.page + 1) })}
                                        disabled={pagination.page === (pagination.pages || 1)}
                                        className="px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 disabled:opacity-50 transition super-admin-pagination-btn"
                                        type="button"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {showPayoutModal && selectedPayout && (
                    <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center">
                        <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-slate-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-xl font-bold text-slate-900">Payout Request Details</h3>
                                    <button
                                        onClick={closePayoutDetails}
                                        className="text-slate-500 hover:text-slate-700 text-xl"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-slate-700">
                                    <p><span className="font-semibold">Request ID:</span> {selectedPayout.id}</p>
                                    <p><span className="font-semibold">Campaign:</span> {selectedPayout.Campaign?.campaign_title || '-'}</p>
                                    <p><span className="font-semibold">Patient:</span> {selectedPayout.Campaign?.patient_name || '-'}</p>
                                    <p><span className="font-semibold">Hospital:</span> {selectedPayout.Campaign?.Hospital?.name || '-'}</p>
                                    <p><span className="font-semibold">Amount:</span> ₹{Number(selectedPayout.requested_amount || 0).toLocaleString()}</p>
                                    <p><span className="font-semibold">Status:</span> {selectedPayout.status}</p>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={approvePayout}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                                    >
                                        {actionLoading ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={approveAndSettlePayout}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {actionLoading ? 'Processing...' : 'Approve & Pay Now'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closePayoutDetails}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    )
}
