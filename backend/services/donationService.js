function httpError(message, statusCode) {
    const err = new Error(message)
    err.statusCode = statusCode
    return err
}

export async function createDonationWithLock(
    { db, Campaign, Donation, Receipt },
    { campaignId, requestedAmount, user, skipCampaignVerification }
) {
    let donation
    let campaignName = null

    await db.transaction(async (t) => {
        const campaign = await Campaign.findByPk(campaignId, {
            transaction: t,
            lock: t?.LOCK?.UPDATE,
        })

        if (!campaign) {
            throw httpError('Campaign not found', 404)
        }

        if (!skipCampaignVerification && campaign.status !== 'hospital_verified' && campaign.status !== 'active') {
            throw httpError('Campaign is not open for donations', 400)
        }

        const currentRaised = parseFloat(campaign.raised_amount || 0)
        const targetAmount = parseFloat(campaign.target_amount || 0)

        if (currentRaised >= targetAmount) {
            throw httpError('This campaign is already fully funded and cannot accept more donations', 400)
        }

        const remainingNeeded = targetAmount - currentRaised
        if (requestedAmount > remainingNeeded) {
            throw httpError(`You can donate up to ₹${remainingNeeded.toLocaleString('en-IN')}`, 400)
        }

        donation = await Donation.create(
            {
                campaign_id: parseInt(campaignId),
                donor_id: user.id,
                amount: requestedAmount,
            },
            { transaction: t }
        )

        const receiptNumber = `RCP-${Date.now()}-${donation.id}`
        await Receipt.create(
            {
                campaign_id: parseInt(campaignId),
                donation_id: donation.id,
                donor_id: user.id,
                disbursement_request_id: null,
                amount: requestedAmount,
                receipt_number: receiptNumber,
                receipt_date: new Date(),
                donor_name: user.name,
                donor_email: user.email,
                tax_80g_eligible: true,
            },
            { transaction: t }
        )

        const newRaised = currentRaised + requestedAmount
        await campaign.update(
            {
                raised_amount: newRaised,
                status: 'active',
            },
            { transaction: t }
        )

        campaignName = campaign.patient_name
    })

    return { donation, campaignName }
}
