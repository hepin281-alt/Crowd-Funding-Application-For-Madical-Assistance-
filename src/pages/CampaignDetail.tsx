import { useParams } from 'react-router-dom';
import { useState } from 'react';
import DonationModal from '../components/DonationModal';

// Mock campaign details
const campaignDetails: Record<number, any> = {
    1: {
        id: 1,
        title: 'Sarah needs urgent heart surgery',
        image: 'https://images.unsplash.com/photo-1579154204601-01d82a27c8b0?w=800&h=500&fit=crop',
        target: 50000,
        raised: 32000,
        description: 'Sarah requires an urgent heart surgery that her insurance won\'t cover.',
        category: 'Cardiac',
        story: `Sarah is a 45-year-old teacher who was recently diagnosed with severe heart condition. Her doctors recommend immediate surgery, but her insurance policy doesn't cover the specific procedure needed. Without this surgery, she faces serious health complications.

The procedure costs $50,000, which is beyond her family's financial capacity. With your help, we can make sure Sarah gets the life-saving treatment she needs.

Sarah has been a dedicated teacher for 20 years and has touched many lives. Now it's time for the community to help her.`,
        beneficiary: 'Sarah Johnson',
        age: 45,
        location: 'New York, USA',
        urgency: 'Urgent - Within 3 months',
        updates: [
            'Week 1: Surgery scheduled for March 15th',
            'Week 1: Fundraising campaign launched',
            'Surgery costs covered at 64%',
        ],
        donors: 245,
    },
    2: {
        id: 2,
        title: 'Cancer treatment for young mother',
        image: 'https://images.unsplash.com/photo-1576091160399-f2aaad007d5b?w=800&h=500&fit=crop',
        target: 80000,
        raised: 45000,
        description: 'Maria, a 32-year-old mother of two, needs chemotherapy and targeted cancer treatment.',
        category: 'Oncology',
        story: `Maria is a 32-year-old mother of two beautiful children. Last year, she was diagnosed with stage 2 breast cancer. Despite aggressive treatment, she now needs advanced targeted therapy to have the best chance of survival.

The advanced treatment costs $80,000 and is not fully covered by insurance. Maria's family has already spent their savings on initial treatments. With your generous donation, Maria can get the treatment she desperately needs to be there for her children.`,
        beneficiary: 'Maria Rodriguez',
        age: 32,
        location: 'Los Angeles, USA',
        urgency: 'High - Within 2 months',
        updates: [
            'Initial treatment completed',
            'Advanced therapy approved by doctors',
            '56% of funds raised',
        ],
        donors: 189,
    },
    3: {
        id: 3,
        title: 'Emergency kidney transplant',
        image: 'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=800&h=500&fit=crop',
        target: 75000,
        raised: 68000,
        description: 'John needs an urgent kidney transplant. Every dollar brings him closer to recovery.',
        category: 'Nephrology',
        story: `John is a 52-year-old accountant who has been on dialysis for 3 years. His kidney function has deteriorated significantly, and doctors have found a perfect donor match. However, the transplant surgery and post-operative care cost $75,000.

John's insurance covers only a portion, leaving a significant gap. With your help, John can have the transplant surgery that will give him his life back and free him from dialysis.`,
        beneficiary: 'John Martinez',
        age: 52,
        location: 'Miami, USA',
        urgency: 'Urgent - Within 1 month',
        updates: [
            'Donor match found!',
            'Surgery scheduled for February 28th',
            '91% of funds raised',
        ],
        donors: 312,
    },
};

export default function CampaignDetail() {
    const { id } = useParams<{ id: string }>();
    const [showDonationModal, setShowDonationModal] = useState(false);
    const campaign = campaignDetails[parseInt(id || '1')];

    if (!campaign) {
        return <div className="text-center py-20">Campaign not found</div>;
    }

    const percentage = (campaign.raised / campaign.target) * 100;

    const handleDonate = (amount: number, name: string, email: string) => {
        // Here you would normally send this to your backend
        console.log('Donation:', { amount, name, email, campaign: campaign.id });
        alert(`Thank you ${name}! Your donation of $${amount} has been received. We'll send a confirmation to ${email}`);
        setShowDonationModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Campaign Header */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <img src={campaign.image} alt={campaign.title} className="w-full h-96 object-cover" />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
                                <span className="bg-blue-600 text-white px-4 py-2 rounded-full">{campaign.category}</span>
                            </div>

                            <div className="flex items-center space-x-4 mb-6 text-gray-600 text-sm">
                                <span>Raised by {campaign.donors} donors</span>
                                <span>•</span>
                                <span>{campaign.urgency}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-2xl font-bold text-gray-900">${campaign.raised.toLocaleString()}</span>
                                    <span className="text-gray-600">raised of ${campaign.target.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>
                                <p className="text-gray-600 mt-2">{Math.round(percentage)}% funded</p>
                            </div>

                            <button
                                onClick={() => setShowDonationModal(true)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors mb-8"
                            >
                                Donate Now
                            </button>

                            {/* Story Section */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Story</h2>
                                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{campaign.story}</p>
                            </div>

                            {/* Updates */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates</h2>
                                <ul className="space-y-3">
                                    {campaign.updates.map((update: string, idx: number) => (
                                        <li key={idx} className="flex items-start space-x-3">
                                            <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                            <span className="text-gray-700">{update}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        {/* Beneficiary Info */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Beneficiary</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-600 text-sm">Name</p>
                                    <p className="font-semibold text-gray-900">{campaign.beneficiary}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Age</p>
                                    <p className="font-semibold text-gray-900">{campaign.age}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Location</p>
                                    <p className="font-semibold text-gray-900">{campaign.location}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Medical Urgency</p>
                                    <p className="font-semibold text-red-600">{campaign.urgency}</p>
                                </div>
                            </div>
                        </div>

                        {/* Donation Box */}
                        <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-2 border-blue-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Make an Impact</h3>
                            <div className="space-y-3 mb-4">
                                {[
                                    { amount: 10, impact: 'Provides basic medical supplies' },
                                    { amount: 50, impact: 'Covers daily medication costs' },
                                    { amount: 100, impact: 'Contributes to surgery costs' },
                                ].map((donation) => (
                                    <div key={donation.amount} className="flex items-start space-x-2">
                                        <div className="text-green-600 mt-1">✓</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">${donation.amount}</p>
                                            <p className="text-sm text-gray-600">{donation.impact}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowDonationModal(true)}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                            >
                                Donate
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donation Modal */}
            {showDonationModal && (
                <DonationModal
                    campaignTitle={campaign.title}
                    target={campaign.target}
                    onClose={() => setShowDonationModal(false)}
                    onDonate={handleDonate}
                />
            )}
        </div>
    );
}
