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
    disbursement_request_id: { type: DataTypes.INTEGER, allowNull: false },
    donation_id: { type: DataTypes.INTEGER, allowNull: false },
    donor_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    utilization_proof: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'receipts',
    timestamps: true,
    underscored: true,
  }
)

export default Receipt
