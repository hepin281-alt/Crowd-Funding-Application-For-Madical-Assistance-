import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Signup() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('user')
  const hospitalOptions = [
    'City General Hospital',
    'Care Medical Institute',
    'Apollo Hospitals',
    'Fortis Hospital',
    'Manipal Hospital',
    'Max Super Speciality Hospital',
    'Lilavati Hospital',
    'AIIMS Delhi',
    'Narayana Health City',
    'Ruby Hall Clinic',
    'Medanta - The Medicity',
    'Kokilaben Dhirubhai Ambani Hospital',
    'Jaslok Hospital',
    'Sri Ramachandra Medical Centre',
    'Aster CMI Hospital',
    'KIMS Hospital',
    'Sterling Hospitals',
  ]

  // User fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Hospital Admin fields
  const [adminName, setAdminName] = useState('')
  const [hospitalEmail, setHospitalEmail] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [customHospitalName, setCustomHospitalName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [hospitalPhone, setHospitalPhone] = useState('')
  const [hospitalDocument, setHospitalDocument] = useState(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminAgreeTerms, setAdminAgreeTerms] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [signupOtp, setSignupOtp] = useState('')
  const [signupInfoMessage, setSignupInfoMessage] = useState('')
  const [pendingSignup, setPendingSignup] = useState({ email: '', password: '', phone: '' })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect to dashboard if already logged in
  if (user) {
    if (user.role === 'hospital_admin') {
      navigate('/admin-dashboard', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
    return null
  }

  const handleUserSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (!agreeTerms) {
      setError('Please accept the Terms & Conditions.')
      setLoading(false)
      return
    }

    try {
      const body = { name, email, phone, password, role: 'user' }
      const response = await api.auth.signup(body)

      if (response.requires_verification) {
        setOtpStep(true)
        setSignupInfoMessage(response.message || 'A verification code has been sent to your email and phone number.')
        setPendingSignup({ email, password, phone })
        setError('')
        setLoading(false)
        return
      }

      if (response.token && response.user) {
        login(response.user, response.token)
        navigate('/dashboard')
        return
      }

      navigate('/login')
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!signupOtp.trim()) {
      setError('Please enter the OTP sent to your email or phone number.')
      setLoading(false)
      return
    }

    try {
      const { token, user: userData } = await api.auth.verifySignupOtp(
        pendingSignup.email,
        pendingSignup.password,
        signupOtp.trim()
      )
      login(userData, token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendSignupOtp = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await api.auth.resendSignupOtp(pendingSignup.email, pendingSignup.password)
      setSignupInfoMessage(response?.message || 'A new verification code has been sent to your email and phone number.')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const selectedHospitalName =
      hospitalName === 'other' ? customHospitalName.trim() : hospitalName

    if (!adminName || !hospitalEmail || !selectedHospitalName || !licenseNumber || !hospitalPhone || !adminPassword) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (!hospitalDocument) {
      setError('Please upload the medical license document.')
      setLoading(false)
      return
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (!adminAgreeTerms) {
      setError('Please accept the Terms & Conditions.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', adminName)
      formData.append('email', hospitalEmail)
      formData.append('password', adminPassword)
      formData.append('role', 'hospital_admin')
      formData.append('hospitalName', selectedHospitalName)
      formData.append('licenseNumber', licenseNumber)
      formData.append('phone', hospitalPhone)
      formData.append('hospitalDocument', hospitalDocument)

      const { token, user: userData } = await api.auth.signupHospitalAdmin(formData)
      login(userData, token)
      // Redirect to profile/verification page for hospital admin
      navigate('/admin-pending-verification')
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Sign Up</h1>
        <p className="auth-subtitle">Create your CareFund account</p>

        {/* Role Selection */}
        <div className="role-selection">
          <label className="role-label">I am a:</label>
          <div className="role-options">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>Donor / Patient / Campaigner</span>
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="hospital_admin"
                checked={role === 'hospital_admin'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>Hospital Admin</span>
            </label>
          </div>
        </div>

        {signupInfoMessage && <p className="auth-success">{signupInfoMessage}</p>}
        {error && <p className="auth-error">{error}</p>}

        {/* User Signup Form */}
        {role === 'user' && !otpStep ? (
          <form onSubmit={handleUserSignup} className="auth-form">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        ) : role === 'user' && otpStep ? (
          <form onSubmit={handleVerifySignupOtp} className="auth-form">
            <label>Phone Number</label>
            <input type="text" value={phone} disabled />

            <label>OTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={signupOtp}
              onChange={(e) => setSignupOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              required
            />

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleResendSignupOtp}
              disabled={loading}
              style={{ marginTop: '0.75rem' }}
            >
              Resend OTP
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => {
                setOtpStep(false)
                setSignupOtp('')
                setSignupInfoMessage('')
              }}
              style={{ marginTop: '0.75rem' }}
            >
              Back to Signup
            </button>
          </form>
        ) : (
          /* Hospital Admin Signup Form */
          <form onSubmit={handleAdminSignup} className="auth-form">
            <label>Admin's Full Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <label>Official Hospital Email Address</label>
            <input
              type="email"
              value={hospitalEmail}
              onChange={(e) => setHospitalEmail(e.target.value)}
              placeholder="admin@cityhospital.com"
              required
            />

            <label>Hospital Name</label>
            <select
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              required
            >
              <option value="">Select hospital name</option>
              {hospitalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="other">Other (not listed)</option>
            </select>

            {hospitalName === 'other' && (
              <input
                type="text"
                value={customHospitalName}
                onChange={(e) => setCustomHospitalName(e.target.value)}
                placeholder="Enter official hospital name"
                required
              />
            )}

            <label>Hospital Registration / License Number</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="License or registration number"
              required
            />

            <label>Medical License Document (PDF/Image)</label>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setHospitalDocument(e.target.files?.[0] || null)}
              required
            />

            <label>Hospital Contact Number</label>
            <input
              type="tel"
              value={hospitalPhone}
              onChange={(e) => setHospitalPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={adminAgreeTerms}
                onChange={(e) => setAdminAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>

            <p className="verification-note">
              Note: Your account will be in Pending Verification state. Our team will verify your hospital details before full access is granted.
            </p>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
