const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Textbooks', 'Electronics', 'Dorm Essentials', 'Notes', 'Other'], default: 'Other' },
  tags: [{ type: String, trim: true }],
  imageUrl: { type: String, required: true }, // URL of the uploaded image or remote link
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSold: { type: Boolean, default: false },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldAt: { type: Date, default: null },
  paymentOrderId: { type: String, default: '' },
  paymentId: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
