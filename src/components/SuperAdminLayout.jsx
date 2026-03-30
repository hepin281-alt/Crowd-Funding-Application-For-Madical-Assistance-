import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import axiosInstance from '../api/axiosInstance'

export default function SuperAdminLayout({ children }) {
    const location = useLocation()
    const [pendingCount, setPendingCount] = useState(0)

    const menuItems = [
        { path: '/super-admin', label: 'Overview' },
        { path: '/super-admin/hospitals', label: 'Hospitals' },
        { path: '/super-admin/campaigns', label: 'Campaigns' },
        { path: '/super-admin/finance', label: 'Finance' },
        { path: '/super-admin/settings', label: 'Settings' },
    ]

    useEffect(() => {
        let mounted = true

        const fetchPendingCount = async () => {
            try {
                const res = await axiosInstance.get('/super-admin/hospitals/pending/count')
                if (mounted) {
                    setPendingCount(Number(res.data?.count || 0))
                }
            } catch {
                if (mounted) {
                    setPendingCount(0)
                }
            }
        }

        fetchPendingCount()
        const timer = setInterval(fetchPendingCount, 30000)

        return () => {
            mounted = false
            clearInterval(timer)
        }
    }, [location.pathname])

    return (
        <div className="layout super-admin-classic">
            <Navbar />
            <main className="main-content">
                <div className="super-admin-shell">
                    <div className="super-admin-command-center">
                        <aside className="card super-admin-sidebar">
                            <p className="super-admin-sidebar-kicker">Command Center</p>
                            <h3 className="super-admin-sidebar-title">Super Admin</h3>
                            <nav className="super-admin-sidebar-nav" aria-label="Super Admin Navigation">
                                {menuItems.map((item) => (
                                    <NavItem
                                        key={item.path}
                                        to={item.path}
                                        label={item.label}
                                        active={location.pathname === item.path}
                                        badgeCount={item.path === '/super-admin/hospitals' ? pendingCount : 0}
                                    />
                                ))}
                            </nav>
                        </aside>

                        <div className="super-admin-content-column">
                            <div className="card super-admin-toolbar" style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem' }}>
                                <div className="super-admin-toolbar-meta">
                                    <span>Workspace</span>
                                    <strong>{menuItems.find((item) => item.path === location.pathname)?.label || 'Overview'}</strong>
                                </div>
                            </div>
                            <div className="super-admin-content-body">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function NavItem({ to, label, active = false, badgeCount = 0 }) {
    return (
        <Link
            to={to}
            className={`btn super-admin-tab super-admin-sidebar-tab ${active ? 'super-admin-tab-active' : ''}`}
        >
            {label}
            {badgeCount > 0 && <span className="super-admin-nav-badge">{badgeCount}</span>}
        </Link>
    )
}
