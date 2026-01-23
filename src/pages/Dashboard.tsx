export default function Dashboard() {
    const donations = [
        { id: 1, campaign: 'Sarah needs urgent heart surgery', amount: 100, date: '2026-01-20', status: 'Completed' },
        { id: 2, campaign: 'Cancer treatment for young mother', amount: 50, date: '2026-01-18', status: 'Completed' },
        { id: 3, campaign: 'Emergency kidney transplant', amount: 250, date: '2026-01-15', status: 'Completed' },
    ];

    const stats = [
        { label: 'Total Donations', value: '$400', icon: '💰' },
        { label: 'Campaigns Supported', value: '3', icon: '❤️' },
        { label: 'Lives Impacted', value: '3+', icon: '👥' },
        { label: 'Member Since', value: 'Jan 2026', icon: '📅' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Dashboard</h1>
                    <p className="text-gray-600">Track your donations and impact</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-lg shadow-md p-6">
                            <div className="text-3xl mb-2">{stat.icon}</div>
                            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Donation History */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
                    </div>

                    {donations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Campaign</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {donations.map((donation) => (
                                        <tr key={donation.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-700">{donation.campaign}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">${donation.amount}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(donation.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                    {donation.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-gray-600">No donations yet. Start making a difference!</p>
                        </div>
                    )}
                </div>

                {/* Account Settings */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                            <input type="text" defaultValue="John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                            <input type="email" defaultValue="john@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 mb-4">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                                <span className="text-gray-700">Receive email updates on campaigns you support</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                                <span className="text-gray-700">Receive newsletter with success stories</span>
                            </label>
                        </div>

                        <button className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
