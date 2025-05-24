const jwt = require('jsonwebtoken');
require('dotenv').config(); // S'assure que les variables .env sont bien chargées

const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token manquant ou mal formé." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.admin = decoded; // Injecte les infos du token dans req.admin
    next(); // Autorise l'accès à la route suivante
  } catch (err) {
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};
