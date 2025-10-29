const mongoose = require('mongoose');

/**
 * Order schema and dynamic model factory
 * This file exports a getOrderModel(location) function which returns a Mongoose model
 * backed by a collection name derived from the provided location. If location is
 * falsy the default collection name "orders" is used (keeps backwards compatibility).
 */

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  pointsUsed: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Processing', 'Delivered', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String },
  address: { type: String },
  // optional parsed fields extracted from address string
  city: { type: String, default: '' },
  postalCode: { type: String, default: '' },
}, { timestamps: true });

// Cache created models in mongoose.models (Mongoose handles this) so repeated calls
// to getOrderModel for the same location reuse the compiled model.
const normalizeLocation = (loc) => {
  if (!loc) return '';
  // remove non-alphanum and capitalize words (e.g., 'Cambell River' -> 'CambellRiver')
  return loc.toString().trim().replace(/[^a-zA-Z0-9]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};

/**
 * Get or create an Order model for a given location.
 * @param {string} location - branch location (e.g. 'Cambell River'). If falsy returns default model.
 * @returns {mongoose.Model}
 */
function getOrderModel(location) {
  const norm = normalizeLocation(location);
  const modelName = norm ? `Order${norm}` : 'Order';
  const collectionName = norm ? `orders${norm}` : 'orders';

  // reuse if already compiled
  if (mongoose.models[modelName]) return mongoose.models[modelName];

  return mongoose.model(modelName, orderSchema, collectionName);
}

// Export the factory and also the default model for backwards compatibility
module.exports = { getOrderModel, DefaultOrder: getOrderModel(null), orderSchema };
