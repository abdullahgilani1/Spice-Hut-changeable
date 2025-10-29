// Customer management controller
const User = require('../models/User');

// List all customers (role: user)
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'user' }).select('-password');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a customer
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'user') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.deleteOne();
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getCustomers, deleteCustomer };
