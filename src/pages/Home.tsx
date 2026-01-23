import { useState } from 'react';
import { Link } from 'react-router-dom';
import CampaignCard from '../components/CampaignCard';

// Mock campaign data
const campaigns = [
    {
        id: 1,
        title: 'Sarah needs urgent heart surgery',
        image: 'https://images.unsplash.com/photo-1579154204601-01d82a27c8b0?w=400&h=300&fit=crop',
        target: 50000,
        raised: 32000,
        description: 'Sarah requires an urgent heart surgery that her insurance won\'t cover. Help save her life.',
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
        description: 'David was in a severe car accident and needs specialized spinal surgery to walk again.',
        category: 'Orthopedic',
    },
    {
        id: 5,
        title: 'Diabetes management program',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
        target: 30000,
        raised: 22000,
        description: 'Help multiple patients get access to continuous glucose monitoring and insulin treatment.',
        category: 'Endocrinology',
    },
    {
        id: 6,
        title: 'Premature baby\'s NICU care',
        image: 'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=400&h=300&fit=crop',
        target: 45000,
        raised: 38000,
        description: 'Little Emma was born 3 months early and needs extended NICU care to survive.',
        category: 'Pediatric',
    },
];

export default function Home() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = ['Cardiac', 'Oncology', 'Orthopedic', 'Pediatric', 'Nephrology', 'Endocrinology'];

    const filteredCampaigns = selectedCategory
        ? campaigns.filter(c => c.category === selectedCategory)
        : campaigns;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Help Others Afford Life-Saving Medical Treatment
                    </h1>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of compassionate people making a difference. Every donation helps someone get the medical care they need.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/campaigns" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                            Browse Campaigns
                        </Link>
                        <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors">
                            Start a Campaign
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-white py-12 px-4 border-b">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">2,345+</div>
                            <p className="text-gray-600">Campaigns Funded</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">$12.5M+</div>
                            <p className="text-gray-600">Total Raised</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">45K+</div>
                            <p className="text-gray-600">Lives Impacted</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">120K+</div>
                            <p className="text-gray-600">Active Donors</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { number: '1', title: 'Browse', desc: 'Explore verified medical campaigns' },
                            { number: '2', title: 'Choose', desc: 'Select a campaign that moves you' },
                            { number: '3', title: 'Donate', desc: 'Make a secure donation online' },
                            { number: '4', title: 'Impact', desc: 'See the difference you made' },
                        ].map((step) => (
                            <div key={step.number} className="text-center">
                                <div className="bg-blue-600 text-white text-3xl font-bold w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {step.number}
                                </div>
                                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Campaigns */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Featured Campaigns</h2>

                    {/* Category Filter */}
                    <div className="mb-8 flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedCategory === null
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedCategory === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Campaign Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCampaigns.map((campaign) => (
                            <CampaignCard key={campaign.id} {...campaign} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-600 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
                    <p className="text-lg mb-8 opacity-90">
                        Join our community of compassionate donors helping people access vital medical treatment.
                    </p>
                    <Link to="/campaigns" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                        Explore Campaigns Now
                    </Link>
                </div>
            </section>
        </div>
    );
}
