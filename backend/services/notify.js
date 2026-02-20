/**
 * Notification service - sends emails/notifications
 * Configure email service via environment variables:
 * - EMAIL_SERVICE: 'console' (default), 'smtp', 'sendgrid'
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for SMTP)
 * - SENDGRID_API_KEY (for SendGrid)
 */

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'console'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

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
  })
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

  // TODO: Implement actual email sending
  // if (EMAIL_SERVICE === 'smtp') {
  //   // Use nodemailer with SMTP
  // }
  // if (EMAIL_SERVICE === 'sendgrid') {
  //   // Use SendGrid API
  // }

  console.warn(`Email service '${EMAIL_SERVICE}' not implemented. Email not sent.`)
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
