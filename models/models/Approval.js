const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Approval = sequelize.define('Approval', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    approverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    approvalDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'approvals'
});
module.exports = Approval;