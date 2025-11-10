const MenuItem = require('../models/MenuItem');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

// Search menu items and categories
const searchMenu = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === '') {
      return res.json({ categories: [], items: [] });
    }

    // Escape special regex characters and create partial match pattern
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');

    // Search categories with partial matching
    const categories = await Category.find({
      name: { $regex: searchRegex }
    }).sort({ name: 1 });

    // Search menu items with partial matching
    const items = await MenuItem.find({
      $or: [
        { name: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ]
    }).sort({ name: 1 });

    res.json({
      categories: categories.map(c => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        image: c.image || '',
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      })),
      items: items
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all menu items (admin or public)
const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get menu items for a specific category (by slug or name)
const getMenuByCategory = async (req, res) => {
  try {
    const raw = req.params.category;
    if (!raw) return res.status(400).json({ message: 'Category is required' });

    const slug = raw.toString().toLowerCase().trim();

    // Try to find by Category slug or name (case-insensitive)
    let category = await Category.findOne({ $or: [{ slug }, { name: new RegExp(`^${raw}$`, 'i') }] }).populate('items');

    if (category && category.items && category.items.length) {
      return res.json(category.items);
    }

    // Fallback: find menu items whose category field matches (case-insensitive)
    const items = await MenuItem.find({ category: new RegExp(`^${raw}$`, 'i') }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new menu item (admin only)
const createMenuItem = async (req, res) => {
  try {
    // debug: log incoming payload and file metadata
    console.debug('createMenuItem payload:', { body: req.body, file: req.file && { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } });
    const { name, category, price, status, image, description, subCategory } = req.body;
    if (!name || !category || price == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // if a file was uploaded via multer, prefer that path
    let imagePath = image;
    if (req.file && req.file.filename) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    const item = await MenuItem.create({ name, category, price, status, image: imagePath, description, subCategory });
    
    // add reference to category.items (find by name case-insensitive)
    try {
      const cat = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
      if (cat) {
        cat.items.push(item._id);
        await cat.save();
      }
    } catch (catErr) {
      console.warn('Failed to attach item to category', catErr);
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a menu item (admin only)
const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

  const { name, category, price, status, image, description, subCategory } = req.body;
    item.name = name ?? item.name;
    item.category = category ?? item.category;
    item.price = price ?? item.price;
    item.status = status ?? item.status;
    // if a new file was uploaded, use it; otherwise use provided image or existing
    if (req.file && req.file.filename) {
      item.image = `/uploads/${req.file.filename}`;
    } else {
      item.image = image ?? item.image;
    }
  item.subCategory = subCategory ?? item.subCategory;
    item.description = description ?? item.description;

    const oldCategory = item.category;
    await item.save();

    // If category changed, move reference
    if (category && category !== oldCategory) {
      try {
        const newCat = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
        const oldCat = await Category.findOne({ name: new RegExp(`^${oldCategory}$`, 'i') });
        if (newCat && !newCat.items.includes(item._id)) {
          newCat.items.push(item._id);
          await newCat.save();
        }
        if (oldCat && oldCat.items.includes(item._id)) {
          oldCat.items = oldCat.items.filter(id => id.toString() !== item._id.toString());
          await oldCat.save();
        }
      } catch (moveErr) {
        console.warn('Failed to move item between categories', moveErr);
      }
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a menu item (admin only)
const deleteMenuItem = async (req, res) => {
  try {
    // find the DB record first
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    // remove reference from its category if present
    try {
      const cat = await Category.findOne({ name: new RegExp(`^${item.category}$`, 'i') });
      if (cat && cat.items && cat.items.length) {
        cat.items = cat.items.filter(id => id.toString() !== item._id.toString());
        await cat.save();
      }
    } catch (catErr) {
      console.warn('Failed to remove item reference from category', catErr);
    }

    // delete the DB record
    await item.deleteOne();

    // debug
    console.debug('Deleted menu item from DB:', item._id);

    // if item had an uploaded file under /uploads, try to remove it from disk
    try {
      if (item.image && item.image.startsWith('/uploads')) {
        const filename = path.basename(item.image);
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.debug('Deleted uploaded file:', filePath);
        }
      }
    } catch (fsErr) {
      // log and continue - file deletion shouldn't block the response
      console.warn('Failed to delete uploaded file for menu item', fsErr);
    }

    return res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { searchMenu, getMenuItems, getMenuByCategory, createMenuItem, updateMenuItem, deleteMenuItem };
