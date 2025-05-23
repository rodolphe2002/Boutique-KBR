const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

router.post('/', async (req, res) => {
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

    const session = await Session.create({ name, slug });
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


module.exports = router;
