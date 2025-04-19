const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const moment = require('moment-timezone');
const logger = require('../config/logger');
const StatsD = require('hot-shots');
const statsd = new StatsD({ port: 8125 });
 
// cicd endpoint - similar to healthz but with a different path
router.get('/cicd', async (req, res) => {
  const timer = new Date();
 
  // Check if any request payload exists
  if (req.headers['content-length'] && parseInt(req.headers['content-length'],10) > 0) {
    statsd.increment('cicd.invalid_request.count');
    logger.warn('Invalid cicd request with payload');
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
    console.log("CICD api processed successfully")
    statsd.increment('cicd.success.count');
    statsd.timing('cicd.response_time', new Date() - timer);
    logger.info('CICD check successful');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(200).send();  
  } catch (err) {
    console.error('Error occured while inserting data during cicd check:', err);
    statsd.increment('cicd.error.count');
    statsd.timing('cicd.response_time', new Date() - timer);
    logger.error('Error during cicd check', { error: err });
 
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(503).send();
  }
});
 
router.all('/cicd', (req, res) => {
  statsd.increment('cicd.invalid_method.count');
  logger.warn('Invalid method called on cicd endpoint', { method: req.method });
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  .set('Pragma', 'no-cache')
  .set('X-Content-Type-Options', 'nosniff')
  res.status(405).send();
});
 
module.exports = router;