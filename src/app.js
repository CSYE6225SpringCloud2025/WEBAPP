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

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error("Invalid Json");
    return res.status(400).send();
  }
  next(err);
});