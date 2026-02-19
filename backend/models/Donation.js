import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const Donation = db.define(
  'Donation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: { type: DataTypes.INTEGER, allowNull: false },
    donor_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  },
  {
    tableName: 'donations',
    timestamps: true,
    underscored: true,
  }
)

export default Donation
