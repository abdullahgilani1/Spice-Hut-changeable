const Category = require('../models/Category');
const { uploadImage, deleteImage, extractPublicId } = require('../utils/cloudinary');

const slugify = (s) => s && s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(c => ({ 
      _id: c._id, 
      name: c.name, 
      description: c.description, 
      image: c.image || '', 
      slug: c.slug || slugify(c.name), 
      subCategory: c.subCategory || '' 
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new category (admin only)
const createCategory = async (req, res) => {
  const { name, description, slug, subCategory } = req.body;
  const file = req.file;
  
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  if (!file) return res.status(400).json({ message: 'Category image is required' });

  try {
    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(400).json({ message: 'Category already exists' });

    let imagePath = '';
    try {
      const result = await uploadImage(file.buffer, 'spice-hut/categories');
      imagePath = result.url;
    } catch (uploadErr) {
      console.error('Cloudinary upload failed:', uploadErr);
      return res.status(500).json({ message: 'Failed to upload image' });
    }

    const computedSlug = slug && slug.trim() ? slug : slugify(name);
    const category = await Category.create({ 
      name, 
      description, 
      image: imagePath, 
      slug: computedSlug, 
      subCategory: subCategory || '' 
    });
    
    res.status(201).json({ 
      _id: category._id, 
      name: category.name, 
      description: category.description, 
      image: category.image, 
      slug: category.slug, 
      subCategory: category.subCategory 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update category (admin only)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, slug, subCategory } = req.body;
  const file = req.file;

  try {
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    if (name) cat.name = name;
    if (description !== undefined) cat.description = description;
    if (slug) cat.slug = slug;
    if (subCategory !== undefined) cat.subCategory = subCategory;
    
    // Handle image update
    if (file) {
      try {
        // Delete old image from Cloudinary
        if (cat.image) {
          const oldPublicId = extractPublicId(cat.image);
          if (oldPublicId) {
            await deleteImage(oldPublicId);
          }
        }
        // Upload new image
        const result = await uploadImage(file.buffer, 'spice-hut/categories');
        cat.image = result.url;
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    await cat.save();
    res.json({ 
      _id: cat._id, 
      name: cat.name, 
      description: cat.description, 
      image: cat.image, 
      slug: cat.slug,
      subCategory: cat.subCategory
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete category (admin only)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    // Delete image from Cloudinary
    if (cat.image) {
      const publicId = extractPublicId(cat.image);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    await cat.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
