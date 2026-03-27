import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import SuperAdminLayout from '../components/SuperAdminLayout'
import { DataCard } from '../components/SuperAdminComponents'
import { useTheme } from '../context/ThemeContext'

export default function SuperAdminSettings() {
    const [activeTab, setActiveTab] = useState('rbac')
    const [permissions, setPermissions] = useState(null)
    const [emailTemplates, setEmailTemplates] = useState([])
    const [cmsContent, setCmsContent] = useState({})
    const [selectedPage, setSelectedPage] = useState(null)
    const [editingContent, setEditingContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saved, setSaved] = useState(false)
    const { themeMode, setThemeMode, theme } = useTheme()

    useEffect(() => {
        fetchSettings()
    }, [activeTab])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            setSaved(false)

            if (activeTab === 'rbac') {
                const response = await axiosInstance.get('/super-admin/settings/rbac')
                setPermissions(response.data)
            } else if (activeTab === 'email') {
                const response = await axiosInstance.get('/super-admin/settings/email-templates')
                setEmailTemplates(response.data)
            } else if (activeTab === 'cms') {
                const response = await axiosInstance.get('/super-admin/settings/cms')
                setCmsContent(response.data)
            } else {
                setLoading(false)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const saveCMSContent = async (page, content) => {
        try {
            await axiosInstance.post('/super-admin/settings/cms', { page, content })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save content')
        }
    }

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading settings...</p>
                    </div>
                </div>
            </SuperAdminLayout>
        )
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-page super-settings-page p-6 xl:p-8 max-w-7xl mx-auto">
                <div className="card super-settings-hero">
                    <p className="super-settings-kicker">Control Center</p>
                    <h1>Platform Settings</h1>
                    <p>Manage permissions, notification templates, and website content from one place.</p>
                </div>

                {/* Tabs */}
                <div className="super-settings-tabs-wrap mb-8">
                    <div className="super-settings-tabs">
                        <button
                            onClick={() => setActiveTab('rbac')}
                            className={`super-settings-tab ${activeTab === 'rbac' ? 'active' : ''}`}
                        >
                            Role-Based Access
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`super-settings-tab ${activeTab === 'email' ? 'active' : ''}`}
                        >
                            Email Templates
                        </button>
                        <button
                            onClick={() => setActiveTab('cms')}
                            className={`super-settings-tab ${activeTab === 'cms' ? 'active' : ''}`}
                        >
                            CMS Content
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`super-settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                        >
                            Appearance
                        </button>
                    </div>
                </div>

                {saved && (
                    <div className="super-settings-alert success mb-6">
                        <span>✓</span> Changes saved successfully!
                    </div>
                )}

                {error && (
                    <div className="super-settings-alert error mb-6">
                        {error}
                    </div>
                )}

                {/* RBAC Tab */}
                {activeTab === 'rbac' && permissions && (
                    <div className="space-y-6">
                        <div className="super-settings-note">
                            <p className="title">Role-Based Access Control</p>
                            <p className="desc">Configure what actions each user role can perform in the system.</p>
                        </div>

                        <div className="space-y-6">
                            {permissions.roles.map((role) => (
                                <DataCard key={role}>
                                    <div className="p-6 super-settings-role-card">
                                        <div className="super-settings-role-head">
                                            <h3 className="capitalize">{role}</h3>
                                            <span className="badge">{(permissions.permissions[role] || []).length} permissions</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {(permissions.permissions[role] || []).map((permission) => (
                                                <div
                                                    key={permission}
                                                    className="super-settings-permission"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        defaultChecked
                                                        className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                                                        id={`${role}-${permission}`}
                                                    />
                                                    <label
                                                        htmlFor={`${role}-${permission}`}
                                                        className="ml-3 text-sm font-medium cursor-pointer"
                                                    >
                                                        {permission.replace(/_/g, ' ')}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </DataCard>
                            ))}
                        </div>

                        <button className="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                )}

                {/* Email Templates Tab */}
                {activeTab === 'email' && (
                    <div>
                        <div className="super-settings-note mb-6">
                            <p className="title">Email Templates</p>
                            <p className="desc">Manage system notification emails sent to users.</p>
                        </div>

                        <div className="space-y-4">
                            {emailTemplates.map((template) => (
                                <DataCard key={template.id}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900">{template.name}</h3>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <code className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-700">
                                                        {template.id}
                                                    </code>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-3">
                                                    <strong>Subject:</strong> {template.subject}
                                                </p>
                                            </div>
                                            <button className="btn btn-secondary btn-sm">Edit</button>
                                        </div>
                                    </div>
                                </DataCard>
                            ))}
                        </div>

                        <div className="super-settings-note mt-6">
                            <p className="title">Template Hint</p>
                            <p className="desc">
                                Email templates use handlebars syntax for dynamic content. Example: {'{'}'{'{'}name{'}'}{'}'} will be replaced with the recipient's name.
                            </p>
                        </div>
                    </div>
                )}

                {/* CMS Content Tab */}
                {activeTab === 'cms' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* CMS Navigation */}
                        <DataCard>
                            <div className="p-6 super-settings-cms-nav">
                                <h3 className="font-semibold text-slate-900 mb-4">Pages</h3>
                                <div className="space-y-2">
                                    {['terms_of_service', 'privacy_policy', 'how_it_works', 'faq'].map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => {
                                                setSelectedPage(page)
                                                setEditingContent(cmsContent[page] || '')
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${selectedPage === page
                                                ? 'super-settings-cms-page active'
                                                : 'super-settings-cms-page'
                                                }`}
                                        >
                                            {page
                                                .split('_')
                                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                .join(' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </DataCard>

                        {/* CMS Editor */}
                        {selectedPage && (
                            <div className="lg:col-span-3">
                                <DataCard>
                                    <div className="p-6">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                                            {selectedPage
                                                .split('_')
                                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                .join(' ')}
                                        </h2>

                                        <textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="super-settings-textarea"
                                            placeholder="Enter content here..."
                                        />

                                        <div className="mt-6 flex gap-3">
                                            <button
                                                onClick={() => saveCMSContent(selectedPage, editingContent)}
                                                className="btn btn-primary"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => setSelectedPage(null)}
                                                className="btn btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </DataCard>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                        <DataCard>
                            <div className="p-6 super-settings-appearance-card">
                                <h3>Theme Preferences</h3>
                                <p className="super-settings-appearance-desc">
                                    Set the default theme for your Super Admin workspace. This is saved on this browser.
                                </p>

                                <div className="super-settings-theme-options">
                                    {[{ key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' }, { key: 'system', label: 'System' }].map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            className={`super-settings-theme-option ${themeMode === option.key ? 'active' : ''}`}
                                            onClick={() => setThemeMode(option.key)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <p className="super-settings-appearance-note">
                                    Active theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                                </p>
                            </div>
                        </DataCard>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    )
}
