import { Link } from 'react-router-dom';

interface CampaignCardProps {
    id: number;
    title: string;
    image: string;
    target: number;
    raised: number;
    description: string;
    category: string;
}

export default function CampaignCard({ id, title, image, target, raised, description, category }: CampaignCardProps) {
    const percentage = (raised / target) * 100;

    return (
        <Link to={`/campaign/${id}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full">
                <div className="relative h-48 overflow-hidden bg-gray-200">
                    <img src={image} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {category}
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

                    <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-900">${raised.toLocaleString()}</span>
                            <span className="text-gray-500">of ${target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{Math.round(percentage)}% funded</p>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        View & Donate
                    </button>
                </div>
            </div>
        </Link>
    );
}
