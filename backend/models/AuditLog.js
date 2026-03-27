import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const AuditLog = db.define(
    'AuditLog',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        target_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'audit_logs',
        timestamps: true,
        underscored: true,
    }
)

export default AuditLog
