const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getToken() {
  return localStorage.getItem('carefund_token')
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function uploadRequest(path, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch (err) {
    throw new Error(
      'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

async function multipartRequest(path, formData) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
    })
  } catch (err) {
    throw new Error(
      'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...getHeaders(), ...options.headers },
    })
  } catch (err) {
    throw new Error(
      'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

function getFilenameFromDisposition(disposition, fallback = 'download.pdf') {
  if (!disposition) return fallback
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i)
  if (asciiMatch?.[1]) return asciiMatch[1]
  return fallback
}

async function downloadFile(path, fallbackFilename = 'download.pdf') {
  const token = getToken()
  if (!token) throw new Error('Please log in again to download this file')

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    throw new Error(
      'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
    )
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to download file')
  }

  const blob = await res.blob()
  const fileName = getFilenameFromDisposition(
    res.headers.get('content-disposition'),
    fallbackFilename
  )

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(objectUrl)
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signup: (data) =>
      request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request('/auth/me'),
    resendVerification: () =>
      request('/auth/resend-verification', { method: 'POST' }),
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token, password) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },
  hospitals: {
    list: () => request('/hospitals'),
    get: (id) => request(`/hospitals/${id}`),
    apply: (formData) => multipartRequest('/hospitals/apply', formData),
    applicationStatus: (applicationId, adminEmail) =>
      request(
        `/hospitals/application-status?applicationId=${encodeURIComponent(applicationId)}&adminEmail=${encodeURIComponent(adminEmail)}`
      ),
  },
  campaigns: {
    list: () => request('/campaigns'),
    get: (id) => request(`/campaigns/${id}`),
    my: () => request('/campaigns/my'),
    create: (data) =>
      request('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDocuments: (id, data) =>
      request(`/campaigns/${id}/documents`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  donations: {
    create: (campaignId, amount) =>
      request('/donations', {
        method: 'POST',
        body: JSON.stringify({ campaignId, amount }),
      }),
    my: () => request('/donations/my'),
    byCampaign: (campaignId) => request(`/donations/campaign/${campaignId}`),
  },
  receipts: {
    my: () => request('/receipts/my'),
    get: (id) => request(`/receipts/${id}`),
    downloadReceipt: (id) => `${API_URL}/receipts/${id}/download`,
    downloadCertificate: (id) => `${API_URL}/receipts/${id}/certificate`,
    downloadUtilization: (id) => `${API_URL}/receipts/${id}/utilization`,
    downloadReceiptFile: (id) => downloadFile(`/receipts/${id}/download`, `donation-receipt-${id}.pdf`),
    downloadCertificateFile: (id) => downloadFile(`/receipts/${id}/certificate`, `appreciation-certificate-${id}.pdf`),
    downloadUtilizationFile: (id) => downloadFile(`/receipts/${id}/utilization`, `utilization-certificate-${id}.pdf`),
    markUtilized: (id) =>
      request(`/receipts/${id}/mark-utilized`, {
        method: 'POST',
      }),
  },
  invoices: {
    create: (campaignId, amount, documentUrl) =>
      request('/invoices', {
        method: 'POST',
        body: JSON.stringify({ campaignId, amount, documentUrl }),
      }),
    byCampaign: (campaignId) => request(`/invoices/campaign/${campaignId}`),
    pending: () => request('/invoices/pending'),
    matched: () => request('/invoices/matched'),
    match: (id) =>
      request(`/invoices/${id}/match`, { method: 'POST' }),
    settle: (id) =>
      request(`/invoices/${id}/settle`, { method: 'POST' }),
  },
  uploads: {
    upload: (file) => uploadRequest('/uploads', file),
  },
  hospitalAdmin: {
    overview: () => request('/hospital-admin/overview'),
    campaigns: (params = {}) => {
      const q = new URLSearchParams()
      if (params.tab) q.set('tab', params.tab)
      if (params.search) q.set('search', params.search)
      if (params.status) q.set('status', params.status)
      return request(`/hospital-admin/campaigns${q.toString() ? `?${q.toString()}` : ''}`)
    },
    financials: () => request('/hospital-admin/financials'),
    pending: () => request('/hospital-admin/pending'),
    verify: (campaignId, ipdNumber) =>
      request(`/hospital-admin/verify/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({ ipdNumber }),
      }),
    reject: (campaignId, reason) =>
      request(`/hospital-admin/reject/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    requestInfo: (campaignId, note) =>
      request(`/hospital-admin/request-info/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
  },
  superAdmin: {
    campaigns: (params = {}) => {
      const q = new URLSearchParams()
      if (params.filter) q.set('filter', params.filter)
      if (params.search) q.set('search', params.search)
      if (params.sortBy) q.set('sortBy', params.sortBy)
      if (params.order) q.set('order', params.order)
      return request(`/super-admin/campaigns${q.toString() ? `?${q.toString()}` : ''}`)
    },
  },
}
