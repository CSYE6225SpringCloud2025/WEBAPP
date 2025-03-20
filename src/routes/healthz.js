const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const moment = require('moment-timezone');
 
// healthz endpoint
router.get('/healthz', async (req, res) => {

  // Check if any request payload exists
  if (req.headers['content-length'] && parseInt(req.headers['content-length'],10) > 0) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    return res.status(400).send();
  }
 
  try {
    const utcDateTime = new Date().toISOString();
 
    const easternDateTime = moment(utcDateTime).tz("America/New_York").format();
 
    // Insert a new record in the HealthCheck Table
    await HealthCheck.create({ datetime: easternDateTime });
    console.log("Healthz api processed successfully")
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(200).send();  
  } catch (err) {
    console.error('Error occured while inserting data during health check:', err);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(503).send();
  }
});
 
router.all('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  .set('Pragma', 'no-cache')
  .set('X-Content-Type-Options', 'nosniff')
  res.status(405).send();
});
 
module.exports = router;