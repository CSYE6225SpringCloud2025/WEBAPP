const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const moment = require('moment-timezone');
const logger = require('../config/logger');
const StatsD = require('hot-shots');
const statsd = new StatsD({ port: 8125 });
 
// healthz endpoint
router.get('/healthz', async (req, res) => {
  const timer = new Date();
 
  // Check if any request payload exists
  if (req.headers['content-length'] && parseInt(req.headers['content-length'],10) > 0) {
    statsd.increment('healthz.invalid_request.count');
    logger.warn('Invalid healthz request with payload');
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
    statsd.increment('healthz.success.count');
    statsd.timing('healthz.response_time', new Date() - timer);
    logger.info('Health check successful');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(200).send();  
  } catch (err) {
    console.error('Error occured while inserting data during health check:', err);
    statsd.increment('healthz.error.count');
    statsd.timing('healthz.response_time', new Date() - timer);
    logger.error('Error during health check', { error: err });
 
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('X-Content-Type-Options', 'nosniff')
    res.status(503).send();
  }
});
 
router.all('/healthz', (req, res) => {
  statsd.increment('healthz.invalid_method.count');
  logger.warn('Invalid method called on healthz endpoint', { method: req.method });
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  .set('Pragma', 'no-cache')
  .set('X-Content-Type-Options', 'nosniff')
  res.status(405).send();
});
 
module.exports = router;