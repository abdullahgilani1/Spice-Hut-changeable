// Resolve image source - handles Cloudinary URLs and fallbacks
export function resolveImageSrc(img, fallback = '/default-category.jpg') {
  if (!img) return fallback;
  if (typeof img !== 'string') return fallback;
  
  const trimmed = img.trim();
  if (!trimmed) return fallback;
  
  // Cloudinary URLs (https://res.cloudinary.com/...)
  if (trimmed.startsWith('https://res.cloudinary.com')) return trimmed;
  
  // Data URLs
  if (trimmed.startsWith('data:')) return trimmed;
  
  // Full URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  
  // Fallback
  return fallback;
}
