const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const healthzRoute = require('../routes/healthz');
const { HealthCheck } = require('../models');
 
// Mock console methods
console.error = jest.fn();
console.log = jest.fn();
 
describe('Health Check API', () => {
  let app;
  let sequelize;
 
  beforeAll(async () => {
    // Setup test database
    // sequelize = new Sequelize('sqlite::memory:', { logging: false });
    sequelize= require('../config/database');
    await sequelize.sync();
 
    // Setup Express app
    app = express();
    app.use(express.json());
   
    // Middleware to check query/path parameters
    app.use((req, res, next) => {
      if (Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0) {
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.status(400).send();
      }
      next();
    });
 
    app.use(healthzRoute);
 
    // Add error handling middleware
    app.use((req, res, next) => {
      const error = new Error('Route not found');
      error.status = 404;
      next(error);
    });
 
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid Json');
        return res.status(400).send();
      }
      if (err.message === 'Route not found') {
        console.error('Route not found');
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.status(404).send();
      }
      next(err);
    });
  });
 
  afterAll(async () => {
    await sequelize.close();
  });
 
  describe('GET /healthz', () => {
    it('should return 200 for successful health check', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);
   
      // Verify headers
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
   
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('Healthz api processed successfully');
   
      // Check if a record was inserted into the database
      const healthCheckRecord = await HealthCheck.findOne();
      expect(healthCheckRecord).not.toBeNull(); // Ensure the record exists
    });
 
    it('should return 400 when request contains a body', async () => {
      const response = await request(app)
        .get('/healthz')
        .send({ test: "invalid" })  // Sending a request body
        .expect(400);
   
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
 
    it('should return 400 when request contains query parameters', async () => {
      const response = await request(app)
        .get('/healthz?test=1')
        .expect(400);
 
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
 
    it('should return 503 when database operation fails', async () => {
      jest.spyOn(HealthCheck, 'create').mockRejectedValueOnce(new Error('Database error'));
 
      const response = await request(app)
        .get('/healthz')
        .expect(503);
 
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
     
      expect(console.error).toHaveBeenCalledWith(
        'Error occured while inserting data during health check:',
        expect.any(Error)
      );
    });
  });
 
  describe('Other HTTP methods for /healthz', () => {
    const methods = ['post', 'put', 'delete', 'patch'];
 
    methods.forEach((method) => {
      it('should return 405 for ${method.toUpperCase()} request', async () => {
        const response = await request(app)[method]('/healthz').expect(405);
 
        expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(response.headers['pragma']).toBe('no-cache');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
      });
    });
  });
 
  describe('Invalid routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect(404);
 
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
     
      expect(console.error).toHaveBeenCalledWith('Route not found');
    });
 
    it('should return 400 for invalid JSON', async () => {
      const response = await request(app)
        .post('/healthz')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);
 
      expect(console.error).toHaveBeenCalledWith('Invalid Json');
    });
  });
});