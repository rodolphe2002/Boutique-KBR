const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const router = express.Router();
const Session = require('../models/Session');

// Configure Cloudinary storage for session images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sessions',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le champ name est requis' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    // Vérifie si le slug existe déjà
    const existingSession = await Session.findOne({ slug });
    if (existingSession) {
      return res.status(409).json({ error: 'Cette session existe déjà' });
    }

    const image = req.file ? req.file.path : undefined; // Cloudinary URL if provided
    const session = await Session.create({ name, slug, image });
    res.status(201).json(session);
  } catch (err) {
    console.error('Erreur création session:', err);
    res.status(500).json({ error: err.message });
  }
});



router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Supprimer une session

router.delete('/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔄 Modifier une session
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nom requis" });

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      { name, slug },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
