import { useState } from 'react';

interface DonationModalProps {
    campaignTitle: string;
    target: number;
    onClose: () => void;
    onDonate: (amount: number, name: string, email: string) => void;
}

export default function DonationModal({ campaignTitle, target, onClose, onDonate }: DonationModalProps) {
    const [amount, setAmount] = useState(100);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    const presetAmounts = [10, 25, 50, 100, 250, 500];

    const handleDonate = (e: React.FormEvent) => {
        e.preventDefault();
        const donationAmount = customAmount ? parseInt(customAmount) : amount;
        if (donationAmount > 0 && name && email) {
            onDonate(donationAmount, name, email);
            setName('');
            setEmail('');
            setCustomAmount('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
                <div className="sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Donate to Campaign</h2>
                    <button onClick={onClose} className="text-2xl leading-none">×</button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-4">{campaignTitle}</p>

                    <form onSubmit={handleDonate}>
                        {/* Donation Amount Selection */}
                        <div className="mb-6">
                            <label className="block font-semibold text-gray-900 mb-3">Select Amount</label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {presetAmounts.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            setAmount(preset);
                                            setCustomAmount('');
                                        }}
                                        className={`py-2 px-3 rounded-lg font-semibold transition-colors ${amount === preset && !customAmount
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        ${preset}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600">Custom:</span>
                                <div className="flex-1 flex items-center">
                                    <span className="text-gray-600">$</span>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            if (e.target.value) setAmount(0);
                                        }}
                                        className="flex-1 ml-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Impact Info */}
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-700 font-semibold">
                                Your donation of <span className="text-blue-600">${customAmount || amount}</span> will help reach the goal of <span className="text-blue-600">${target.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Personal Info */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <label className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                                <span className="text-gray-600">Make my donation public</span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Donate Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
