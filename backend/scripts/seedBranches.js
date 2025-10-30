/*
  Seed script to create/update branch documents in MongoDB.
  Usage (from repository root):
    node backend/scripts/seedBranches.js

  Make sure backend/.env contains MONGO_URI or set MONGO_URI in the environment.
*/
const connectDB = require('../config/db');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');

const branches = [
  {
    name: 'Campbell River',
    addressLine: '510 – 1400 Dogwood Street',
    city: 'Campbell River',
    province: 'British Columbia',
    postalCode: 'V9W 3A6',
    country: 'Canada',
    phone: '778-346-2222',
  },
  {
    name: 'Canmore',
    addressLine: '1310 Bow Valley Trail',
    city: 'Canmore',
    province: 'Alberta',
    postalCode: 'T1W 1N6',
    country: 'Canada',
    phone: '403-609-9997',
  },
  {
    name: 'Comox',
    addressLine: '1832 Comox Avenue',
    city: 'Comox',
    province: 'British Columbia',
    postalCode: 'V9M 3M7',
    country: 'Canada',
    phone: '250-941-7444',
  },
  {
    name: 'Cranbrook',
    addressLine: '380 – 1311 2nd Street North',
    city: 'Cranbrook',
    province: 'British Columbia',
    postalCode: 'V1C 3L1',
    country: 'Canada',
    phone: '250-489-5555',
  },
  {
    name: 'Fort Saskatchewan',
    addressLine: '9907 103 Street',
    city: 'Fort Saskatchewan',
    province: 'Alberta',
    postalCode: '',
    country: 'Canada',
    phone: '780-589-4555',
  },
  {
    name: 'Invermere',
    addressLine: '1321 7th Ave',
    city: 'Invermere',
    province: 'British Columbia',
    postalCode: 'V0A 1K0',
    country: 'Canada',
    phone: '778-526-5333',
  },
  {
    name: 'Ladysmith',
    addressLine: '510 Esplanade Avenue',
    city: 'Ladysmith',
    province: 'British Columbia',
    postalCode: 'V9G 1A1',
    country: 'Canada',
    phone: '250-924-8222',
  },
  {
    name: 'Lloydminster',
    addressLine: '4820 – 50th Avenue',
    city: 'Lloydminster',
    province: 'Alberta',
    postalCode: 'T9V 0W5',
    country: 'Canada',
    phone: '780-875-4111',
  },
  {
    name: 'Port Alberni',
    addressLine: '5328 Argyle St',
    city: 'Port Alberni',
    province: 'British Columbia',
    postalCode: 'V9Y 1T8',
    country: 'Canada',
    phone: '',
  },
  {
    name: 'Tofino',
    addressLine: '421 Main St Unit 5',
    city: 'Tofino',
    province: 'British Columbia',
    postalCode: 'V0R 2Z0',
    country: 'Canada',
    phone: '',
  },
];

function buildFullAddress(b) {
  const parts = [b.addressLine, b.city, b.province, b.postalCode, b.country].filter(Boolean);
  return parts.join(', ');
}

(async () => {
  try {
    await connectDB();
    console.log('Connected to DB — seeding branches...');

    for (const b of branches) {
      const fullAddress = buildFullAddress(b);
      const slug = `${b.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const upsert = {
        name: b.name,
        addressLine: b.addressLine,
        city: b.city,
        province: b.province || '',
        postalCode: b.postalCode || '',
        country: b.country || 'Canada',
        phone: b.phone || '',
        fullAddress,
        slug,
      };

      const existing = await Branch.findOne({ $or: [ { phone: upsert.phone }, { fullAddress: upsert.fullAddress } ] });
      if (existing) {
        await Branch.findByIdAndUpdate(existing._id, upsert);
        console.log(`Updated: ${b.name} — ${fullAddress}`);
      } else {
        await Branch.create(upsert);
        console.log(`Inserted: ${b.name} — ${fullAddress}`);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(0);
  }
})();
