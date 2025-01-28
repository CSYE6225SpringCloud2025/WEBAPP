require('dotenv').config();  // Load environment variables from .env file

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  dialectOptions: {
    timezone: '+00:00',  // Set to Eastern Time
  },
});

sequelize.sync() 
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });


module.exports = sequelize;