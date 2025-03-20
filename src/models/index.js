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

  // Define the File model
const File = sequelize.define('File', {
  fileId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});


module.exports = { HealthCheck, File };