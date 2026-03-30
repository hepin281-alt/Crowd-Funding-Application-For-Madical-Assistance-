// Status Badges
export function StatusBadge({ status, label }) {
    const styles = {
        emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        blue: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
        red: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
        active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
        pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        suspended: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
        completed: 'bg-blue-100 text-blue-800 border-blue-300',
        rejected: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
        verified: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        unverified: 'bg-amber-100 text-amber-800 border-amber-300',
    }

    return (
        <span
            className={`status-badge status-${status || 'default'} inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
        >
            {label || status}
        </span>
    )
}

// Metric Card
export function MetricCard({ title, value, subtext, icon }) {
    return (
        <div className="stat-card card">
            {icon && <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{icon}</div>}
            <span className="stat-value">{value}</span>
            <span className="stat-label">{title}</span>
            {subtext && <p className="text-sm text-slate-600 mt-2">{subtext}</p>}
        </div>
    )
}

// Empty State
export function EmptyState({ icon, title, message, action }) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-slate-600 text-sm mt-2">{message}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}

// Data Card
export function DataCard({ children, className = '' }) {
    return <div className={`card ${className}`}>{children}</div>
}

// Section Header
export function SectionHeader({ title, description, action }) {
    return (
        <div className="section-header">
            <div>
                <h2>{title}</h2>
                {description && <p className="welcome-text" style={{ marginBottom: 0 }}>{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}

// Table Header Cell
export function TableHeaderCell({ children, align = 'left' }) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    }[align] || 'text-left'

    return (
        <th className={`px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-50 border-b border-slate-200 ${alignClass}`}>
            {children}
        </th>
    )
}

// Table Row Cell
export function TableCell({ children, align = 'left', mono = false }) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    }[align] || 'text-left'

    return (
        <td
            className={`px-6 py-4 text-sm border-b border-slate-200 ${mono ? 'font-mono text-slate-600' : 'text-slate-700'
                } ${alignClass}`}
        >
            {children}
        </td>
    )
}

// Button variants
export function Button({ children, variant = 'primary', ...props }) {
    const styles = {
        primary: 'bg-[#0d9488] text-white hover:bg-[#0f766e]',
        secondary: 'bg-[#d9ebe8] text-[#1f5f5b] hover:bg-[#cce3df]',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    }

    return (
        <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles[variant]}`}
            {...props}
        >
            {children}
        </button>
    )
}
