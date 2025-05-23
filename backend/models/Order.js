const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: Array, // Liste des produits dans le panier
  total: Number,
  name: String,
  phone: String,
  address: String,
  status: {
    type: String,
    enum: ['En attente', 'Livrée', 'Annulée'],
    default: 'En attente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});






module.exports = mongoose.model('Order', orderSchema);
