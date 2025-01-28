const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define the HealthCheck model with checkId and datetime columns
const HealthCheck = sequelize.define('HealthCheck', {
  checkId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  datetime: {
    type: DataTypes.DATE,
    //defaultValue: Sequelize.NOW, // Default to current UTC time
    defaultValue: () => new Date(),
  }},
  {
    timestamps: false,
  });


module.exports = HealthCheck;
