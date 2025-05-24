const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 🔒 Utilise le secret JWT depuis .env
const SECRET = process.env.JWT_SECRET || 'dev_secret_fallback';

// 🔐 Route de connexion admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Nom d'utilisateur incorrect." });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      SECRET,
      { expiresIn: '2h' }
    );

    res.json({ message: "Connexion réussie", token });
  } catch (error) {
    console.error("❌ Erreur dans /login admin :", error);
    res.status(500).json({ message: "Erreur serveur, réessayez plus tard." });
  }
});

module.exports = router;
