const Content = require('../models/Content');

// Get the single content document (or null)
const getContent = async (req, res) => {
  try {
    const doc = await Content.findOne();
    if (!doc) return res.json(null);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Upsert content: create if missing or update existing
const upsertContent = async (req, res) => {
  try {
    const payload = req.body || {};
    let doc = await Content.findOne();
    if (!doc) {
      doc = await Content.create(payload);
      return res.status(201).json(doc);
    }
    // merge top-level keys
    doc.about = payload.about || doc.about;
    doc.contact = payload.contact || doc.contact;
    doc.policies = payload.policies || doc.policies;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getContent, upsertContent };
