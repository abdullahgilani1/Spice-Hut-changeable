/* Backfill order documents to populate city and postalCode fields from the address string.

Usage (from backend folder):
  node scripts/backfillOrderAddresses.js

Requires: set MONGO_URI in environment or backend/.env (dot env not auto-loaded here).
*/

const connectDB = require('../config/db');
const { getOrderModel } = require('../models/Order');
const mongoose = require('mongoose');

// Branch list must match the one used by orderController
const BRANCHES = [
  'Campbell River',
  'Cannoore',
  'Comox',
  'Cranbrook',
  'Fort Saskatchewan',
  'Invermere',
  'Lady Smith',
  'Lloydminster',
  'Port Alberni',
  'Tofino'
];

const tryParseAddress = (raw) => {
  if (!raw || typeof raw !== 'string') return { address: raw || '', city: '', postalCode: '' };
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const postal = parts[parts.length - 1];
    const cityPart = parts[parts.length - 2];
    const addrPart = parts.slice(0, parts.length - 2).join(', ');
    return { address: addrPart, city: cityPart, postalCode: postal };
  }
  if (parts.length === 2) {
    return { address: parts[0], city: parts[1], postalCode: '' };
  }
  return { address: parts[0] || '', city: '', postalCode: '' };
};

(async () => {
  try {
    await connectDB();

    const models = [getOrderModel(null)];
    for (const b of BRANCHES) models.push(getOrderModel(b));

    for (const m of models) {
      const collectionName = m.collection && m.collection.name ? m.collection.name : '(unknown)';
      console.log(`Processing collection: ${collectionName}`);
      // Find orders missing city/postalCode but having an address
      const docs = await m.find({ address: { $exists: true, $ne: '' }, $or: [{ city: { $exists: false } }, { city: '' }, { city: null }] }).limit(1000).lean();
      console.log(`  Found ${docs.length} documents to examine`);
      if (!docs.length) continue;

      const bulkOps = [];
      for (const d of docs) {
        const parsed = tryParseAddress(d.address || '');
        const update = {};
        if (parsed.city && parsed.city !== '') update.city = parsed.city;
        if (parsed.postalCode && parsed.postalCode !== '') update.postalCode = parsed.postalCode;
        if (Object.keys(update).length) {
          bulkOps.push({ updateOne: { filter: { _id: d._id }, update: { $set: update } } });
        }
      }

      if (bulkOps.length) {
        const res = await m.bulkWrite(bulkOps);
        console.log(`  Applied ${bulkOps.length} updates. Result:`, res && res.modifiedCount ? `modified ${res.modifiedCount}` : res);
      } else {
        console.log('  No updates required for this collection.');
      }
    }

    console.log('Backfill complete.');
  } catch (err) {
    console.error('Backfill failed:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(0);
  }
})();
