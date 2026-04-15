const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Textbooks', 'Electronics', 'Dorm Essentials', 'Notes', 'Other'], default: 'Other' },
  imageUrl: { type: String, required: true }, // URL of the uploaded image or remote link
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
