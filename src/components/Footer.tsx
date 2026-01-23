export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">MediCare Fund</h3>
                        <p className="text-gray-400">
                            Helping people afford life-saving medical treatments through community support.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="/" className="hover:text-white">Home</a></li>
                            <li><a href="/campaigns" className="hover:text-white">Browse Campaigns</a></li>
                            <li><a href="/how-it-works" className="hover:text-white">How It Works</a></li>
                            <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#about" className="hover:text-white">About Us</a></li>
                            <li><a href="#blog" className="hover:text-white">Blog</a></li>
                            <li><a href="#press" className="hover:text-white">Press</a></li>
                            <li><a href="#careers" className="hover:text-white">Careers</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Follow Us</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#facebook" className="hover:text-white">Facebook</a></li>
                            <li><a href="#twitter" className="hover:text-white">Twitter</a></li>
                            <li><a href="#instagram" className="hover:text-white">Instagram</a></li>
                            <li><a href="#linkedin" className="hover:text-white">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8">
                    <p className="text-center text-gray-400">
                        &copy; 2026 MediCare Fund. All rights reserved. |
                        <a href="#privacy" className="hover:text-white ml-2">Privacy Policy</a> |
                        <a href="#terms" className="hover:text-white ml-2">Terms of Service</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
