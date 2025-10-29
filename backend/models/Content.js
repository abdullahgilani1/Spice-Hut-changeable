const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  about: { type: mongoose.Schema.Types.Mixed, default: {} },
  contact: { type: mongoose.Schema.Types.Mixed, default: {} },
  policies: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);
