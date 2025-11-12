const { getOrderModel, DefaultOrder } = require('../models/Order');
const User = require('../models/User');
const OrderCounter = require('../models/OrderCounter');
const Branch = require('../models/Branch');
const https = require('https');
const { URL } = require('url');

// Find nearest branch by coordinates using Google Distance Matrix API
async function findNearestBranchByCoords(lat, lng) {
  // get branches with coordinates
  const branches = await Branch.find({ latitude: { $ne: null }, longitude: { $ne: null } });
  if (!branches || branches.length === 0) return null;

  // build destinations string: lat,lng|lat2,lng2
  const destinations = branches.map(b => `${b.latitude},${b.longitude}`).join('|');
  const origins = `${lat},${lng}`;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY not configured');

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', origins);
  url.searchParams.set('destinations', destinations);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('units', 'metric');

  // perform GET
  const data = await new Promise((resolve, reject) => {
    https.get(url.toString(), (resp) => {
      let raw = '';
      resp.on('data', (chunk) => { raw += chunk; });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (e) { reject(e); }
      });
    }).on('error', (err) => reject(err));
  });

  if (!data || !data.rows || !Array.isArray(data.rows) || data.rows.length === 0) return null;
  const elements = data.rows[0].elements || [];
  // find smallest distance value among OK elements
  let minIndex = -1;
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el || el.status !== 'OK') continue;
    const dist = typeof el.distance?.value === 'number' ? el.distance.value : Number.POSITIVE_INFINITY;
    if (dist < minDistance) { minDistance = dist; minIndex = i; }
  }
  if (minIndex === -1) return null;
  return branches[minIndex] || null;
}

const normalizeLocation = (loc) => {
  if (!loc) return '';
  return loc.toString().trim().replace(/[^a-zA-Z0-9]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};

// Try to parse an address string like "123 Some St, Tofino, v9wq" into components
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

// Normalize address string for comparison: lowercase, remove punctuation and excess spaces
const normalizeAddrForCompare = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s.toString().trim().toLowerCase().replace(/[.,#\-]/g, '').replace(/\s+/g, ' ');
};

// return array of models (default + branch-specific) by reading branch cities from DB
const getAllOrderModels = async () => {
  const models = [DefaultOrder];
  try {
    const cities = await Branch.distinct('city');
    if (Array.isArray(cities)) {
      for (const c of cities) {
        if (c && c.toString().trim() !== '') models.push(getOrderModel(c));
      }
    }
  } catch (e) {
    console.warn('[orderController] failed to load branch cities for order models', e && e.message ? e.message : e);
  }
  return models;
};

// Find an order by _id across all collections; returns { order, model } or { order: null }
const findOrderAcrossCollectionsById = async (id) => {
  const models = await getAllOrderModels();
  for (const m of models) {
    try {
      const found = await m.findById(id);
      if (found) return { order: found, model: m };
    } catch (err) {
      // ignore cast errors and continue
    }
  }
  return { order: null };
};

// Find an order by orderId across all collections; returns { order, model }
const findOrderAcrossCollectionsByOrderId = async (orderId) => {
  const models = await getAllOrderModels();
  for (const m of models) {
    try {
      const found = await m.findOne({ orderId });
      if (found) return { order: found, model: m };
    } catch (err) {
      // ignore and continue
    }
  }
  return { order: null };
};

// Generate a global sequential order ID
const generateOrderId = async () => {
  // Atomically increment the global counter
  const counter = await OrderCounter.findOneAndUpdate(
    { _id: 'global' },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true }
  );

  const sequentialNumber = counter.lastNumber.toString().padStart(5, '0');
  return `ORD-${sequentialNumber}`;
};

// Create a new order (public / from frontend)
const createOrder = async (req, res) => {
  try {
      // Accept optional explicit city/postalCode and orderType from client to avoid lossy parsing
      const { customerId, customerName, items, total, paymentMethod, address, city: providedCity, postalCode: providedPostal, pointsUsed = 0, location, currentLocation, orderType } = req.body;

    if (!customerId || !items || typeof total === 'undefined') {
      return res.status(400).json({ message: 'Missing required order fields' });
    }

  // Generate sequential order ID
  const orderId = await generateOrderId();

    // Enforce loyalty points rule on server:
    // - 100 points = $1 discount
    // - pointsUsed must be a multiple of 100 and <= user's available points
    // Compute subtotal from items (pre-tax) and detect tax as the difference to the provided total.
    const subtotal = (items || []).reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);
    const detectedTax = Math.max(0, (total || 0) - subtotal);

    let validatedPointsUsed = Math.max(0, pointsUsed || 0);
  // We'll choose the target collection/model after we determine/normalize the final city
  // (so we can infer branch from provided address when `location` isn't supplied).
  let chosenModel = DefaultOrder;

    try {
      const user = await User.findById(customerId);
      if (user) {
        const available = user.loyaltyPoints || 0;
        // Cap pointsUsed to available
        if (validatedPointsUsed > available) validatedPointsUsed = available;
        // Only allow multiples of 100
        validatedPointsUsed = Math.floor(validatedPointsUsed / 100) * 100;
        const discount = validatedPointsUsed / 100; // $ discount applied to subtotal

        // Apply discount to subtotal (tax remains the same)
        const subtotalAfterDiscount = Math.max(0, +(subtotal - discount).toFixed(2));
        const finalTotal = +(subtotalAfterDiscount + detectedTax).toFixed(2);

        // Calculate points earned based on subtotal after discount (pre-tax)
        const pointsEarned = Math.floor(subtotalAfterDiscount);

        // Prefer explicit city/postalCode fields from client; fall back to parsing the address string
        const parsed = tryParseAddress(address);
        let finalCity = (providedCity || parsed.city || '').toString();
        let finalPostal = (providedPostal || parsed.postalCode || '').toString();
        // Compose finalAddress: if client provided city/postal, append them to the provided address
        let finalAddress = address || '';
        if (finalAddress && (finalCity || finalPostal)) {
          // avoid duplicating if address already contains city/postal by checking parsed parts
          const parsedAddr = parsed.address || '';
          if (parsedAddr && parsedAddr === finalAddress) {
            finalAddress = `${parsedAddr}${finalCity ? `, ${finalCity}` : ''}${finalPostal ? `, ${finalPostal}` : ''}`;
          } else if (!parsed.city && !parsed.postalCode) {
            finalAddress = `${finalAddress}${finalCity ? `, ${finalCity}` : ''}${finalPostal ? `, ${finalPostal}` : ''}`;
          }
        }

        // If caller provided explicit location (branch name), use it.
        // Otherwise, if currentLocation (coords) is provided in the request or present on user profile, determine nearest branch using Distance Matrix API.
        let branchToUse = location;
        // prefer explicit currentLocation param from request, otherwise fallback to user's stored currentLocation
        const userCoords = (currentLocation && currentLocation.latitude && currentLocation.longitude) ? currentLocation : (user.currentLocation || null);
        if (!branchToUse && userCoords && userCoords.latitude && userCoords.longitude) {
          try {
            // find nearest branch by coordinates
            const nearest = await findNearestBranchByCoords(userCoords.latitude, userCoords.longitude);
            if (nearest) {
              branchToUse = nearest.city || nearest.name || '';
            }
          } catch (nbErr) {
            console.warn('Failed to determine nearest branch by coords, falling back to city inference', nbErr);
          }
        }

        // If still not determined, try to infer branch from finalCity by matching against branch cities in DB.
        if (!branchToUse) {
          const cityNorm = (finalCity || '').toString().trim().toLowerCase();
          if (cityNorm) {
            try {
              const branchCities = await Branch.distinct('city');
              for (const b of branchCities || []) {
                const bNorm = (b || '').toString().trim().toLowerCase();
                if (bNorm && (cityNorm === bNorm || cityNorm.includes(bNorm) || bNorm.includes(cityNorm))) {
                  branchToUse = b;
                  break;
                }
              }
            } catch (e) {
              console.warn('[orderController] failed to load branch cities for inference', e && e.message ? e.message : e);
            }
          }
        }
        chosenModel = branchToUse ? getOrderModel(branchToUse) : DefaultOrder;

        // Create order record including validated points used/earned.
        // Build order payload and include location logs if available
        const orderPayload = {
          orderId,
          customer: customerId,
          customerName: customerName || undefined,
          items,
          total: finalTotal,
          paymentMethod,
          address: finalAddress,
          city: finalCity,
          postalCode: finalPostal,
          pointsUsed: validatedPointsUsed,
          pointsEarned,
          orderType: orderType === 'homeDelivery' ? 'homeDelivery' : 'pickup',
        };

        // attach user and branch coordinates / servingBranch when we have them
        try {
          const usedCoords = (currentLocation && currentLocation.latitude && currentLocation.longitude) ? currentLocation : (user.currentLocation || null);
          if (usedCoords && usedCoords.latitude && usedCoords.longitude) {
            orderPayload.userLocation = { latitude: usedCoords.latitude, longitude: usedCoords.longitude };
            // find branch document for branchToUse to record its coords
            if (branchToUse) {
              const branchDoc = await Branch.findOne({ name: branchToUse });
              if (branchDoc) {
                orderPayload.branchLocation = { latitude: branchDoc.latitude || null, longitude: branchDoc.longitude || null };
                orderPayload.servingBranch = branchDoc.name || branchToUse;
              }
            }
          }
        } catch (attachErr) {
          console.warn('Failed to attach location metadata to order payload', attachErr);
        }

  const order = await chosenModel.create(orderPayload);

  // If the order is already finalized (paymentMethod is set and not 'Pending'), update user's loyalty balance now.
  if (paymentMethod && String(paymentMethod).toLowerCase() !== 'pending') {
          try {
            user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - validatedPointsUsed);
            user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
            await user.save();
          } catch (userErr) {
            console.warn('Failed to update user loyalty points after order', userErr);
          }
        }

        // respond with created order (order document already includes servingBranch)
        res.status(201).json(order);
        return;
      }
    } catch (errUser) {
      console.warn('Loyalty validation user lookup failed, proceeding to create order without applying points', errUser);
    }

    // If we couldn't validate user loyalty or user not found, create order without applying points
    const subtotalAfterDiscountFallback = Math.max(0, subtotal);
    const pointsEarnedFallback = Math.floor(subtotalAfterDiscountFallback);
    const parsedFallback = tryParseAddress(address);
    const finalCityFallback = (providedCity || parsedFallback.city || '').toString();
    const finalPostalFallback = (providedPostal || parsedFallback.postalCode || '').toString();
    let finalAddressFallback = parsedFallback.address || address || '';
    if (finalAddressFallback && (finalCityFallback || finalPostalFallback)) {
      if (!parsedFallback.city && !parsedFallback.postalCode) {
        finalAddressFallback = `${finalAddressFallback}${finalCityFallback ? `, ${finalCityFallback}` : ''}${finalPostalFallback ? `, ${finalPostalFallback}` : ''}`;
      }
    }

    // If no user was found/validated above, try to infer branch from parsed fallback city when location wasn't provided
    if (!location) {
      const cityNormFb = (finalCityFallback || '').toString().trim().toLowerCase();
      if (cityNormFb) {
        try {
          const branchCitiesFb = await Branch.distinct('city');
          for (const b of branchCitiesFb || []) {
            const bNorm = (b || '').toString().trim().toLowerCase();
            if (bNorm && (cityNormFb === bNorm || cityNormFb.includes(bNorm) || bNorm.includes(cityNormFb))) {
              chosenModel = getOrderModel(b);
              break;
            }
          }
        } catch (e) {
          console.warn('[orderController] failed to load branch cities for fallback inference', e && e.message ? e.message : e);
        }
      }
    } else {
      chosenModel = getOrderModel(location);
    }

    const order = await chosenModel.create({
      orderId,
      customer: customerId,
      customerName: customerName || undefined,
      items,
      total: +(subtotalAfterDiscountFallback + detectedTax).toFixed(2),
      paymentMethod,
      address: finalAddressFallback,
      city: finalCityFallback,
      postalCode: finalPostalFallback,
      pointsUsed: 0,
      pointsEarned: pointsEarnedFallback,
      orderType: orderType === 'homeDelivery' ? 'homeDelivery' : 'pickup',
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all orders (admin only)
const getOrders = async (req, res) => {
  try {
    // Aggregate orders from all branch collections + default collection
  const models = await getAllOrderModels();
    const results = [];
    for (const m of models) {
      try {
        const rows = await m.find().populate('customer', 'name email phone').sort({ createdAt: -1 });
        // annotate which collection (optional) by adding a _branch field using model's collection name
        const collectionName = m.collection && m.collection.name ? m.collection.name : '';
        for (const r of rows) {
          // attach branch (derived from collectionName) without altering shape
          r._branch = collectionName;
          results.push(r);
        }
      } catch (err) {
        // continue on per-collection failures
        console.warn('Failed to read orders from collection for model', err && err.message ? err.message : err);
      }
    }

    // sort merged results by createdAt desc
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user's orders
const getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Not authorized' });
  const models = await getAllOrderModels();
    const results = [];
    for (const m of models) {
      try {
        const rows = await m.find({ customer: req.user._id }).sort({ createdAt: -1 });
        results.push(...rows);
      } catch (err) {
        console.warn('Failed to query user orders from a branch collection', err);
      }
    }
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order by id
const getOrderById = async (req, res) => {
  try {
    // Try to find by Mongo _id first
    let result = await findOrderAcrossCollectionsById(req.params.id);
    let order = result.order;
    // If not found by _id, try searching by orderId
    if (!order) {
      const r2 = await findOrderAcrossCollectionsByOrderId(req.params.id);
      order = r2.order;
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // populate customer info if not already
    await order.populate('customer', 'name email phone');
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { order, model } = await findOrderAcrossCollectionsById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status || order.status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order (owner or admin) - allows updating total, pointsUsed, paymentMethod, address, items
const updateOrder = async (req, res) => {
  try {
    // Find the order across collections
    const { order, model } = await findOrderAcrossCollectionsById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only owner or admin may update
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Allowed updates
    const { total, pointsUsed, paymentMethod, address, items } = req.body;
    if (typeof total !== 'undefined') order.total = total;
    if (typeof paymentMethod !== 'undefined') order.paymentMethod = paymentMethod;
    if (typeof address !== 'undefined') {
      // Attempt to prefer matched saved address from user's profile. If none matches, fall back to parsed values.
      const parsed = tryParseAddress(address);

      try {
        const user = await User.findById(order.customer);
        let matched = null;
        const normRequested = normalizeAddrForCompare(parsed.address || address || order.address || '');
        if (user && Array.isArray(user.addresses) && user.addresses.length) {
          for (const a of user.addresses) {
            if (!a || !a.address) continue;
            const parsedSaved = tryParseAddress(a.address);
            const normSavedStreet = normalizeAddrForCompare(parsedSaved.address);
            if (normSavedStreet && normSavedStreet === normRequested) { matched = a; break; }
          }
          if (!matched) matched = user.addresses.find(x => x && x.isDefault) || null;
        }

        if (matched) {
          // use user's saved address as authoritative when it matches
          order.address = matched.address || (parsed.address || order.address);
          order.city = matched.city || '';
          order.postalCode = matched.postalCode || '';
        } else {
          // no match: use parsed components non-destructively
          if (parsed.address && parsed.address !== '') order.address = parsed.address;
          if (parsed.city) order.city = parsed.city;
          if (parsed.postalCode) order.postalCode = parsed.postalCode;
        }
      } catch (fillErr) {
        console.warn('Failed to resolve address components from profile during order update', fillErr);
        // fallback to parsed values
        if (parsed.address && parsed.address !== '') order.address = parsed.address;
        if (parsed.city) order.city = parsed.city;
        if (parsed.postalCode) order.postalCode = parsed.postalCode;
      }
    }
    if (Array.isArray(items)) order.items = items;
    if (typeof pointsUsed !== 'undefined') order.pointsUsed = pointsUsed;

    // Recalculate and validate pointsUsed on server: ensure pointsUsed <= user's balance and multiple of 100
    try {
      const user = await User.findById(order.customer);
      if (user) {
        let validatedPointsUsed = Math.max(0, order.pointsUsed || 0);
        const available = user.loyaltyPoints || 0;
        if (validatedPointsUsed > available) validatedPointsUsed = available;
        validatedPointsUsed = Math.floor(validatedPointsUsed / 100) * 100;

        // Recompute subtotal from items and detect tax
        const subtotal = (order.items || []).reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);
        const detectedTax = Math.max(0, (order.total || 0) - subtotal);

        const discount = validatedPointsUsed / 100;
        const subtotalAfterDiscount = Math.max(0, +(subtotal - discount).toFixed(2));
        const finalTotal = +(subtotalAfterDiscount + detectedTax).toFixed(2);

        order.total = finalTotal;
        order.pointsUsed = validatedPointsUsed;
        order.pointsEarned = Math.floor(subtotalAfterDiscount);

        await order.save();

        // Update user's loyalty points: deduct used points, then add earned points
        try {
          user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - validatedPointsUsed);
          user.loyaltyPoints = (user.loyaltyPoints || 0) + (order.pointsEarned || 0);
          await user.save();
        } catch (userErr) {
          console.warn('Failed to update user loyalty points after order update', userErr);
        }

        res.json(order);
        return;
      }
    } catch (uErr) {
      console.warn('Failed to validate/update loyalty points on order update', uErr);
    }

    // If user lookup/validation failed, fallback to saving order as-is with recalculated pointsEarned using subtotal
    const fallbackSubtotal = (order.items || []).reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);
    order.pointsEarned = Math.floor(Math.max(0, fallbackSubtotal));
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, getUserOrders, updateOrder };
