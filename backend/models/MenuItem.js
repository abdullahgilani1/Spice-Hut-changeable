const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Out of Stock'], default: 'Available' },
  image: { type: String, default: '' },
  subCategory: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
