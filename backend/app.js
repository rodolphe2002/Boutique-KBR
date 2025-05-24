const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Chargement des variables d'environnement

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chat');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/auth');

// Import du modèle Admin
const Admin = require('./models/Admin');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public', 'client')));

// Routes API
app.use('/api/sessions', sessionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Routes HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'client', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'admin.html'));
});

// Connexion MongoDB et lancement du serveur
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');

    // Création automatique de l'admin s'il n'existe pas
    const username = process.env.USER_NAME;
    const plainPassword = process.env.PASSWORD;

    if (!username || !plainPassword) {
      console.warn("⚠️ USER_NAME ou PASSWORD manquant dans le fichier .env");
    } else {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        console.log("⚠️ Admin déjà existant !");
      } else {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await Admin.create({ username, password: hashedPassword });
        console.log(`✅ Admin '${username}' créé avec succès !`);
      }
    }

    // Lancement du serveur
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT}`);
    });

  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB :', err);
  });
