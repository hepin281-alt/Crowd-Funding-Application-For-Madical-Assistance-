import https from 'https'
import nodemailer from 'nodemailer'

/**
 * Notification service - sends emails/notifications
 * Configure delivery via environment variables:
 * - EMAIL_SERVICE: 'console' (default), 'smtp', or 'sendgrid'
 * - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS (for SMTP/Gmail)
 * - SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME
 * - SMS_SERVICE: 'console' (default) or 'twilio'
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID
 */

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'console'
const SMS_SERVICE = process.env.SMS_SERVICE || 'console'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const EMAIL_FROM = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@carefund.local'
const EMAIL_FROM_NAME = process.env.SENDGRID_FROM_NAME || process.env.EMAIL_FROM_NAME || 'CareFund'
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || ''
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || ''
let smtpTransporter = null

function getSmtpTransporter() {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  }
  return smtpTransporter
}

function requestHttpsJson(urlString, { method = 'POST', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (response) => {
        const chunks = []

        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 0,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        })
      }
    )

    request.on('error', reject)

    if (body) {
      request.write(body)
    }

    request.end()
  })
}

function normalizePhoneNumber(phone) {
  if (!phone) return null
  const trimmed = String(phone).trim()
  if (!trimmed) return null
  if (trimmed.startsWith('+')) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  return `+${digits}`
}

function buildVerificationEmail(email, recipientName, verificationCode, purpose = 'verification') {
  const subject = `[CareFund] Your ${purpose} code`
  const greeting = recipientName ? `Dear ${recipientName},` : 'Hello,'

  return {
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Your CareFund verification code</h2>
        <p>${greeting}</p>
        <p>Use the same code below to verify your account through either email or SMS.</p>
        <div style="background: #f0fdfa; padding: 1.25rem; border-radius: 10px; text-align: center; font-size: 1.8rem; letter-spacing: 0.35em; font-weight: 700; color: #115e59;">
          ${verificationCode}
        </div>
        <p style="margin-top: 1rem;">This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 0.9rem;">If you did not request this code, you can safely ignore this message.</p>
      </div>
    `,
    text: `${greeting}\n\nUse the same code below to verify your account through either email or SMS:\n\n${verificationCode}\n\nThis code expires in 10 minutes.\nIf you did not request this code, you can safely ignore this message.`,
  }
}

function buildVerificationSms(recipientName, verificationCode, purpose = 'verification') {
  const prefix = recipientName ? `${recipientName}, ` : ''
  return `${prefix}your CareFund ${purpose} code is ${verificationCode}. Use the same code from email or SMS. It expires in 10 minutes.`
}

// Email templates
const templates = {
  hospitalHandshake: (hospitalEmail, campaignId, patientName, verifyUrl) => ({
    to: hospitalEmail,
    subject: `[CareFund] Campaign Verification Required - Patient: ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Campaign Verification Request</h2>
        <p>A new campaign has been created claiming admission at your facility.</p>
        
        <div style="background: #f0fdfa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Campaign ID:</strong> ${campaignId}</p>
        </div>
        
        <p>Please verify this campaign by confirming the patient's admission and providing their IPD/Registration number.</p>
        
        <a href="${verifyUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0;">
          Verify Campaign
        </a>
        
        <p style="color: #666; font-size: 0.9rem;">
          If you cannot verify this patient, please reject the campaign through the verification link.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
        <p style="color: #999; font-size: 0.85rem;">
          This is an automated message from CareFund. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
Campaign Verification Request

A new campaign has been created claiming admission at your facility.

Patient Name: ${patientName}
Campaign ID: ${campaignId}

Please verify this campaign by visiting: ${verifyUrl}

If you cannot verify this patient, please reject the campaign through the verification link.
    `
  }),

  campaignVerified: (campaignerEmail, patientName, hospitalName) => ({
    to: campaignerEmail,
    subject: `[CareFund] Campaign Verified - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">✓ Campaign Verified!</h2>
        <p>Great news! Your campaign for <strong>${patientName}</strong> has been verified by ${hospitalName}.</p>
        
        <p>Your campaign is now live and can receive donations from supporters.</p>
        
        <a href="${FRONTEND_URL}/campaigner" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0;">
          View Campaign
        </a>
        
        <p style="color: #666; font-size: 0.9rem;">
          Remember to upload hospital invoices as treatment progresses to enable fund disbursement.
        </p>
      </div>
    `,
    text: `Campaign Verified!

Your campaign for ${patientName} has been verified by ${hospitalName}.

Your campaign is now live and can receive donations. Visit ${FRONTEND_URL}/campaigner to view your campaign.
    `
  }),

  campaignRejected: (campaignerEmail, patientName, hospitalName, reason) => ({
    to: campaignerEmail,
    subject: `[CareFund] Campaign Not Verified - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Campaign Not Verified</h2>
        <p>Unfortunately, your campaign for <strong>${patientName}</strong> could not be verified by ${hospitalName}.</p>
        
        ${reason ? `<div style="background: #fee2e2; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>` : ''}
        
        <p>Please contact the hospital directly if you believe this is an error, or create a new campaign with correct information.</p>
      </div>
    `,
    text: `Campaign Not Verified

Your campaign for ${patientName} could not be verified by ${hospitalName}.

${reason ? `Reason: ${reason}` : ''}

Please contact the hospital directly if you believe this is an error.
    `
  }),

  campaignNeedsInfo: (campaignerEmail, patientName, hospitalName, note) => ({
    to: campaignerEmail,
    subject: `[CareFund] Action Needed: Update Documents - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Additional Information Required</h2>
        <p>${hospitalName} has requested updates for your campaign for <strong>${patientName}</strong>.</p>

        ${note ? `<div style="background: #fffbeb; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Admin Note:</strong> ${note}</p>
        </div>` : ''}

        <p>Please update the required documents and resubmit for verification.</p>

        <a href="${FRONTEND_URL}/campaigns" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0;">
          View Campaign
        </a>
      </div>
    `,
    text: `Additional Information Required

${hospitalName} has requested updates for your campaign for ${patientName}.

${note ? `Admin Note: ${note}` : ''}

Please update the required documents and resubmit for verification.
    `
  }),

  donationReceipt: (donorEmail, campaignName, amount, campaignId) => ({
    to: donorEmail,
    subject: `[CareFund] Donation Receipt - ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Thank You for Your Donation!</h2>
        <p>Your generous contribution has been received.</p>
        
        <div style="background: #f0fdfa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Campaign:</strong> ${campaignName}</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Your donation is held securely in escrow and will be paid directly to the hospital once invoices are verified.</p>
        
        <a href="${FRONTEND_URL}/campaigns/${campaignId}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0;">
          Track Campaign Progress
        </a>
      </div>
    `,
    text: `Thank You for Your Donation!

Campaign: ${campaignName}
Amount: ₹${amount.toLocaleString()}
Date: ${new Date().toLocaleDateString()}

Your donation is held securely in escrow and will be paid directly to the hospital once invoices are verified.
    `
  }),

  fundsDisbursed: (donorEmail, campaignName, amount, hospitalName) => ({
    to: donorEmail,
    subject: `[CareFund] Funds Disbursed - ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Funds Successfully Disbursed</h2>
        <p>Your donation of <strong>₹${amount.toLocaleString()}</strong> has been paid to ${hospitalName}.</p>
        
        <p>The hospital invoices have been verified and your contribution has been used for medical treatment as intended.</p>
        
        <p style="color: #0d9488; font-weight: 600;">Thank you for making a difference!</p>
      </div>
    `,
    text: `Funds Successfully Disbursed

Your donation of ₹${amount.toLocaleString()} has been paid to ${hospitalName}.

The hospital invoices have been verified and your contribution has been used for medical treatment as intended.

Thank you for making a difference!
    `
  }),

  donationUtilized: (donorEmail, donorName, patientName, amount, hospitalName, receiptUrl) => ({
    to: donorEmail,
    subject: `[CareFund] Your Donation Has Been Utilized - ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">✓ Your Donation Has Been Utilized</h2>
        <p>Dear ${donorName},</p>
        
        <p>We are pleased to inform you that your donation has been successfully utilized for medical treatment.</p>
        
        <div style="background: #f0fdfa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>Amount Utilized:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        
        <p>A detailed utilization certificate with hospital invoice reference has been attached. This document can be used for tax deduction purposes under Section 80G.</p>
        
        <a href="${receiptUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0;">
          Download Utilization Certificate
        </a>
        
        <p style="color: #0d9488; font-weight: 600;">Thank you for your compassionate support!</p>
      </div>
    `,
    text: `Your Donation Has Been Utilized

Dear ${donorName},

We are pleased to inform you that your donation has been successfully utilized for medical treatment.

Patient: ${patientName}
Hospital: ${hospitalName}
Amount Utilized: ₹${amount.toLocaleString()}
Date: ${new Date().toLocaleDateString('en-IN')}

A detailed utilization certificate with hospital invoice reference has been attached.

Thank you for your compassionate support!
    `
  }),

  hospitalApplicationSubmitted: (adminEmail, hospitalName, applicationId) => ({
    to: adminEmail,
    subject: `[CareFund] Hospital Application Received - ${hospitalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Hospital Application Received</h2>
        <p>Thank you for applying to join CareFund as a verified hospital partner.</p>

        <div style="background: #f0fdfa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><strong>Status:</strong> PENDING</p>
        </div>

        <p>Your legal and banking details are now under review by our Super Admin team.</p>
        <p style="color: #666; font-size: 0.9rem;">You can track the application status from the Partner With Us page using your Application ID and email.</p>
      </div>
    `,
    text: `Hospital Application Received

Hospital: ${hospitalName}
Application ID: ${applicationId}
Status: PENDING

Your legal and banking details are now under review by our Super Admin team.
    `,
  }),

  hospitalApplicationApproved: (adminEmail, hospitalName, applicationId) => ({
    to: adminEmail,
    subject: `[CareFund] Application Approved - ${hospitalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Application Approved</h2>
        <p>Your hospital application has been approved by the CareFund Super Admin team.</p>

        <div style="background: #ecfdf5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><strong>Status:</strong> APPROVED</p>
        </div>

        <p>Our team will contact you with next onboarding steps for hospital admin access.</p>
      </div>
    `,
    text: `Application Approved

Hospital: ${hospitalName}
Application ID: ${applicationId}
Status: APPROVED

Our team will contact you with next onboarding steps for hospital admin access.
    `,
  }),

  hospitalApplicationRejected: (adminEmail, hospitalName, applicationId, reason) => ({
    to: adminEmail,
    subject: `[CareFund] Application Update - ${hospitalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Application Rejected</h2>
        <p>Your hospital application could not be approved at this time.</p>

        <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><strong>Status:</strong> REJECTED</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>

        <p>You may submit a fresh application after correcting the issues noted above.</p>
      </div>
    `,
    text: `Application Rejected

Hospital: ${hospitalName}
Application ID: ${applicationId}
Status: REJECTED
${reason ? `Reason: ${reason}` : ''}

You may submit a fresh application after correcting the issues noted above.
    `,
  }),
}

// Send email based on configured service
async function sendEmail(emailData) {
  if (EMAIL_SERVICE === 'console') {
    console.log('\n========== EMAIL NOTIFICATION ==========')
    console.log(`To: ${emailData.to}`)
    console.log(`Subject: ${emailData.subject}`)
    console.log('---')
    console.log(emailData.text)
    console.log('========================================\n')
    return true
  }

  if (EMAIL_SERVICE === 'sendgrid') {
    if (!SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY is missing. Email not sent.')
      return false
    }

    const response = await requestHttpsJson('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: {
          email: EMAIL_FROM,
          name: EMAIL_FROM_NAME,
        },
        subject: emailData.subject,
        content: [
          ...(emailData.text ? [{ type: 'text/plain', value: emailData.text }] : []),
          ...(emailData.html ? [{ type: 'text/html', value: emailData.html }] : []),
        ],
      }),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true
    }

    throw new Error(`SendGrid request failed with status ${response.statusCode}: ${response.body}`)
  }

  if (EMAIL_SERVICE === 'smtp') {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('SMTP_USER or SMTP_PASS is missing. Email not sent.')
      return false
    }

    const transporter = getSmtpTransporter()
    await transporter.sendMail({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    })

    return true
  }

  console.warn(`Email service '${EMAIL_SERVICE}' not implemented. Email not sent.`)
  return false
}

async function sendSms(phoneNumber, message) {
  if (SMS_SERVICE === 'console') {
    console.log('\n========== SMS NOTIFICATION ==========')
    console.log(`To: ${phoneNumber}`)
    console.log(message)
    console.log('======================================\n')
    return true
  }

  if (SMS_SERVICE === 'twilio') {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing. SMS not sent.')
      return false
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    if (!normalizedPhone) {
      console.warn('Invalid phone number supplied for SMS delivery.')
      return false
    }

    const formData = new URLSearchParams({
      To: normalizedPhone,
      Body: message,
    })

    if (TWILIO_MESSAGING_SERVICE_SID) {
      formData.set('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID)
    } else if (TWILIO_FROM_NUMBER) {
      formData.set('From', TWILIO_FROM_NUMBER)
    } else {
      console.warn('TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID is missing. SMS not sent.')
      return false
    }

    const response = await requestHttpsJson(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    )

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true
    }

    throw new Error(`Twilio request failed with status ${response.statusCode}: ${response.body}`)
  }

  console.warn(`SMS service '${SMS_SERVICE}' not implemented. SMS not sent.`)
  return false
}

export async function sendHospitalHandshake(hospitalEmail, campaignId, patientName) {
  const verifyUrl = `${FRONTEND_URL}/hospital/verify/${campaignId}`
  const emailData = templates.hospitalHandshake(hospitalEmail, campaignId, patientName, verifyUrl)
  return sendEmail(emailData)
}

export async function sendCampaignVerified(campaignerEmail, patientName, hospitalName) {
  const emailData = templates.campaignVerified(campaignerEmail, patientName, hospitalName)
  return sendEmail(emailData)
}

export async function sendCampaignRejected(campaignerEmail, patientName, hospitalName, reason) {
  const emailData = templates.campaignRejected(campaignerEmail, patientName, hospitalName, reason)
  return sendEmail(emailData)
}

export async function sendCampaignNeedsInfo(campaignerEmail, patientName, hospitalName, note) {
  const emailData = templates.campaignNeedsInfo(campaignerEmail, patientName, hospitalName, note)
  return sendEmail(emailData)
}

export async function sendDonationReceipt(donorEmail, campaignName, amount, campaignId) {
  const emailData = templates.donationReceipt(donorEmail, campaignName, amount, campaignId)
  return sendEmail(emailData)
}

export async function sendFundsDisbursed(donorEmail, campaignName, amount, hospitalName) {
  const emailData = templates.fundsDisbursed(donorEmail, campaignName, amount, hospitalName)
  return sendEmail(emailData)
}

export async function sendReceiptToDonor(donorEmail, campaignId, amount, proofUrl) {
  // Legacy function - keeping for backward compatibility
  console.log(`[CareFund] Receipt to donor ${donorEmail}: ${amount} utilized for campaign ${campaignId}`)
  return true
}

export async function sendDonationUtilizedNotification(donorEmail, donorName, patientName, amount, hospitalName, receiptUrl) {
  const emailData = templates.donationUtilized(donorEmail, donorName, patientName, amount, hospitalName, receiptUrl)
  return sendEmail(emailData)
}

export async function sendHospitalApplicationSubmitted(adminEmail, hospitalName, applicationId) {
  const emailData = templates.hospitalApplicationSubmitted(adminEmail, hospitalName, applicationId)
  return sendEmail(emailData)
}

export async function sendHospitalApplicationApproved(adminEmail, hospitalName, applicationId) {
  const emailData = templates.hospitalApplicationApproved(adminEmail, hospitalName, applicationId)
  return sendEmail(emailData)
}

export async function sendHospitalApplicationRejected(adminEmail, hospitalName, applicationId, reason) {
  const emailData = templates.hospitalApplicationRejected(adminEmail, hospitalName, applicationId, reason)
  return sendEmail(emailData)
}

export async function sendVerificationCodeToUser({ email, phone, recipientName, verificationCode, purpose = 'verification' }) {
  const emailPromise = email ? sendEmail(buildVerificationEmail(email, recipientName, verificationCode, purpose)) : Promise.resolve(false)
  const smsPromise = phone ? sendSms(phone, buildVerificationSms(recipientName, verificationCode, purpose)) : Promise.resolve(false)

  const [emailResult, smsResult] = await Promise.allSettled([emailPromise, smsPromise])

  const emailSent = emailResult.status === 'fulfilled' ? emailResult.value : false
  const smsSent = smsResult.status === 'fulfilled' ? smsResult.value : false

  if (!emailSent && !smsSent) {
    const emailError = emailResult.status === 'rejected' ? emailResult.reason?.message : null
    const smsError = smsResult.status === 'rejected' ? smsResult.reason?.message : null
    throw new Error(emailError || smsError || 'Unable to send verification code by email or SMS')
  }

  return { emailSent, smsSent }
}
