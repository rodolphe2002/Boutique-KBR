const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // 🔸 Charge les variables d'environnement

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chat');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// 🔸 Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public', 'client')));

// 🔸 Routes API
app.use('/api/sessions', sessionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes); // ✅ Toutes les commandes sont gérées ici

// 🔸 Routes pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'client', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'admin.html'));
});

// 🔸 Connexion MongoDB et lancement du serveur
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connecté');
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT}`);
  });
}).catch(err => {
  console.error('❌ Erreur de connexion MongoDB :', err);
});
