const express = require('express');
const app = express();
const healthzRoute = require('./routes/healthz');
const sequelize = require('./config/database');

// Middleware to parse JSON requests
app.use(express.json());

// Use the health check route
app.use(healthzRoute);

// Sync the database and start the server
sequelize.sync()  
  .then(() => {
    app.listen(8080, () => {
      console.log('Server is running on http://localhost:8080');
    });
  })
  .catch((err) => console.error('Error syncing the database:', err));