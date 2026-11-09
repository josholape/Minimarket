const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('Cloudinary is not configured. Image uploads will fail until the CLOUDINARY_* values are set in .env.');
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// The file is kept in memory (max 4MB) just long enough to forward it to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));
  },
});

// Wraps Cloudinary's stream upload so we can use await
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'minimarket/products',
        resource_type: 'image',
        // Cloudinary checks the real file contents, not just the type the browser claims
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        // Shrink very large photos so they don't eat storage
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 4MB or smaller' : err.message;
      return res.status(400).json({ success: false, error: message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }
    if (!cloudinaryConfigured) {
      return res.status(500).json({ success: false, error: 'Image storage is not configured on the server' });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer);
      // secure_url is the permanent https address of the image
      res.status(201).json({ success: true, image_url: result.secure_url });
    } catch (uploadError) {
      console.error(uploadError);
      res.status(502).json({ success: false, error: 'Image upload failed. Please try again.' });
    }
  });
});

module.exports = router;