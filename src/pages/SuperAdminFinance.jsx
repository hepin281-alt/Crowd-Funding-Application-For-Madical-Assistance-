import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'

export default function SuperAdminFinance() {
    const [payoutQueue, setPayoutQueue] = useState([])
    const [transactions, setTransactions] = useState([])
    const [activeTab, setActiveTab] = useState('payouts')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [pagination, setPagination] = useState({ page: 1, limit: 50, pages: 1 })

    useEffect(() => {
        fetchData()
    }, [activeTab, statusFilter, pagination.page])

    const fetchData = async () => {
        try {
            setLoading(true)
            if (activeTab === 'payouts') {
                const response = await axiosInstance.get('/super-admin/payouts/queue')
                setPayoutQueue(response.data)
            } else {
                const params = {
                    page: pagination.page,
                    limit: pagination.limit,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                }
                const response = await axiosInstance.get('/super-admin/transactions', { params })
                setTransactions(response.data.transactions)
                setPagination(response.data.pagination)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const getTotalPayouts = () => {
        return payoutQueue.reduce((sum, payout) => sum + parseFloat(payout.requested_amount || 0), 0)
    }

    const getTotalTransactions = () => {
        return transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
    }

    const getStatusColor = (status) => {
        if (status === 'succeeded') return 'emerald'
        if (status === 'pending') return 'amber'
        if (status === 'failed') return 'red'
        if (status === 'refunded') return 'blue'
        return 'slate'
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
                {/* Page Header */}
                <SectionHeader
                    title="Finance & Payouts"
                    description="Monitor transactions and manage disbursements"
                />

                {/* Tabs */}
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

                {/* Payout Queue Tab */}
                {activeTab === 'payouts' && (
                    <div>
                        {/* Summary Card */}
                        <DataCard>
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-lg border border-amber-100 super-admin-payout-summary">
                                <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider">Total Pending Payouts</p>
                                <p className="text-5xl font-bold text-amber-900 mt-3">₹{getTotalPayouts().toLocaleString()}</p>
                                <p className="text-amber-700 text-sm mt-3">{payoutQueue.length} disbursements waiting</p>
                            </div>
                        </DataCard>

                        {/* Payouts Table */}
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
                                                            <div className="font-medium text-slate-900">{payout.Campaign?.patient_name}</div>
                                                            <div className="text-xs text-slate-600">{payout.Campaign?.campaign_title}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-900">{payout.Campaign?.Hospital?.name}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">₹{parseFloat(payout.requested_amount).toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status="amber" label={payout.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <button className="text-blue-600 hover:text-blue-700 font-medium">Details</button>
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

                {/* Transaction Ledger Tab */}
                {activeTab === 'transactions' && (
                    <div>
                        {/* Filters */}
                        <DataCard>
                            <div className="p-6 border-b border-slate-200 super-admin-filters-panel">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value)
                                                setPagination({ ...pagination, page: 1 })
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Transactions</option>
                                            <option value="succeeded">Succeeded</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={fetchData}
                                            className="w-full px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 transition font-medium"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </DataCard>

                        {/* Summary Cards */}
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

                        {/* Transactions Table */}
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
                                                {transactions.map((tx) => (
                                                    <tr key={tx.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{tx.id}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-900">
                                                            {tx.DisbursementRequest?.Campaign?.patient_name}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">
                                                            ₹{parseFloat(tx.amount).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={getStatusColor(tx.status)} label={tx.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            {new Date(tx.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </DataCard>

                                {/* Pagination */}
                                <div className="mt-6 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 text-sm bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 disabled:opacity-50 transition super-admin-pagination-btn"
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
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    )
}
