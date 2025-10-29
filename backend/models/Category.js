const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  slug: { type: String, default: '' },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
