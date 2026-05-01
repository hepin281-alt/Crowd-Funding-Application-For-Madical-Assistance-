import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { SectionHeader, DataCard, StatusBadge } from '../components/SuperAdminComponents'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

export default function Analytics() {
    const [campaignPerformance, setCampaignPerformance] = useState([])
    const [donationTrends, setDonationTrends] = useState([])
    const [hospitalPerformance, setHospitalPerformance] = useState([])
    const [payoutEfficiency, setPayoutEfficiency] = useState(null)
    const [donorSegments, setDonorSegments] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

    useEffect(() => {
        fetchAnalyticsData()
    }, [])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)
            const [
                perfRes,
                trendsRes,
                hospitalRes,
                payoutRes,
                segmentRes,
                summaryRes,
            ] = await Promise.all([
                axiosInstance.get('/analytics/campaign-performance'),
                axiosInstance.get('/analytics/donation-trends'),
                axiosInstance.get('/analytics/hospital-performance'),
                axiosInstance.get('/analytics/payout-efficiency'),
                axiosInstance.get('/analytics/donor-segments'),
                axiosInstance.get('/analytics/summary'),
            ])

            setCampaignPerformance(perfRes.data)
            setDonationTrends(trendsRes.data)
            setHospitalPerformance(hospitalRes.data)
            setPayoutEfficiency(payoutRes.data)
            setDonorSegments(segmentRes.data)
            setSummary(summaryRes.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load analytics')
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
                        <p className="text-gray-600">Loading analytics...</p>
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

    return (
        <SuperAdminLayout>
            <div className="p-8 xl:p-10 max-w-full mx-auto bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="Advanced Analytics"
                        description="Deep dive into platform metrics and performance"
                    />

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 mt-10">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-7 border-2 border-red-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-red-600 text-xs font-bold uppercase tracking-widest">Total Donations</p>
                                        <p className="text-4xl font-bold text-red-900 mt-3">
                                            {summary.totalDonations.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-5xl ml-2">💝</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-7 border-2 border-blue-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">Unique Donors</p>
                                        <p className="text-4xl font-bold text-blue-900 mt-3">
                                            {summary.uniqueDonors.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-5xl ml-2">👥</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-7 border-2 border-purple-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-purple-600 text-xs font-bold uppercase tracking-widest">Avg Donation</p>
                                        <p className="text-4xl font-bold text-purple-900 mt-3">
                                            ₹{summary.avgDonation.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-5xl ml-2">💰</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-7 border-2 border-emerald-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Successful</p>
                                        <p className="text-4xl font-bold text-emerald-900 mt-3">
                                            {summary.successfulCampaigns}/{summary.totalCampaigns}
                                        </p>
                                    </div>
                                    <div className="text-5xl ml-2">✅</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-7 border-2 border-orange-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-orange-600 text-xs font-bold uppercase tracking-widest">Success Rate</p>
                                        <p className="text-4xl font-bold text-orange-900 mt-3">
                                            {summary.totalCampaigns > 0
                                                ? Math.round((summary.successfulCampaigns / summary.totalCampaigns) * 100)
                                                : 0}
                                            %
                                        </p>
                                    </div>
                                    <div className="text-5xl ml-2">📈</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Campaign Performance */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">📊 Top 10 Campaigns</h3>
                                <p className="text-gray-500 text-sm mt-1">Performance vs Target Amount</p>
                            </div>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={campaignPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="raised" fill="#10b981" name="Raised (₹)" radius={[12, 12, 0, 0]} />
                                    <Bar dataKey="target" fill="#cbd5e1" name="Target (₹)" radius={[12, 12, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Donation Trends */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">📈 30-Day Trends</h3>
                                <p className="text-gray-500 text-sm mt-1">Daily donations and total amounts</p>
                            </div>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={donationTrends} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(date) => {
                                            const d = new Date(date)
                                            return `${d.getMonth() + 1}/${d.getDate()}`
                                        }}
                                    />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="donations"
                                        stroke="#3b82f6"
                                        name="# of Donations"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', r: 5 }}
                                        activeDot={{ r: 7, fill: '#3b82f6' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="totalAmount"
                                        stroke="#10b981"
                                        name="Amount (₹)"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        activeDot={{ r: 7, fill: '#10b981' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Hospital Performance */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">🏥 Top Hospitals</h3>
                                <p className="text-gray-500 text-sm mt-1">Total funds raised per hospital</p>
                            </div>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={hospitalPerformance}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 180, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="totalRaised" fill="#8b5cf6" name="Total Raised (₹)" radius={[0, 12, 12, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Payout Efficiency */}
                        {payoutEfficiency && (
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">💸 Payout Distribution</h3>
                                    <p className="text-gray-500 text-sm mt-1">Disbursement request status breakdown</p>
                                </div>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                        <Pie
                                            data={[
                                                { name: 'Pending', value: payoutEfficiency.pending.count },
                                                { name: 'Approved', value: payoutEfficiency.approved.count },
                                                { name: 'Paid', value: payoutEfficiency.paid.count },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, percent }) =>
                                                `${name} ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {['#f59e0b', '#3b82f6', '#10b981'].map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Donor Segments */}
                        {donorSegments.length > 0 && (
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">👥 Donor Segments</h3>
                                    <p className="text-gray-500 text-sm mt-1">Donations grouped by contribution size</p>
                                </div>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={donorSegments} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="segment" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                        <Legend />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="count"
                                            fill="#3b82f6"
                                            name="# of Donations"
                                            radius={[12, 12, 0, 0]}
                                        />
                                        <Bar yAxisId="right" dataKey="total" fill="#10b981" name="Total (₹)" radius={[12, 12, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Payout Details */}
                    {payoutEfficiency && (
                        <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8">📋 Detailed Payout Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-3 border-amber-300 hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-amber-700 font-bold text-sm uppercase tracking-widest">⏳ Pending</p>
                                        <span className="bg-amber-300 text-amber-900 px-4 py-2 rounded-full text-lg font-bold">{payoutEfficiency.pending.count}</span>
                                    </div>
                                    <p className="text-4xl font-bold text-amber-900 my-3">
                                        ₹{Math.round(payoutEfficiency.pending.total).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-amber-700 font-semibold">Awaiting approval</p>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-3 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-blue-700 font-bold text-sm uppercase tracking-widest">✓ Approved</p>
                                        <span className="bg-blue-300 text-blue-900 px-4 py-2 rounded-full text-lg font-bold">{payoutEfficiency.approved.count}</span>
                                    </div>
                                    <p className="text-4xl font-bold text-blue-900 my-3">
                                        ₹{Math.round(payoutEfficiency.approved.total).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-blue-700 font-semibold">Ready for disbursement</p>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-3 border-emerald-300 hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-emerald-700 font-bold text-sm uppercase tracking-widest">✅ Paid</p>
                                        <span className="bg-emerald-300 text-emerald-900 px-4 py-2 rounded-full text-lg font-bold">{payoutEfficiency.paid.count}</span>
                                    </div>
                                    <p className="text-4xl font-bold text-emerald-900 my-3">
                                        ₹{Math.round(payoutEfficiency.paid.total).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-emerald-700 font-semibold">Successfully disbursed</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SuperAdminLayout>
    )
}
