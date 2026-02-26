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
    verifyIdentity: (code) =>
      request('/auth/verify-identity', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    resendVerification: () =>
      request('/auth/resend-verification', { method: 'POST' }),
  },
  hospitals: {
    list: () => request('/hospitals'),
    get: (id) => request(`/hospitals/${id}`),
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
  },
  receipts: {
    my: () => request('/receipts/my'),
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
  employee: {
    hospitals: () => request('/employee/hospitals'),
  },
  hospitalAdmin: {
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
}
