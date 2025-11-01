const https = require('https');
const { URL } = require('url');

// Forward geocode an address string to { latitude, longitude, formattedAddress }
// Returns null on failure or if no results.
const geocodeAddress = async (address) => {
  try {
    if (!address || typeof address !== 'string' || address.trim() === '') return null;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('[geocode] GOOGLE_MAPS_API_KEY not configured, skipping geocode');
      return null;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
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

    if (!data) return null;
    if (data.status && data.status !== 'OK') {
      console.warn('[geocode] API returned status', data.status, data.error_message || '');
      return null;
    }
    if (!Array.isArray(data.results) || data.results.length === 0) return null;

    const best = data.results[0];
    const loc = best.geometry && best.geometry.location;
    if (!loc) return null;

    // attempt to extract postal code from address_components
    let postalCode = '';
    try {
      if (Array.isArray(best.address_components)) {
        for (const comp of best.address_components) {
          if (comp.types && (comp.types.includes('postal_code') || comp.types.includes('postal_code_prefix'))) {
            postalCode = comp.long_name;
            break;
          }
        }
      }
    } catch (e) {
      // ignore extraction errors
    }

    return {
      latitude: Number(loc.lat),
      longitude: Number(loc.lng),
      postalCode: postalCode || '',
      formattedAddress: best.formatted_address,
      raw: best
    };
  } catch (err) {
    console.warn('[geocode] failed', err && err.message ? err.message : err);
    return null;
  }
};

module.exports = { geocodeAddress };
