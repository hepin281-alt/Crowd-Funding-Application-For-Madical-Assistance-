import CampaignCard from '../components/CampaignCard';
import { useState } from 'react';

const allCampaigns = [
    {
        id: 1,
        title: 'Sarah needs urgent heart surgery',
        image: 'https://images.unsplash.com/photo-1579154204601-01d82a27c8b0?w=400&h=300&fit=crop',
        target: 50000,
        raised: 32000,
        description: 'Sarah requires an urgent heart surgery that her insurance won\'t cover.',
        category: 'Cardiac',
    },
    {
        id: 2,
        title: 'Cancer treatment for young mother',
        image: 'https://images.unsplash.com/photo-1576091160399-f2aaad007d5b?w=400&h=300&fit=crop',
        target: 80000,
        raised: 45000,
        description: 'Maria, a 32-year-old mother of two, needs chemotherapy and targeted cancer treatment.',
        category: 'Oncology',
    },
    {
        id: 3,
        title: 'Emergency kidney transplant',
        image: 'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=400&h=300&fit=crop',
        target: 75000,
        raised: 68000,
        description: 'John needs an urgent kidney transplant. Every dollar brings him closer to recovery.',
        category: 'Nephrology',
    },
    {
        id: 4,
        title: 'Spinal surgery for accident victim',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
        target: 60000,
        raised: 12000,
        description: 'David was in a severe car accident and needs specialized spinal surgery.',
        category: 'Orthopedic',
    },
    {
        id: 5,
        title: 'Diabetes management program',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
        target: 30000,
        raised: 22000,
        description: 'Help multiple patients get access to continuous glucose monitoring.',
        category: 'Endocrinology',
    },
    {
        id: 6,
        title: 'Premature baby\'s NICU care',
        image: 'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=400&h=300&fit=crop',
        target: 45000,
        raised: 38000,
        description: 'Little Emma was born 3 months early and needs extended NICU care.',
        category: 'Pediatric',
    },
    {
        id: 7,
        title: 'Liver transplant for teenager',
        image: 'https://images.unsplash.com/photo-1579154204601-01d82a27c8b0?w=400&h=300&fit=crop',
        target: 95000,
        raised: 71000,
        description: 'Alex needs an urgent liver transplant to save his life.',
        category: 'Hepatology',
    },
    {
        id: 8,
        title: 'Vision restoration surgery',
        image: 'https://images.unsplash.com/photo-1576091160399-f2aaad007d5b?w=400&h=300&fit=crop',
        target: 25000,
        raised: 18000,
        description: 'Thomas can regain his sight through specialized corneal transplant surgery.',
        category: 'Ophthalmology',
    },
    {
        id: 9,
        title: 'Emergency brain tumor removal',
        image: 'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=400&h=300&fit=crop',
        target: 120000,
        raised: 85000,
        description: 'Jennifer needs emergency neurosurgery to remove a brain tumor.',
        category: 'Neurology',
    },
];

const categories = ['All', 'Cardiac', 'Oncology', 'Orthopedic', 'Pediatric', 'Nephrology', 'Endocrinology', 'Hepatology', 'Ophthalmology', 'Neurology'];

export default function Campaigns() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    let filtered = allCampaigns;

    // Filter by category
    if (selectedCategory !== 'All') {
        filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Sort campaigns
    if (sortBy === 'most-funded') {
        filtered = [...filtered].sort((a, b) => (b.raised / b.target) - (a.raised / a.target));
    } else if (sortBy === 'least-funded') {
        filtered = [...filtered].sort((a, b) => (a.raised / a.target) - (b.raised / b.target));
    } else if (sortBy === 'highest-amount') {
        filtered = [...filtered].sort((a, b) => (b.target - b.raised) - (a.target - a.raised));
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Campaigns</h1>
                    <p className="text-gray-600">Browse and support people who need help accessing medical treatment</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Search Campaigns</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search campaigns..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            {/* Sort */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="most-funded">Most Funded</option>
                                    <option value="least-funded">Least Funded</option>
                                    <option value="highest-amount">Most Needed</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Medical Categories</h3>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedCategory === cat
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Campaigns Grid */}
                    <div className="lg:col-span-3">
                        {filtered.length > 0 ? (
                            <>
                                <p className="text-gray-600 mb-6">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''} found</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filtered.map((campaign) => (
                                        <CampaignCard key={campaign.id} {...campaign} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600 text-lg">No campaigns found matching your criteria.</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('All');
                                    }}
                                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
