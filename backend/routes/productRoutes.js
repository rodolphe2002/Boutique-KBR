const express = require('express');
const multer = require('multer');
const router = express.Router();
const Product = require('../models/Product');

// Upload config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  const { title, description, sessionId, price } = req.body;
  const image = req.file ? req.file.filename : '';
  try {
    const product = await Product.create({ title, description, sessionId, price, image });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET products, filter by sessionId if present
router.get('/', async (req, res) => {
  const { sessionId } = req.query;
  try {
    const filter = sessionId ? { sessionId } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
