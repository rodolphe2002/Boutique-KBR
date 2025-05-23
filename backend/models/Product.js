const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  price: Number
});

module.exports = mongoose.model('Product', productSchema);
