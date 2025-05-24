const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // 👈 nom d'utilisateur
  password: { type: String, required: true } // mot de passe haché
});

module.exports = mongoose.model('Admin', adminSchema);
