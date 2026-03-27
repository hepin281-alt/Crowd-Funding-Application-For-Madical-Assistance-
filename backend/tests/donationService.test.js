import test from 'node:test'
import assert from 'node:assert/strict'
import { createDonationWithLock } from '../services/donationService.js'

function buildMockContext({
    campaign = {
        id: 1,
        patient_name: 'Test Patient',
        status: 'active',
        raised_amount: 900,
        target_amount: 1000,
    },
    failOnReceipt = false,
} = {}) {
    let state = {
        campaigns: { [campaign.id]: { ...campaign } },
        donations: [],
        receipts: [],
        nextDonationId: 1,
    }

    const storeFor = (options) => (options?.transaction ? options.transaction.__staged : state)

    const db = {
        async transaction(callback) {
            const staged = structuredClone(state)
            const tx = {
                LOCK: { UPDATE: 'UPDATE' },
                __staged: staged,
            }
            try {
                const result = await callback(tx)
                state = staged
                return result
            } catch (err) {
                throw err
            }
        },
    }

    const Campaign = {
        async findByPk(id, options = {}) {
            const store = storeFor(options)
            const raw = store.campaigns[id]
            if (!raw) return null
            return {
                ...raw,
                async update(values, updateOptions = {}) {
                    const updateStore = storeFor(updateOptions)
                    Object.assign(updateStore.campaigns[id], values)
                },
            }
        },
    }

    const Donation = {
        async create(values, options = {}) {
            const store = storeFor(options)
            const row = { id: store.nextDonationId++, ...values }
            store.donations.push(row)
            return row
        },
    }

    const Receipt = {
        async create(values, options = {}) {
            if (failOnReceipt) throw new Error('Receipt create failed')
            const store = storeFor(options)
            const row = { id: store.receipts.length + 1, ...values }
            store.receipts.push(row)
            return row
        },
    }

    const snapshot = () => structuredClone(state)

    return { db, Campaign, Donation, Receipt, snapshot }
}

test('rejects donation amount above remaining funds', async () => {
    const deps = buildMockContext({
        campaign: {
            id: 1,
            patient_name: 'Test Patient',
            status: 'active',
            raised_amount: 900,
            target_amount: 1000,
        },
    })

    await assert.rejects(
        () =>
            createDonationWithLock(deps, {
                campaignId: 1,
                requestedAmount: 200,
                user: { id: 10, name: 'Donor', email: 'donor@test.com' },
                skipCampaignVerification: false,
            }),
        (err) => {
            assert.equal(err.statusCode, 400)
            assert.match(err.message, /You can donate up to/i)
            return true
        }
    )

    const current = deps.snapshot()
    assert.equal(current.donations.length, 0)
    assert.equal(current.receipts.length, 0)
    assert.equal(current.campaigns[1].raised_amount, 900)
})

test('rolls back all writes when receipt creation fails inside transaction', async () => {
    const deps = buildMockContext({
        campaign: {
            id: 1,
            patient_name: 'Test Patient',
            status: 'active',
            raised_amount: 100,
            target_amount: 1000,
        },
        failOnReceipt: true,
    })

    await assert.rejects(
        () =>
            createDonationWithLock(deps, {
                campaignId: 1,
                requestedAmount: 100,
                user: { id: 20, name: 'Donor', email: 'donor@test.com' },
                skipCampaignVerification: false,
            }),
        /Receipt create failed/
    )

    const current = deps.snapshot()
    assert.equal(current.donations.length, 0)
    assert.equal(current.receipts.length, 0)
    assert.equal(current.campaigns[1].raised_amount, 100)
})

test('commits donation and campaign update on successful transaction', async () => {
    const deps = buildMockContext({
        campaign: {
            id: 1,
            patient_name: 'Test Patient',
            status: 'active',
            raised_amount: 300,
            target_amount: 1000,
        },
    })

    const result = await createDonationWithLock(deps, {
        campaignId: 1,
        requestedAmount: 200,
        user: { id: 30, name: 'Donor', email: 'donor@test.com' },
        skipCampaignVerification: false,
    })

    assert.equal(result.campaignName, 'Test Patient')
    assert.equal(result.donation.amount, 200)

    const current = deps.snapshot()
    assert.equal(current.donations.length, 1)
    assert.equal(current.receipts.length, 1)
    assert.equal(current.campaigns[1].raised_amount, 500)
})
