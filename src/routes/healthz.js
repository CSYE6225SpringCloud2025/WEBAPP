const express = require('express');
const router = express.Router();
const HealthCheck = require('../models');
const moment = require('moment-timezone');

// Health check endpoint to insert a record and check the health of the service
router.get('/healthz', async (req, res) => {
  // Check if there is any payload (i.e., request body)
  if (Object.keys(req.body).length > 0) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(400).send();
  }

  try {
    // Insert a new record into the health check 
    const utcDateTime = new Date().toISOString();

    // Convert UTC time to Eastern Time (or another time zone)
    const easternDateTime = moment(utcDateTime).tz("America/New_York").format();

    // Insert a new record into the health check 
    await HealthCheck.create({ datetime: easternDateTime });

    // Set Cache-Control header to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send();  // Return HTTP 200 OK
  } catch (err) {
    console.error('Error inserting health check:', err);

    // Set Cache-Control header and return HTTP 503 if database is unavailable
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(503).send();  // Return HTTP 503 Service Unavailable
  }
});

// Handle all other HTTP methods for /healthz endpoint
router.all('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(405).send();  // Return HTTP 405 Method Not Allowed
});

module.exports = router;