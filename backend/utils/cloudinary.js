const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder (e.g., 'spice-hut/menu-items')
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (fileBuffer, folder = 'spice-hut', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: publicId ? true : false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn('Failed to delete image from Cloudinary:', error.message);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

module.exports = { uploadImage, deleteImage, extractPublicId };
