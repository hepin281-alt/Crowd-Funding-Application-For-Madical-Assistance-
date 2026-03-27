import { Link, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function SuperAdminLayout({ children }) {
    const location = useLocation()

    const menuItems = [
        { path: '/super-admin', label: 'Overview' },
        { path: '/super-admin/hospitals', label: 'Hospitals' },
        { path: '/super-admin/campaigns', label: 'Campaigns' },
        { path: '/super-admin/finance', label: 'Finance' },
        { path: '/super-admin/settings', label: 'Settings' },
    ]

    return (
        <div className="layout super-admin-classic">
            <Navbar />
            <main className="main-content">
                <div className="container">
                    <div className="card super-admin-toolbar" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                        <div className="pending-filters" style={{ marginBottom: 0, justifyContent: 'flex-start' }}>
                            <div className="navbar-links" style={{ gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                                {menuItems.map((item) => (
                                    <NavItem key={item.path} to={item.path} label={item.label} active={location.pathname === item.path} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {children}
                </div>
            </main>
        </div>
    )
}

function NavItem({ to, label, active = false }) {
    return (
        <Link
            to={to}
            className={`btn super-admin-tab ${active ? 'super-admin-tab-active' : ''}`}
        >
            {label}
        </Link>
    )
}
