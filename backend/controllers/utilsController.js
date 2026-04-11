const https = require('https');
const { URL } = require('url');

// Reverse geocode coordinates to structured address using Google Geocoding API
const reverseGeocode = async (req, res) => {
  try {
    // Accept both POST body and GET query params for easier testing
    const payload = (req.method === 'GET') ? req.query : (req.body || {});
    const { latitude, longitude } = payload || {};
    if (typeof latitude === 'undefined' || typeof longitude === 'undefined') {
      return res.status(400).json({ message: 'latitude and longitude are required in body' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('[utilsController] Missing GOOGLE_MAPS_API_KEY in environment');
      return res.status(500).json({ message: 'Google Maps API key not configured on server' });
    }

    const latlng = `${latitude},${longitude}`;
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', latlng);
    url.searchParams.set('key', apiKey);

    const data = await new Promise((resolve, reject) => {
      https.get(url.toString(), (resp) => {
        let raw = '';
        resp.on('data', (chunk) => { raw += chunk; });
        resp.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
        });
      }).on('error', (err) => reject(err));
    });

    if (!data) return res.status(502).json({ message: 'Empty response from geocoding service' });
    if (data.status && data.status !== 'OK') {
      // return helpful message depending on status
      if (data.status === 'ZERO_RESULTS') return res.status(404).json({ message: 'No address found for coordinates (ZERO_RESULTS)' });
      if (data.status === 'REQUEST_DENIED') {
        return res.status(502).json({ 
          message: 'Google Maps API request denied',
          error: data.error_message || 'No error message provided',
          status: data.status
        });
      }
      return res.status(502).json({ message: `Geocoding API error: ${data.status}`, error: data.error_message || null });
    }

    if (!Array.isArray(data.results) || data.results.length === 0) {
      return res.status(404).json({ message: 'No address found for coordinates' });
    }

    const best = data.results[0];
    // parse components from best result for formatted details
    const components = {};
    for (const comp of best.address_components || []) {
      const types = comp.types || [];
      if (types.includes('locality')) components.city = comp.long_name;
      if (types.includes('administrative_area_level_1')) components.province = comp.long_name;
      if (types.includes('country')) components.country = comp.long_name;
    }

    // Try to find postal code and city across all results if not present on the primary result
    if (!components.postalCode) {
      for (const res of data.results || []) {
        for (const comp of res.address_components || []) {
          const types = comp.types || [];
          if (!components.postalCode && (types.includes('postal_code') || types.includes('postal_code_prefix'))) {
            components.postalCode = comp.long_name;
            break;
          }
        }
        if (components.postalCode) break;
      }
    }

    if (!components.city) {
      for (const res of data.results || []) {
        for (const comp of res.address_components || []) {
          const types = comp.types || [];
          if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('administrative_area_level_1')) {
            components.city = comp.long_name;
            break;
          }
        }
        if (components.city) break;
      }
    }

    const formatted = {
      formattedAddress: best.formatted_address,
      city: components.city || '',
      province: components.province || '',
      postalCode: components.postalCode || '',
      country: components.country || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      raw: best,
    };

    // If postalCode missing, attempt a lightweight OSM/Nominatim fallback to fetch postcode (useful for some regions)
    if ((!formatted.postalCode || formatted.postalCode === '') && process.env.ENABLE_OSM_FALLBACK !== 'false') {
      try {
        const nomUrl = new URL('https://nominatim.openstreetmap.org/reverse');
        nomUrl.searchParams.set('format', 'jsonv2');
        nomUrl.searchParams.set('lat', latitude);
        nomUrl.searchParams.set('lon', longitude);

        const nomData = await new Promise((resolve, reject) => {
          const opts = {
            headers: { 'User-Agent': 'SpiceHutApp/1.0 (dev contact)' }
          };
          https.get(nomUrl.toString(), opts, (resp) => {
            let raw = '';
            resp.on('data', (chunk) => { raw += chunk; });
            resp.on('end', () => {
              try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
            });
          }).on('error', (err) => reject(err));
        });

        if (nomData && nomData.address && nomData.address.postcode) {
          formatted.postalCode = nomData.address.postcode;
        }
      } catch (osmErr) {
        // OSM fallback failed silently
      }
    }

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Reverse geocoding failed', error: error.message });
  }
};

module.exports = { reverseGeocode };
