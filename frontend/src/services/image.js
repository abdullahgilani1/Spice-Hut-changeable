import api from './api';

// Derive server base (e.g., http://localhost:5000) from axios baseURL (which is '.../api')
const defaultBase = 'http://localhost:5000';
const base = (() => {
  try {
    const b = api.defaults && api.defaults.baseURL ? api.defaults.baseURL : defaultBase;
    return b.replace(/\/api\/?$/, '');
  } catch (e) {
    return defaultBase;
  }
})();

export function resolveImageSrc(img, fallback = '/default-category.jpg') {
  if (!img) return fallback;
  if (typeof img !== 'string') return fallback;
  const trimmed = img.trim();
  if (!trimmed) return fallback;
  // data URLs
  if (trimmed.startsWith('data:')) return trimmed;
  // server uploads stored as '/uploads/...' or 'uploads/...'
  if (trimmed.startsWith('/uploads')) return `${base}/api${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${base}/api/${trimmed}`;
  // full urls
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  // unknown relative — try to resolve under api/uploads
  return `${base}/api/${trimmed}`;
}
