const Branch = require('../models/Branch');

// List all branches
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single branch by id
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get branch by city (query param: ?city=CityName)
const getBranchByCity = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ message: 'City query parameter is required' });

    // try exact case-insensitive match on city, then slug fallback
    const byCity = await Branch.findOne({ city: { $regex: `^${city}$`, $options: 'i' } });
    if (byCity) return res.json(byCity);

    // fallback: match slug or partial city name
    const slug = String(city).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const bySlug = await Branch.findOne({ slug });
    if (bySlug) return res.json(bySlug);

    // last resort: partial match
    const partial = await Branch.findOne({ city: { $regex: city, $options: 'i' } });
    if (partial) return res.json(partial);

    return res.status(404).json({ message: 'Branch not found for the given city' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: create a new branch
const createBranch = async (req, res) => {
  try {
    const { name, addressLine, city, province, postalCode, country, phone, latitude, longitude } = req.body;
    if (!name || !addressLine || !city) {
      return res.status(400).json({ message: 'Name, addressLine and city are required' });
    }
    const fullAddress = [addressLine, city, province, postalCode, country].filter(Boolean).join(', ');
    const slug = `${city}`.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const branch = await Branch.create({ name, addressLine, city, province, postalCode, country: country || 'Canada', phone: phone || '', latitude: latitude || null, longitude: longitude || null, fullAddress, slug });
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: update branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

  branch.name = payload.name ?? branch.name;
  branch.addressLine = payload.addressLine ?? branch.addressLine;
  branch.city = payload.city ?? branch.city;
  branch.province = payload.province ?? branch.province;
  branch.postalCode = payload.postalCode ?? branch.postalCode;
  branch.country = payload.country ?? branch.country;
  branch.phone = payload.phone ?? branch.phone;
  branch.latitude = typeof payload.latitude !== 'undefined' ? payload.latitude : branch.latitude;
  branch.longitude = typeof payload.longitude !== 'undefined' ? payload.longitude : branch.longitude;

    branch.fullAddress = [branch.addressLine, branch.city, branch.province, branch.postalCode, branch.country].filter(Boolean).join(', ');
    branch.slug = (branch.city || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await branch.save();
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: delete branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    await branch.deleteOne();
    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getBranches, getBranchById, getBranchByCity, createBranch, updateBranch, deleteBranch };
