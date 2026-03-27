import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const axiosInstance = axios.create({
  baseURL: API_URL,
})

// Add token to request headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carefund_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('carefund_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
