import { DataTypes } from 'sequelize'
import db from '../config/database.js'
import bcrypt from 'bcryptjs'

const User = db.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('employee', 'donor', 'campaigner', 'hospital_admin'),
      allowNull: false,
    },
    hospital_id: { type: DataTypes.INTEGER, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
    verification_code: { type: DataTypes.STRING, allowNull: true },
    verification_code_expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12)
        }
      },
    },
  }
)

User.prototype.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password
  return values
}

export default User
