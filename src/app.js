const express = require('express');
const app = express();
const healthzRoute = require('./routes/healthz');
const filesRoute = require('./routes/files');
const sequelize = require('./config/database');

// Middleware to parse JSON requests
app.use(express.json());

// middleware for handling query params
app.use((req, res, next) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0) {
    console.error("Request contains query/path parameters");
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    })
    return res.status(400).send();
  }
  next();
});

// Use the health and file routes
app.use(filesRoute);
app.use(healthzRoute);


// Sync the database and start the server
sequelize.sync()  
  .then(() => {
    app.listen(8080, () => {
      console.log('Server is running on http://localhost:8080');
    });
  })
  .catch((err) => console.error('Error syncing the database:', err));

// middleware to handle invalid routes
  app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.status = 404;
    next(error);  // Pass error to global error handler
  });

  //middleware to handle invalid request body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error("Invalid Json");
    return res.status(400).send();
  }
  if (err.message === 'Route not found') {
    console.error("Route not found");
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });    
    return res.status(404).send();
  }
  next(err);
});