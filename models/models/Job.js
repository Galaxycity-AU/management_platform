import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    workerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jobDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    clockedInTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    clockedOutTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    editedInTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    editedOutTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'jobs'
});

export default Job;