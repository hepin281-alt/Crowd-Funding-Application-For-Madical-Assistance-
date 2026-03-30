import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { MetricCard, SectionHeader, DataCard } from '../components/SuperAdminComponents'

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState(null)
    const [recentHospitalRequests, setRecentHospitalRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchMetrics()
    }, [])

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            const res = await axiosInstance.get('/super-admin/metrics')
            setMetrics(res.data)
            const requestsRes = await axiosInstance.get('/super-admin/hospitals/pending/recent?limit=5')
            setRecentHospitalRequests(Array.isArray(requestsRes.data) ? requestsRes.data : [])
        } catch (err) {
            console.error('Fetch error:', err)
            setError(err.response?.data?.error || 'Failed to load metrics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    if (error) {
        return (
            <SuperAdminLayout>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-700 font-medium">ERROR: {error}</p>
                </div>
            </SuperAdminLayout>
        )
    }

    const { financial = {}, activity = {}, approvalQueue = {}, growthCharts = {} } = metrics || {}

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-admin-dashboard-page p-6 xl:p-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <SectionHeader
                    title="Dashboard Overview"
                    description="Real-time metrics of your platform"
                />

                {/* Financial Metrics Section */}
                <div className="mt-8 mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Total Amount Raised"
                            value={`₹${(financial.totalRaised || 0).toLocaleString()}`}
                            color="emerald"
                            subtext="All-time total"
                        />
                        <MetricCard
                            title="Platform Fees"
                            value={`₹${(financial.platformFees || 0).toLocaleString()}`}
                            color="blue"
                            subtext="2% commission revenue"
                        />
                        <MetricCard
                            title="Pending Payouts"
                            value={`₹${(financial.pendingPayouts || 0).toLocaleString()}`}
                            color="amber"
                            subtext="Awaiting disbursement"
                        />
                    </div>
                </div>

                {/* Activity Metrics Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Activity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <MetricCard
                            title="Active Campaigns"
                            value={activity.activeCampaigns || 0}
                            color="blue"
                            subtext="Currently running"
                        />
                        <MetricCard
                            title="Total Campaigns"
                            value={activity.totalCampaigns || 0}
                            color="slate"
                            subtext="All-time"
                        />
                        <MetricCard
                            title="Partner Hospitals"
                            value={activity.totalHospitals || 0}
                            color="emerald"
                            subtext="Verified partners"
                        />
                        <MetricCard
                            title="Total Donors"
                            value={activity.totalDonors || 0}
                            color="blue"
                            subtext="Community members"
                        />
                    </div>
                </div>

                {/* Approval Queue & System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <DataCard>
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Approval Queue</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-100">
                                    <span className="text-sm text-slate-700">Hospitals Awaiting Verification</span>
                                    <span className="text-2xl font-bold text-amber-600">{approvalQueue.hospitalsAwaitingOnboarding || 0}</span>
                                </div>
                                <a href="/super-admin/hospitals" className="text-blue-600 text-sm font-medium hover:text-blue-700 inline-block mt-2">
                                    Review & Approve →
                                </a>
                            </div>
                        </div>
                    </DataCard>

                    <DataCard>
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Recent Requests</h3>
                            {recentHospitalRequests.length === 0 ? (
                                <p className="text-sm text-slate-600">No pending hospital requests right now.</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentHospitalRequests.map((request) => (
                                        <div key={request.id} className="rounded border border-slate-200 px-3 py-2 bg-slate-50">
                                            <p className="text-sm font-semibold text-slate-900">{request.name}</p>
                                            <p className="text-xs text-slate-600 mt-1">
                                                License: {request.license_number || '-'}
                                            </p>
                                            <a
                                                href="/super-admin/hospitals"
                                                className="text-blue-600 text-xs font-medium hover:text-blue-700 inline-block mt-2"
                                            >
                                                Review Now →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DataCard>

                    <DataCard>
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">System Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-slate-700">Node.js Server</span>
                                    <span className="text-xs text-emerald-600 font-medium ml-auto">Online</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-slate-700">Database Connection</span>
                                    <span className="text-xs text-emerald-600 font-medium ml-auto">Healthy</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-slate-700">File Storage</span>
                                    <span className="text-xs text-emerald-600 font-medium ml-auto">Operational</span>
                                </div>
                            </div>
                        </div>
                    </DataCard>
                </div>

                {/* Growth Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <DataCard>
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">30-Day Donation Trends</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={growthCharts.dailyDonations || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#10b981" name="Amount (₹)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="count" stroke="#0369a1" name="Donations" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </DataCard>

                    <DataCard>
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">30-Day New Campaigns</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={growthCharts.dailyCampaigns || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                                    <Bar dataKey="count" fill="#0369a1" name="New Campaigns" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DataCard>
                </div>

            </div>
        </SuperAdminLayout>
    )
}
