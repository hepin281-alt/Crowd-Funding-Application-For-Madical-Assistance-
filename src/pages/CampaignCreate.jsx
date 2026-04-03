import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CampaignCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ medicalBill: '', identityProof: '' })
  const [isDraft, setIsDraft] = useState(false)
  const [uploading, setUploading] = useState({ cover: false, bill: false, identity: false })

  const coverInputRef = useRef(null)
  const medicalBillInputRef = useRef(null)
  const identityProofInputRef = useRef(null)

  // Step 1: Campaign Basics
  const [campaignTitle, setCampaignTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  // Step 2: Patient & Medical Details
  const [patientName, setPatientName] = useState('')
  const [patientRelationship, setPatientRelationship] = useState('')
  const [medicalCondition, setMedicalCondition] = useState('')
  const [treatingDoctor, setTreatingDoctor] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [hospitalId, setHospitalId] = useState('')

  // Step 3: Story & Media
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [description, setDescription] = useState('')

  // Step 4: Verification Documents
  const [medicalBillUrl, setMedicalBillUrl] = useState('')
  const [identityProofUrl, setIdentityProofUrl] = useState('')
  const [bankAccountHolder, setBankAccountHolder] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [payoutMode, setPayoutMode] = useState('DIRECT_TO_HOSPITAL')

  useEffect(() => {
    let isMounted = true
    api.hospitals.list()
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : []
        setHospitals(list)
      })
      .catch(() => {
        if (!isMounted) return
        setHospitals([])
        setError('Unable to load hospitals. Please refresh or try again in a moment.')
      })
    return () => {
      isMounted = false
    }
  }, [])

  const cityOptions = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(
        hospitals
          .map((h) => (h.city || '').trim())
          .filter(Boolean)
      )
    )

    return uniqueCities.sort((a, b) => a.localeCompare(b))
  }, [hospitals])

  const filteredHospitals = useMemo(() => {
    if (!selectedCity) return []
    return hospitals.filter((h) => (h.city || '').trim().toLowerCase() === selectedCity.toLowerCase())
  }, [hospitals, selectedCity])

  useEffect(() => {
    if (!hospitalId) return
    const existsInCity = filteredHospitals.some((h) => String(h.id || h._id) === String(hospitalId))
    if (!existsInCity) {
      setHospitalId('')
    }
  }, [filteredHospitals, hospitalId])

  const handleUpload = async (file, setUrl, key) => {
    if (!file) return
    setUploading((prev) => ({ ...prev, [key]: true }))
    try {
      const result = await api.uploads.upload(file)
      setUrl(result.url)
      if (key === 'bill') {
        setFieldErrors((prev) => ({ ...prev, medicalBill: '' }))
      }
      if (key === 'identity') {
        setFieldErrors((prev) => ({ ...prev, identityProof: '' }))
      }
      setError('')
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (!user || user.role !== 'user') {
    navigate('/login')
    return null
  }

  const validateStep1 = () => {
    if (!campaignTitle.trim()) {
      setError('Campaign title is required')
      return false
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError('Target amount must be a positive number')
      return false
    }
    if (deadline && new Date(deadline) < new Date()) {
      setError('Deadline cannot be in the past')
      return false
    }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (!patientName.trim()) {
      setError('Patient name is required')
      return false
    }
    if (!medicalCondition.trim()) {
      setError('Medical condition is required')
      return false
    }
    if (!selectedCity) {
      setError('Please select a city')
      return false
    }
    if (!hospitalId) {
      setError('Please select a verified hospital')
      return false
    }
    setError('')
    return true
  }

  const validateStep3 = () => {
    if (!description.trim()) {
      setError('Campaign story/description is required')
      return false
    }
    if (description.trim().length < 50) {
      setError('Please provide a more detailed story (at least 50 characters)')
      return false
    }
    setError('')
    return true
  }

  const validateStep4 = () => {
    const nextFieldErrors = { medicalBill: '', identityProof: '' }
    let hasError = false
    if (!medicalBillUrl.trim()) {
      nextFieldErrors.medicalBill = 'Medical estimate or bill is required'
      hasError = true
    }
    if (!identityProofUrl.trim()) {
      nextFieldErrors.identityProof = 'Patient identity proof is required'
      hasError = true
    }
    setFieldErrors(nextFieldErrors)
    if (hasError) {
      setError('Please fix the required fields below')
      return false
    }
    if (payoutMode === 'PERSONAL_ACCOUNT') {
      if (!bankAccountHolder.trim()) {
        setError('Bank account holder name is required')
        return false
      }
      if (!bankAccount.trim()) {
        setError('Bank account number is required')
        return false
      }
      if (!bankIfsc.trim()) {
        setError('IFSC code is required')
        return false
      }
    }
    setError('')
    return true
  }

  const handleNext = () => {
    let isValid = false
    if (step === 1) isValid = validateStep1()
    else if (step === 2) isValid = validateStep2()
    else if (step === 3) isValid = validateStep3()

    if (isValid) {
      setStep(step + 1)
      setError('')
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        campaignTitle,
        patientName,
        patientRelationship,
        medicalCondition,
        treatingDoctorName: treatingDoctor,
        description,
        amountNeeded: targetAmount ? Number(targetAmount) : null,
        hospitalId: hospitalId || null,
        deadline: deadline || null,
        coverImageUrl,
        medicalBillUrl,
        patientIdentityProofUrl: identityProofUrl,
        bankAccountHolderName: bankAccountHolder,
        bankAccountNumber: bankAccount,
        bankIfscCode: bankIfsc,
        payoutMode,
        isDraft: true,
      }

      const result = await api.campaigns.create(payload)
      setIsDraft(true)
      setError('Draft saved successfully!')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateStep4()) {
      setLoading(false)
      return
    }

    try {
      const payload = {
        campaignTitle,
        patientName,
        patientRelationship,
        medicalCondition,
        treatingDoctorName: treatingDoctor,
        description,
        amountNeeded: Number(targetAmount),
        hospitalId: hospitalId ? parseInt(hospitalId) : null,
        deadline: deadline || null,
        coverImageUrl,
        medicalBillUrl,
        patientIdentityProofUrl: identityProofUrl,
        bankAccountHolderName: bankAccountHolder,
        bankAccountNumber: bankAccount,
        bankIfscCode: bankIfsc,
        payoutMode,
        isDraft: false,
      }

      const result = await api.campaigns.create(payload)
      navigate('/dashboard', {
        state: {
          campaignSubmitted: true,
          campaignId: result?._id || result?.id || null,
          patientName,
          hospitalName: result?.hospital?.name || null,
          status: 'pending_hospital_verification',
        },
      })
    } catch (err) {
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-campaign-page">
      <div className="container">
        <div className="campaign-form-container">
          {/* Progress Indicator */}
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
            <div className="step-indicators">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`step-indicator ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                  onClick={() => s < step && setStep(s)}
                >
                  <span>{s}</span>
                  <label>
                    {s === 1 && 'Basics'}
                    {s === 2 && 'Medical'}
                    {s === 3 && 'Story'}
                    {s === 4 && 'Documents'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Campaign Basics */}
          {step === 1 && (
            <div className="form-step">
              <h2>Step 1: Campaign Basics</h2>
              <p className="step-description">
                Provide the foundation for your campaign
              </p>

              <div className="form-group">
                <label>Campaign Title *</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g., Help Amit Fight Leukemia"
                  className="form-input"
                />
                <small>Make it clear and compelling</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g., 500000"
                    className="form-input"
                  />
                  <small>Total funds needed for treatment</small>
                </div>

                <div className="form-group">
                  <label>Fund Deadline (Optional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="form-input"
                  />
                  <small>When do funds need to be raised?</small>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Patient & Medical Details */}
          {step === 2 && (
            <div className="form-step">
              <h2>Step 2: Patient & Medical Details</h2>
              <p className="step-description">
                Connect your campaign to a real person and medical facility
              </p>

              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name of the patient"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Your Relationship to Patient</label>
                  <select value={patientRelationship} onChange={(e) => setPatientRelationship(e.target.value)} className="form-input">
                    <option value="">Select relationship</option>
                    <option value="Self">Self</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Treating Doctor's Name</label>
                  <input
                    type="text"
                    value={treatingDoctor}
                    onChange={(e) => setTreatingDoctor(e.target.value)}
                    placeholder="Dr. Name"
                    className="form-input"
                  />
                  <small>Adds credibility to your campaign</small>
                </div>
              </div>

              <div className="form-group">
                <label>Medical Condition / Diagnosis *</label>
                <input
                  type="text"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  placeholder="e.g., Acute Leukemia"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Treating Hospital / Medical Facility *</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value)
                        setHospitalId('')
                      }}
                      className="form-input"
                    >
                      <option value="">Select city</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <select
                  value={hospitalId}
                  disabled={!selectedCity}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="form-input"
                >
                  <option value="">{selectedCity ? 'Select a verified hospital' : 'Select city first'}</option>
                  {filteredHospitals.map((h) => {
                    const location = h.city ? `${h.city}${h.state ? ', ' + h.state : ''}` : (h.address || 'Location not specified')
                    return (
                      <option key={h.id || h._id} value={h.id || h._id}>
                        {h.name} ({location})
                      </option>
                    )
                  })}
                </select>
                <small>We verify all hospitals on our platform</small>
              </div>
            </div>
          )}

          {/* Step 3: Story & Media */}
          {step === 3 && (
            <div className="form-step">
              <h2>Step 3: Your Story & Media</h2>
              <p className="step-description">
                Connect emotionally with potential donors
              </p>

              <div className="form-group">
                <label>Cover Image URL (Optional)</label>
                <div className="upload-row">
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploading.cover}
                  >
                    {uploading.cover ? 'Uploading...' : 'Upload'}
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="file-input-hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], setCoverImageUrl, 'cover')
                    }
                  />
                </div>
                <small>High-quality photo of the patient (or relevant medical setting)</small>
                {coverImageUrl && (
                  <div className="image-preview">
                    <img src={coverImageUrl} alt="Cover preview" onError={(e) => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Campaign Story / Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share the patient's story, treatment plan, financial struggle, and how funds will be used. Be detailed and connect emotionally with donors."
                  rows={8}
                  className="form-input story-textarea"
                />
                <small>
                  {description.length} characters (minimum 50 recommended)
                </small>
              </div>

              <div className="story-tips">
                <h4>💡 Tips for a compelling story:</h4>
                <ul>
                  <li>Explain the diagnosis and treatment plan</li>
                  <li>Describe the family's financial situation</li>
                  <li>Detail how funds will be used specifically</li>
                  <li>Share the patient's hopes and dreams</li>
                  <li>Be honest and authentic</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Verification & Documents */}
          {step === 4 && (
            <div className="form-step">
              <h2>Step 4: Verification & Documents</h2>
              <p className="step-description">
                Build trust with comprehensive documentation
              </p>

              <div className="payout-mode-selector">
                <h3>How should funds be disbursed?</h3>
                <div className="mode-options">
                  <label className={`mode-option ${payoutMode === 'DIRECT_TO_HOSPITAL' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="DIRECT_TO_HOSPITAL"
                      checked={payoutMode === 'DIRECT_TO_HOSPITAL'}
                      onChange={(e) => setPayoutMode(e.target.value)}
                    />
                    <span>Direct to Hospital</span>
                    <small>Funds go directly to the hospital (Most Secure)</small>
                  </label>
                  <label className={`mode-option ${payoutMode === 'PERSONAL_ACCOUNT' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="PERSONAL_ACCOUNT"
                      checked={payoutMode === 'PERSONAL_ACCOUNT'}
                      onChange={(e) => setPayoutMode(e.target.value)}
                    />
                    <span>Personal Bank Account</span>
                    <small>Funds go to your account</small>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Medical Estimate / Bill *</label>
                <div className="upload-row">
                  <input
                    type="url"
                    value={medicalBillUrl}
                    onChange={(e) => {
                      setMedicalBillUrl(e.target.value)
                      if (e.target.value.trim()) {
                        setFieldErrors((prev) => ({ ...prev, medicalBill: '' }))
                      }
                    }}
                    placeholder="https://example.com/medical-bill.pdf"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => medicalBillInputRef.current?.click()}
                    disabled={uploading.bill}
                  >
                    {uploading.bill ? 'Uploading...' : 'Upload'}
                  </button>
                  <input
                    ref={medicalBillInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="file-input-hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], setMedicalBillUrl, 'bill')
                    }
                  />
                </div>
                {fieldErrors.medicalBill && (
                  <span className="field-error">{fieldErrors.medicalBill}</span>
                )}
                <small>Official letter or estimate from hospital (builds trust)</small>
              </div>

              <div className="form-group">
                <label>Patient Identity Proof *</label>
                <div className="upload-row">
                  <input
                    type="url"
                    value={identityProofUrl}
                    onChange={(e) => {
                      setIdentityProofUrl(e.target.value)
                      if (e.target.value.trim()) {
                        setFieldErrors((prev) => ({ ...prev, identityProof: '' }))
                      }
                    }}
                    placeholder="https://example.com/id-proof.pdf"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => identityProofInputRef.current?.click()}
                    disabled={uploading.identity}
                  >
                    {uploading.identity ? 'Uploading...' : 'Upload'}
                  </button>
                  <input
                    ref={identityProofInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="file-input-hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], setIdentityProofUrl, 'identity')
                    }
                  />
                </div>
                {fieldErrors.identityProof && (
                  <span className="field-error">{fieldErrors.identityProof}</span>
                )}
                <small>Government ID for verification</small>
              </div>

              {payoutMode === 'PERSONAL_ACCOUNT' && (
                <>
                  <div className="form-group">
                    <label>Bank Account Holder Name *</label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Name as it appears on bank account"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Account Number *</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="16-18 digit account number"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>IFSC Code *</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        placeholder="11 character IFSC code"
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="document-tips">
                <h4>🔒 Why these documents matter:</h4>
                <ul>
                  <li>Medical documents verify the legitimacy of the treatment</li>
                  <li>Identity verification prevents fraud</li>
                  <li>Bank details ensure secure fund transfers</li>
                  <li>All documents are verified by our admin team</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className={`error-message ${isDraft ? 'success' : ''}`}>{error}</div>}

          {/* Form Navigation */}
          <div className="form-navigation">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                ← Previous
              </button>
            )}

            {step === 1 && (
              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading}>
                Next: Patient Details →
              </button>
            )}

            {step === 2 && (
              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading}>
                Next: Your Story →
              </button>
            )}

            {step === 3 && (
              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading}>
                Next: Verification →
              </button>
            )}

            {step === 4 && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  💾 Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Publishing...' : '✓ Submit Campaign'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
