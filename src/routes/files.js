const express = require('express');
const router = express.Router();
const { File } = require('../models');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3 = new AWS.S3();

// Define method handlers for /v1/file - order matters!
router.head('/v1/file', (req, res) => {
  res.status(405).send(); // Method Not Allowed for HEAD
});

router.get('/v1/file', (req, res) => {
  res.status(405).send(); // Method Not Allowed for GET
});

router.put('/v1/file', (req, res) => {
  res.status(405).send(); // Method Not Allowed for PUT
});

router.patch('/v1/file', (req, res) => {
  res.status(405).send(); // Method Not Allowed for PATCH
});

router.delete('/v1/file', (req, res) => {
  res.status(405).send(); // Method Not Allowed for DELETE
});

// Upload file - only POST is allowed
router.post('/v1/file', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
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

    // Construct the response object
    const response = {
      file_name: file.originalname, // File name
      id: fileId, // File ID
      url: `${process.env.S3_BUCKET_NAME}/${filePath}`, // Full URL to the file
      upload_date: new Date().toISOString().split('T')[0], // Upload date in YYYY-MM-DD format
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(400).send();
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send();
  }
  next(err); // Pass non-Multer errors to the next handler
});

// Define method handlers for /v1/file/:fileId - order matters!
router.head('/v1/file/:fileId', (req, res) => {
  res.status(405).send(); // Method Not Allowed for HEAD
});

router.put('/v1/file/:fileId', (req, res) => {
  res.status(405).send(); // Method Not Allowed for PUT
});

router.patch('/v1/file/:fileId', (req, res) => {
  res.status(405).send(); // Method Not Allowed for PATCH
});

router.post('/v1/file/:fileId', (req, res) => {
  res.status(405).send(); // Method Not Allowed for POST
});

// Get file metadata - GET is allowed
router.get('/v1/file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileMetadata = await File.findOne({ where: { fileId } });

    if (!fileMetadata) {
      return res.status(404).send();
    }

    // Construct the response object
    const response = {
      file_name: fileMetadata.fileName, // File name
      id: fileMetadata.fileId, // File ID
      url: `${process.env.S3_BUCKET_NAME}/${fileMetadata.filePath}`, // Full URL to the file
      upload_date: new Date(fileMetadata.createdAt).toISOString().split('T')[0], // Upload date in YYYY-MM-DD format
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error retrieving file metadata:', err);
    res.status(404).send();
  }
});

// Delete file - DELETE is allowed
router.delete('/v1/file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileMetadata = await File.findOne({ where: { fileId } });

    if (!fileMetadata) {
      return res.status(404).send();
    }

    // Delete file from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileMetadata.filePath,
      }).promise();
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete file metadata from database
    await fileMetadata.destroy();

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting file:', err);
    if (err.name === 'SequelizeConnectionError') {
      return res.status(500).send();
    }
    res.status(404).send();
  }
});

module.exports = router;