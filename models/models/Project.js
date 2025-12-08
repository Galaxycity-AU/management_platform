import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    managerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    progress: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    expenses: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'projects'
});

export default Project;