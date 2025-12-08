import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

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

export default Approval;