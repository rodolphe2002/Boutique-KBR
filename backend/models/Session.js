const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String } // URL of the session image (e.g., Cloudinary)
});

module.exports = mongoose.model('Session', sessionSchema);
