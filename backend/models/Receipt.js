import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const Receipt = db.define(
  'Receipt',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: { type: DataTypes.INTEGER, allowNull: false },
    // A receipt is created at donation time; disbursement may happen later.
    disbursement_request_id: { type: DataTypes.INTEGER, allowNull: true },
    donation_id: { type: DataTypes.INTEGER, allowNull: false },
    donor_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    utilization_proof: { type: DataTypes.TEXT, allowNull: true },
    receipt_number: { type: DataTypes.STRING, unique: true, allowNull: true },
    receipt_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    tax_80g_eligible: { type: DataTypes.BOOLEAN, defaultValue: true },
    pan_number: { type: DataTypes.STRING, allowNull: true },
    donor_name: { type: DataTypes.STRING, allowNull: true },
    donor_email: { type: DataTypes.STRING, allowNull: true },
    donor_phone: { type: DataTypes.STRING, allowNull: true },
    organization_name: { type: DataTypes.STRING, defaultValue: 'CareFund Medical Assistance' },
    certificate_issued: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'receipts',
    timestamps: true,
    underscored: true,
  }
)

export default Receipt
