// Admin management controller
const User = require('../models/User');

// List all admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new admin
const addAdmin = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    const admin = await User.create({ name, email, password, phone, role: 'admin' });
    res.status(201).json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an admin
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status } = req.body;
  try {
    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;
    if (status) admin.status = status;
    await admin.save();
    res.json({ message: 'Admin updated', admin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an admin
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await admin.deleteOne();
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAdmins, addAdmin, updateAdmin, deleteAdmin };
