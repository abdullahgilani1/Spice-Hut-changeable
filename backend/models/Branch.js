const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: '' },
  phone: { type: String, default: '' },
  // Optional geolocation for the branch (latitude/longitude)
  latitude: { type: Number },
  longitude: { type: Number },
  fullAddress: { type: String, required: true },
  slug: { type: String, default: '' },
}, { timestamps: true });

// Add indexes for frequently queried fields
branchSchema.index({ city: 1 });
branchSchema.index({ slug: 1 });
branchSchema.index({ latitude: 1, longitude: 1 });

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
