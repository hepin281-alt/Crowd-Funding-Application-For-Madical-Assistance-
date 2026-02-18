import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const DisbursementRequest = db.define(
  'DisbursementRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: { type: DataTypes.INTEGER, allowNull: false },
    invoice_image_url: { type: DataTypes.TEXT, allowNull: false },
    requested_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    admin_note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'disbursement_requests',
    timestamps: true,
    underscored: true,
  }
)

export default DisbursementRequest
