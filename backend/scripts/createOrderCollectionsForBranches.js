#!/usr/bin/env node
/**
 * One-time migration: create per-city orders collections for all branches
 * Usage: node backend/scripts/createOrderCollectionsForBranches.js
 * Ensure MONGO_URI is present in the project's root .env
 */
const path = require('path');
// Load env from repo root (same as server)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Branch = require('../models/Branch');
const { getOrderModel } = require('../models/Order');

(async () => {
  try {
    await connectDB();
    console.log('[migration] Connected to DB');

    const cities = await Branch.distinct('city');
    if (!Array.isArray(cities) || cities.length === 0) {
      console.log('[migration] No branch cities found. Exiting.');
      process.exit(0);
    }

    for (const c of cities) {
      try {
        if (!c || !c.toString().trim()) continue;
        const cityName = c.toString().trim();
        const OrderModel = getOrderModel(cityName);
        if (!OrderModel) {
          console.warn(`[migration] getOrderModel returned falsy for city: ${cityName}`);
          continue;
        }
        // createCollection is idempotent for our purposes; wrap in try/catch
        if (typeof OrderModel.createCollection === 'function') {
          await OrderModel.createCollection();
          console.log(`[migration] Created/verified orders collection for city: ${cityName}`);
        } else {
          console.warn(`[migration] Model for ${cityName} has no createCollection method`);
        }
      } catch (e) {
        console.warn(`[migration] Failed to create orders collection for city: ${c}`, e && e.message ? e.message : e);
      }
    }

    console.log('[migration] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[migration] Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
