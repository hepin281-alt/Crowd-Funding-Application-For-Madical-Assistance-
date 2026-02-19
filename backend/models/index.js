import db from '../config/database.js'
import User from './User.js'
import Hospital from './Hospital.js'
import Campaign from './Campaign.js'
import Donation from './Donation.js'
import DisbursementRequest from './DisbursementRequest.js'
import Transaction from './Transaction.js'
import Receipt from './Receipt.js'

// Associations
User.belongsTo(Hospital, { foreignKey: 'hospital_id' })
Hospital.hasMany(User, { foreignKey: 'hospital_id' })

Campaign.belongsTo(User, { foreignKey: 'user_id' })
User.hasMany(Campaign, { foreignKey: 'user_id' })

Campaign.belongsTo(Hospital, { foreignKey: 'hospital_id' })
Hospital.hasMany(Campaign, { foreignKey: 'hospital_id' })

Donation.belongsTo(Campaign, { foreignKey: 'campaign_id' })
Campaign.hasMany(Donation, { foreignKey: 'campaign_id' })

Donation.belongsTo(User, { foreignKey: 'donor_id', as: 'User' })
User.hasMany(Donation, { foreignKey: 'donor_id' })

DisbursementRequest.belongsTo(Campaign, { foreignKey: 'campaign_id' })
Campaign.hasMany(DisbursementRequest, { foreignKey: 'campaign_id' })

Transaction.belongsTo(DisbursementRequest, { foreignKey: 'disbursement_request_id' })
DisbursementRequest.hasMany(Transaction, { foreignKey: 'disbursement_request_id' })

Receipt.belongsTo(Campaign, { foreignKey: 'campaign_id' })
Receipt.belongsTo(Donation, { foreignKey: 'donation_id' })
Receipt.belongsTo(DisbursementRequest, { foreignKey: 'disbursement_request_id' })
Receipt.belongsTo(User, { foreignKey: 'donor_id' })

export { db, User, Hospital, Campaign, Donation, DisbursementRequest, Transaction, Receipt }
