const Branch = require('../models/Branch');
const { geocodeAddress } = require('../utils/geocode');
const { getOrderModel } = require('../models/Order');

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

    // If coordinates not provided, attempt server-side geocode of the full address
    let lat = (typeof latitude !== 'undefined' && latitude !== null) ? Number(latitude) : null;
    let lng = (typeof longitude !== 'undefined' && longitude !== null) ? Number(longitude) : null;
    if ((lat === null || lng === null) && fullAddress) {
      try {
        const geo = await geocodeAddress(fullAddress);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      } catch (e) {
        // Log and continue without failing creation
        console.warn('[branchController] geocodeAddress failed', e && e.message ? e.message : e);
      }
    }

    const branch = await Branch.create({ name, addressLine, city, province, postalCode, country: country || '', phone: phone || '', latitude: lat, longitude: lng, fullAddress, slug });

    // Ensure a per-location orders collection exists for this branch's city
    try {
      const cityName = branch.city || city;
      if (cityName && cityName.toString().trim() !== '') {
        const OrderModel = getOrderModel(cityName);
        // create collection proactively (no-op if exists)
        if (OrderModel && typeof OrderModel.createCollection === 'function') {
          await OrderModel.createCollection();
          console.log(`[branchController] Created orders collection for city: ${cityName}`);
        }
      }
    } catch (e) {
      console.warn('[branchController] failed to create per-city orders collection', e && e.message ? e.message : e);
    }

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
      const oldCity = branch.city;

    branch.name = payload.name ?? branch.name;
  branch.addressLine = payload.addressLine ?? branch.addressLine;
  branch.city = payload.city ?? branch.city;
  branch.province = payload.province ?? branch.province;
  branch.postalCode = payload.postalCode ?? branch.postalCode;
  branch.country = payload.country ?? branch.country;
  branch.phone = payload.phone ?? branch.phone;
  // If lat/long provided explicitly, use them; otherwise attempt geocode if address changed or coords are missing
  if (typeof payload.latitude !== 'undefined' && typeof payload.longitude !== 'undefined') {
    branch.latitude = payload.latitude;
    branch.longitude = payload.longitude;
  } else {
    const fullAddress = [payload.addressLine ?? branch.addressLine, payload.city ?? branch.city, payload.province ?? branch.province, payload.postalCode ?? branch.postalCode, payload.country ?? branch.country].filter(Boolean).join(', ');
    if ((!branch.latitude || !branch.longitude) && fullAddress) {
      try {
        const geo = await geocodeAddress(fullAddress);
        if (geo) {
          branch.latitude = geo.latitude;
          branch.longitude = geo.longitude;
        }
      } catch (e) {
        console.warn('[branchController] geocodeAddress failed on update', e && e.message ? e.message : e);
      }
    }
  }

    branch.fullAddress = [branch.addressLine, branch.city, branch.province, branch.postalCode, branch.country].filter(Boolean).join(', ');
    branch.slug = (branch.city || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // If city changed, ensure per-city orders collection exists for the new city
    if (payload.city && payload.city !== oldCity) {
      try {
        const newCity = branch.city;
        if (newCity && newCity.toString().trim() !== '') {
          const OrderModel = getOrderModel(newCity);
          if (OrderModel && typeof OrderModel.createCollection === 'function') {
            await OrderModel.createCollection();
            console.log(`[branchController] Created orders collection for new city (update): ${newCity}`);
          }
        }
      } catch (e) {
        console.warn('[branchController] failed to create per-city orders collection on update', e && e.message ? e.message : e);
      }
    }

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
