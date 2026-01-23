import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-blue-600 text-white p-2 rounded-lg font-bold">
                            💙
                        </div>
                        <span className="text-xl font-bold text-gray-900">MediCare Fund</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            Home
                        </Link>
                        <Link to="/campaigns" className="text-gray-600 hover:text-gray-900">
                            Campaigns
                        </Link>
                        <Link to="/how-it-works" className="text-gray-600 hover:text-gray-900">
                            How It Works
                        </Link>
                        <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                            Dashboard
                        </Link>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Start Campaign
                        </button>
                    </div>

                    <div className="md:hidden">
                        <button className="text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
