const { Sequelize } = require("sequelize");
const myysql = require('mysql');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.SQL_USER,
    process.env.SQL_PASSWORD,
    {
        host: process.env.SQL_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;