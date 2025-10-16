const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Chargement des variables d'environnement

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chat');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/auth');
const uploadRoute = require('./routes/upload');

// Import du modèle Admin
const Admin = require('./models/Admin');

const app = express();

// ===== Middlewares =====
app.use(cors());
app.use(express.json()); // Remplace body-parser.json()
app.use(express.urlencoded({ extended: true }));

// Dossiers statiques
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public', 'client')));

// ===== Routes API =====
app.use('/api/sessions', sessionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoute);



// ===== Connexion MongoDB & lancement serveur =====
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connecté');

    // Création admin par défaut si inexistant
    const { USER_NAME, PASSWORD, PORT } = process.env;

    if (!USER_NAME || !PASSWORD) {
      console.warn("⚠️ USER_NAME ou PASSWORD manquant dans le fichier .env");
    } else {
      const existingAdmin = await Admin.findOne({ username: USER_NAME });
      if (existingAdmin) {
        console.log("ℹ️ Admin déjà existant");
      } else {
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        await Admin.create({ username: USER_NAME, password: hashedPassword });
        console.log(`✅ Admin '${USER_NAME}' créé avec succès`);
      }
    }

    // Lancement du serveur
    const port = PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
    });

  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  }
})();
