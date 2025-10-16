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

// Créer un produit avec image principale + galerie + variantes
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  async (req, res) => {
    const { title, description, sessionId, price, variantType, clientRequestId } = req.body;
    let variants = [];
    try {
      variants = JSON.parse(req.body.variants || '[]');
    } catch (_) {
      variants = [];
    }

    const primaryFile = req.files && req.files.image && req.files.image[0];
    const galleryFiles = (req.files && req.files.images) ? req.files.images : [];

    const image = primaryFile ? primaryFile.path : '';
    const images = galleryFiles.map((f) => f.path);

    try {
      // Idempotency: if a product with this clientRequestId already exists, return it
      if (clientRequestId) {
        const existing = await Product.findOne({ clientRequestId });
        if (existing) {
          return res.status(200).json(existing);
        }
      }

      // Optional soft-dup guard: same title+session within last 60s
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentDup = await Product.findOne({ title, sessionId, createdAt: { $gte: oneMinuteAgo } });
      if (recentDup && clientRequestId) {
        return res.status(200).json(recentDup);
      }

      const product = await Product.create({
        title,
        description,
        sessionId,
        price,
        image,
        images,
        variantType: variantType || 'none',
        variants,
        clientRequestId: clientRequestId || undefined,
      });
      res.status(201).json(product);
    } catch (err) {
      // Handle duplicate key error on clientRequestId
      if (err && err.code === 11000 && clientRequestId) {
        const existing = await Product.findOne({ clientRequestId });
        if (existing) return res.status(200).json(existing);
      }
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/products?sessionId=abc123
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

// GET /api/products/:id - single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Supprimer un produit


router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔄 Modifier un produit (titre, prix uniquement ici)
router.put('/:id', async (req, res) => {
  try {
    const { title, price } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { title, price },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
