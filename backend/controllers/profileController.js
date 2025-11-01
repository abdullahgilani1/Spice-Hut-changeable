const User = require('../models/User');

// Get current user's profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update current user's profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
      // Allow phone update
      user.phone = req.body.phone || user.phone;
    // Allow storing current location coordinates (from Profile -> Current Location)
    if (req.body.currentLocation && typeof req.body.currentLocation === 'object') {
      const lat = Number(req.body.currentLocation.latitude);
      const lng = Number(req.body.currentLocation.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        user.currentLocation = { latitude: lat, longitude: lng, updatedAt: new Date() };
      }
    }
    if (req.body.password) {
      user.password = req.body.password;
    }
    await user.save();
      res.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user addresses
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    // Debug: log incoming payload to verify frontend is sending city/postalCode
    console.debug('[profileController] addAddress payload:', req.body);
  const { label, address, addressLine1, city, province, postalCode, country, isDefault, latitude, longitude } = req.body;
    if (!label || !address) {
      return res.status(400).json({ message: 'Label and address are required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If setting as default, unset others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Helper: try to parse a single address string like "123 Some St, Tofino, v9wq"
    const tryParseAddress = (raw) => {
      if (!raw || typeof raw !== 'string') return { address: raw, city: '', postalCode: '' };
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

  // Prefer an explicit addressLine1 field; fall back to address (legacy)
  const addrLine = (addressLine1 && addressLine1.toString().trim() !== '') ? addressLine1 : address;
  // Always parse the address string to extract components
  const parsed = tryParseAddress(addrLine);
  let finalAddress = parsed.address || addrLine || '';
  let finalCity = city || parsed.city || '';
  let finalPostal = postalCode || parsed.postalCode || '';
  const finalProvince = province || '';
  const finalCountry = country || '';

  const newAddress = { label, address: finalAddress, city: finalCity, province: finalProvince || '', country: finalCountry || '', postalCode: finalPostal, isDefault: isDefault || false };
    if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        newAddress.latitude = lat;
        newAddress.longitude = lng;
      }
    }

    // If coordinates are not provided, attempt server-side forward geocode based on the provided address (addressLine1, city, province, postalCode, country)
    if ((typeof newAddress.latitude === 'undefined' || typeof newAddress.longitude === 'undefined' || newAddress.latitude === null || newAddress.longitude === null) && (finalAddress || finalCity || finalPostal || finalProvince || finalCountry)) {
      try {
        const { geocodeAddress } = require('../utils/geocode');
        const composed = [finalAddress, finalCity, finalProvince, finalPostal, finalCountry].filter(Boolean).join(', ');
        const geo = await geocodeAddress(composed);
        if (geo) {
          newAddress.latitude = geo.latitude;
          newAddress.longitude = geo.longitude;
          console.log("Address geocoded:", { fullAddress: composed, latitude: newAddress.latitude, longitude: newAddress.longitude });
          // If postalCode was missing, try to pull one from formatted or raw response
          if ((!newAddress.postalCode || newAddress.postalCode === '') && geo.postalCode) {
            newAddress.postalCode = geo.postalCode;
          } else if ((!newAddress.postalCode || newAddress.postalCode === '') && geo.raw && Array.isArray(geo.raw.address_components)) {
            for (const comp of geo.raw.address_components) {
              if (comp.types && (comp.types.includes('postal_code') || comp.types.includes('postal_code_prefix'))) {
                newAddress.postalCode = comp.long_name;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[profileController] geocodeAddress failed while adding address', e && e.message ? e.message : e);
      }
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json({ message: 'Address added', address: newAddress });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    // Debug: log incoming payload to verify frontend is sending city/postalCode
    console.debug('[profileController] updateAddress payload:', { id, body: req.body });
  const { label, address, city, postalCode, isDefault, latitude, longitude, province, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addrIndex = user.addresses.findIndex(addr => addr._id.toString() === id);
    if (addrIndex === -1) return res.status(404).json({ message: 'Address not found' });

    // If setting as default, unset others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const existing = user.addresses[addrIndex];

    // Helper same as addAddress
    const tryParseAddress = (raw) => {
      if (!raw || typeof raw !== 'string') return { address: raw, city: '', postalCode: '' };
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

    // Prepare final values, starting from existing then applying updates
  let finalLabel = typeof label !== 'undefined' ? label : existing.label;
    let finalAddress = typeof address !== 'undefined' ? address : existing.address;
    let finalCity = typeof city !== 'undefined' ? city : existing.city;
    let finalPostal = typeof postalCode !== 'undefined' ? postalCode : existing.postalCode;
    let finalIsDefault = typeof isDefault === 'boolean' ? isDefault : existing.isDefault;

    // If address was provided (or city/postal missing) try to parse and fill missing pieces
    if (typeof address !== 'undefined' && ( (!finalCity || finalCity === '') || (!finalPostal || finalPostal === '') )) {
      const parsed = tryParseAddress(address);
      if ((!finalCity || finalCity === '') && parsed.city) finalCity = parsed.city;
      if ((!finalPostal || finalPostal === '') && parsed.postalCode) finalPostal = parsed.postalCode;
      if (parsed.address && parsed.address !== '') finalAddress = parsed.address;
    }

    // Build updated address object
    let updatedLatitude = typeof latitude !== 'undefined' ? Number(latitude) : existing.latitude;
    let updatedLongitude = typeof longitude !== 'undefined' ? Number(longitude) : existing.longitude;

    // If coords are missing try server-side forward geocode using updated components (include province/country)
  const finalProvinceForGeo = (typeof province !== 'undefined' ? province : (existing.province || '')) || '';
  const finalCountryForGeo = (typeof country !== 'undefined' ? country : (existing.country || '')) || '';
    if ((typeof updatedLatitude === 'undefined' || typeof updatedLongitude === 'undefined' || updatedLatitude === null || updatedLongitude === null) && (finalAddress || finalCity || finalPostal || finalProvinceForGeo || finalCountryForGeo)) {
      try {
        const { geocodeAddress } = require('../utils/geocode');
        const composed = [finalAddress, finalCity, finalProvinceForGeo, finalPostal, finalCountryForGeo].filter(Boolean).join(', ');
        const geo = await geocodeAddress(composed);
        if (geo) {
          updatedLatitude = geo.latitude;
          updatedLongitude = geo.longitude;
          console.log("Address geocoded:", { fullAddress: composed, latitude: updatedLatitude, longitude: updatedLongitude });
          if ((!finalPostal || finalPostal === '') && geo.postalCode) {
            finalPostal = geo.postalCode;
          } else if ((!finalPostal || finalPostal === '') && geo.raw && Array.isArray(geo.raw.address_components)) {
            for (const comp of geo.raw.address_components) {
              if (comp.types && (comp.types.includes('postal_code') || comp.types.includes('postal_code_prefix'))) {
                finalPostal = comp.long_name;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[profileController] geocodeAddress failed while updating address', e && e.message ? e.message : e);
      }
    }

    user.addresses[addrIndex] = {
      ...existing,
      label: finalLabel,
      address: finalAddress,
      city: finalCity,
      province: typeof province !== 'undefined' ? province : existing.province || '',
      country: typeof country !== 'undefined' ? country : existing.country || '',
      postalCode: finalPostal,
      isDefault: finalIsDefault,
      latitude: typeof updatedLatitude !== 'undefined' ? Number(updatedLatitude) : existing.latitude,
      longitude: typeof updatedLongitude !== 'undefined' ? Number(updatedLongitude) : existing.longitude
    };
    await user.save();
    res.json({ message: 'Address updated', address: user.addresses[addrIndex] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== id);
    await user.save();
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password (requires current password)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    // update password and save (pre-save hook will hash)
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress, changePassword };
