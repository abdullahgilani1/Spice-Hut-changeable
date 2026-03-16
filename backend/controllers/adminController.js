// Admin management controller
const User = require('../models/User');
const { DefaultOrder } = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Get admin dashboard stats (optimized with aggregation)
const getAdminStats = async (req, res) => {
  try {
    // Use aggregation for efficient counting
    const [orderStats, customerCount, itemCount] = await Promise.all([
      DefaultOrder.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      User.countDocuments({ role: 'user' }),
      MenuItem.countDocuments()
    ]);

    const stats = {
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      totalCustomers: customerCount,
      totalItems: itemCount
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// List all admins (with field projection)
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email phone role createdAt').lean();
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

module.exports = { getAdminStats, getAdmins, addAdmin, updateAdmin, deleteAdmin };
