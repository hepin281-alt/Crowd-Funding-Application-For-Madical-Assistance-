import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const Transaction = db.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    disbursement_request_id: { type: DataTypes.INTEGER, allowNull: false },
    from_account: { type: DataTypes.STRING, allowNull: false },
    to_account: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    transaction_reference: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
  }
)

export default Transaction
