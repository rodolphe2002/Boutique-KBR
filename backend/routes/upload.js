const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // le dossier dans ton Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Route POST pour l'upload
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
  res.status(200).json({ url: req.file.path });
});

module.exports = router;
