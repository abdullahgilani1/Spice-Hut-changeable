const mongoose = require('mongoose');

const orderCounterSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' }, // Single document for global counter
  lastNumber: { type: Number, default: 0 },
}, { timestamps: true });

const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);

module.exports = OrderCounter;
