const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  images: [String],
  variantType: { type: String, enum: ['none', 'tailles', 'pointures'], default: 'none' },
  variants: [String],
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  price: Number,
  clientRequestId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
