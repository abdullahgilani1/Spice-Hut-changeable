// Utility for geolocation and reverse geocoding using Google Maps API

export const getCurrentLocation = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // Try to load Google Maps script dynamically if API key is provided
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        loadGoogleMaps(apiKey)
          .then(() => reverseGeocode(latitude, longitude, onSuccess, onError))
          .catch((e) => {
            console.warn('Failed to load Google Maps API, falling back to coordinates only', e);
            onError('Google Maps API unavailable. Please enter your address manually.');
          });
      } else {
        // No API key configured — inform caller to enter address manually
        onError('Google Maps API key not configured. Please enter your address manually.');
      }
    },
    (error) => {
      let message = "Unable to get location, please enter your address manually.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location access denied. Please allow location access and try again.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
        default:
          break;
      }
      onError(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    }
  );
};

// dynamically load Google Maps JS
const loadGoogleMaps = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

const reverseGeocode = (lat, lng, onSuccess, onError) => {
  if (!window.google || !window.google.maps) {
    onError('Google Maps API not loaded.');
    return;
  }

  const geocoder = new window.google.maps.Geocoder();
  const latLng = { lat, lng };

  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
      // Prefer the most specific address (usually results[0]) for street components
      const primary = results[0];
      let streetNumber = '';
      let streetName = '';
      let city = '';
      let postalCode = '';

      if (primary && primary.address_components) {
        primary.address_components.forEach((component) => {
          const types = component.types || [];
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) streetName = component.long_name;
          // city may not be present on the primary result; prefer locality but try others later
          if (types.includes('locality')) city = component.long_name;
        });
      }

      // Search across all results for city and postal_code if not found yet
      for (const res of results) {
        if (!res || !res.address_components) continue;
        for (const component of res.address_components) {
          const types = component.types || [];
          if (!city && (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('administrative_area_level_1'))) {
            city = component.long_name;
          }
          if (!postalCode && (types.includes('postal_code') || types.includes('postal_code_prefix'))) {
            postalCode = component.long_name;
          }
          if (city && postalCode) break;
        }
        if (city && postalCode) break;
      }

      const addressLine1 = `${streetNumber} ${streetName}`.trim();
      onSuccess({
        addressLine1,
        city,
        postalCode,
        latitude: lat,
        longitude: lng,
      });
    } else {
      onError('Unable to retrieve address from location. Please enter your address manually.');
    }
  });
};
