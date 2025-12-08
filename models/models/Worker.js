const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Worker = sequelize.define('Worker', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    position: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'workers'
});
module.exports = Worker;