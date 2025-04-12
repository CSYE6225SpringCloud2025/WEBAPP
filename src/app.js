const express = require('express');
const app = express();
const healthzRoute = require('./routes/healthz');
const filesRoute = require('./routes/files');
// const cicdRoute = require('./routes/cicd');
const sequelize = require('./config/database');
const logger = require('./config/logger');
const StatsD = require('hot-shots');
const statsd = new StatsD({ port: 8125 });

// Middleware to parse JSON requests
app.use(express.json());

// middleware for handling query params
app.use((req, res, next) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0) {
    logger.warn("Request contains query/path parameters");
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
// app.use(cicdRoute);


// Sync the database and start the server
sequelize.sync()  
  .then(() => {
    app.listen(8080, () => {
      logger.info('Server is running on http://localhost:8080');
    });
  })
  .catch((err) => {
    logger.error('Error syncing the database:', err);
    process.exit(1);
  });

// middleware to handle invalid routes
  app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.status = 404;
    next(error);  // Pass error to global error handler
  });

  //middleware to handle invalid request body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error("Invalid JSON in request body");
    return res.status(400).send();
  }
  if (err.message === 'Route not found') {
    logger.warn("Route not found", { path: req.path });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });    
    return res.status(404).send();
  }
  logger.error("Unhandled error", { error: err });
  next(err);
});