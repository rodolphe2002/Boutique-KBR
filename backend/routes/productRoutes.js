const express = require('express');
const multer = require('multer');
const router = express.Router();
const Product = require('../models/Product');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Assure-toi que ce fichier est bien configuré

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products', // Nom du dossier dans Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }] // Optionnel : redimensionnement
  }
});

const upload = multer({ storage });

// Créer un produit avec image uploadée sur Cloudinary
router.post('/', upload.single('image'), async (req, res) => {
  const { title, description, sessionId, price } = req.body;
  const image = req.file ? req.file.path : ''; // URL Cloudinary
  try {
    const product = await Product.create({ title, description, sessionId, price, image });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer tous les produits (option de filtrage par sessionId)
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
