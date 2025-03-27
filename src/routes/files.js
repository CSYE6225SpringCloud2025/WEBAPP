const express = require('express');
const router = express.Router();
const { File } = require('../models');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const StatsD = require('hot-shots');
const statsd = new StatsD({ port: 8125 });

// Initialize S3 client
const s3 = new AWS.S3();

// S3 operation timing
s3.on('httpRequest', (req) => {
  const startTime = Date.now();
  req.on('complete', () => {
    statsd.timing('s3.operation.time', Date.now() - startTime);
  });
});

// Define method handlers for /v1/file - order matters!
router.head('/v1/file', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('HEAD method not allowed on /v1/file');
  res.status(405).send();
});

router.get('/v1/file', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('GET method not allowed on /v1/file');
  res.status(405).send();
});

router.put('/v1/file', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('PUT method not allowed on /v1/file');
  res.status(405).send();
});

router.patch('/v1/file', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('PATCH method not allowed on /v1/file');
  res.status(405).send();
});

router.delete('/v1/file', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('DELETE method not allowed on /v1/file');
  res.status(405).send();
});

// Upload file - only POST is allowed
router.post('/v1/file', upload.single('file'), async (req, res, next) => {
  const timer = new Date();
  try {
    const file = req.file;
    if (!file) {
      statsd.increment('file.upload.invalid_request.count');
      logger.warn('No file provided in upload request');
      return res.status(400).send();
    }

    const fileId = uuidv4();
    const filePath = `files/${fileId}-${file.originalname}`;

    // Upload file to S3
    await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();

    // Save file metadata to database
    const fileMetadata = await File.create({
      fileId,
      fileName: file.originalname,
      filePath,
    });

    statsd.increment('file.upload.success.count');
    statsd.timing('file.upload.response_time', new Date() - timer);

    const response = {
      file_name: file.originalname,
      id: fileId,
      url: `${process.env.S3_BUCKET_NAME}/${filePath}`,
      upload_date: new Date().toISOString().split('T')[0],
    };

    logger.info('File uploaded successfully', { fileId });
    res.status(201).json(response);
  } catch (err) {
    statsd.increment('file.upload.error.count');
    statsd.timing('file.upload.response_time', new Date() - timer);
    logger.error('Error uploading file', { error: err });
    res.status(400).send();
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    statsd.increment('file.upload.error.count');
    logger.error('Multer error during file upload', { error: err });
    return res.status(400).send();
  }
  next(err);
});

// Define method handlers for /v1/file/:fileId - order matters!
router.head('/v1/file/:fileId', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('HEAD method not allowed on /v1/file/:fileId');
  res.status(405).send();
});

router.put('/v1/file/:fileId', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('PUT method not allowed on /v1/file/:fileId');
  res.status(405).send();
});

router.patch('/v1/file/:fileId', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('PATCH method not allowed on /v1/file/:fileId');
  res.status(405).send();
});

router.post('/v1/file/:fileId', (req, res) => {
  statsd.increment('file.method_not_allowed.count');
  logger.warn('POST method not allowed on /v1/file/:fileId');
  res.status(405).send();
});

// Get file metadata - GET is allowed
router.get('/v1/file/:fileId', async (req, res) => {
  const timer = new Date();
  try {
    const fileId = req.params.fileId;
    const fileMetadata = await File.findOne({ where: { fileId } });

    if (!fileMetadata) {
      statsd.increment('file.get.not_found.count');
      statsd.timing('file.get.response_time', new Date() - timer);
      logger.warn('File not found', { fileId });
      return res.status(404).send();
    }

    const response = {
      file_name: fileMetadata.fileName,
      id: fileMetadata.fileId,
      url: `${process.env.S3_BUCKET_NAME}/${fileMetadata.filePath}`,
      upload_date: new Date(fileMetadata.createdAt).toISOString().split('T')[0],
    };

    statsd.increment('file.get.success.count');
    statsd.timing('file.get.response_time', new Date() - timer);
    logger.info('File metadata retrieved', { fileId });
    res.status(200).json(response);
  } catch (err) {
    statsd.increment('file.get.error.count');
    statsd.timing('file.get.response_time', new Date() - timer);
    logger.error('Error retrieving file metadata', { error: err });
    res.status(404).send();
  }
});

// Delete file - DELETE is allowed
router.delete('/v1/file/:fileId', async (req, res) => {
  const timer = new Date();
  try {
    const fileId = req.params.fileId;
    const fileMetadata = await File.findOne({ where: { fileId } });

    if (!fileMetadata) {
      statsd.increment('file.delete.not_found.count');
      statsd.timing('file.delete.response_time', new Date() - timer);
      logger.warn('File not found for deletion', { fileId });
      return res.status(404).send();
    }

    // Delete file from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileMetadata.filePath,
      }).promise();
    } catch (s3Error) {
      statsd.increment('file.delete.s3_error.count');
      logger.error('Error deleting from S3', { error: s3Error, fileId });
    }

    // Delete file metadata from database
    await fileMetadata.destroy();

    statsd.increment('file.delete.success.count');
    statsd.timing('file.delete.response_time', new Date() - timer);
    logger.info('File deleted successfully', { fileId });
    res.status(204).send();
  } catch (err) {
    statsd.increment('file.delete.error.count');
    statsd.timing('file.delete.response_time', new Date() - timer);
    logger.error('Error deleting file', { error: err, fileId: req.params.fileId });
    if (err.name === 'SequelizeConnectionError') {
      return res.status(500).send();
    }
    res.status(404).send();
  }
});

module.exports = router;