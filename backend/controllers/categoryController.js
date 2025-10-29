const Category = require('../models/Category');

// simple slugify helper
const slugify = (s) => s && s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    // return minimal shape to frontend
    res.json(categories.map(c => ({ _id: c._id, name: c.name, description: c.description, image: c.image || '', slug: c.slug || slugify(c.name) })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new category (admin only)
const createCategory = async (req, res) => {
  const { name, description, image: bodyImage, slug } = req.body;
  // if multer was used, file will be on req.file
  const file = req.file;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  // image is required now
  if (!file && !bodyImage) return res.status(400).json({ message: 'Category image is required' });

  try {
    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(400).json({ message: 'Category already exists' });

  const computedSlug = slug && slug.trim() ? slug : slugify(name);
  const imagePath = file ? `/uploads/${file.filename}` : (bodyImage || '');
  const category = await Category.create({ name, description, image: imagePath, slug: computedSlug });
    res.status(201).json({ _id: category._id, name: category.name, description: category.description, image: category.image, slug: category.slug });
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
    await cat.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
