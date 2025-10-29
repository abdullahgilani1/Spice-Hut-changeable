import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiUserPlus, FiEye, FiShoppingCart } from "react-icons/fi";
import { customerAPI, orderAPI } from "../../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch customers from backend
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await customerAPI.getCustomers();
        setCustomers(data);
      } catch {
        setError("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers by search and status
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || (customer.status || "Active") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handler for deleting a customer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await customerAPI.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete customer");
    }
  };

  // Handler for selecting customer (for modal/details)
  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    // fetch all orders (admin) and filter by this customer
    setOrdersLoading(true);
    try {
      const allOrders = await orderAPI.getOrders();
      // filter orders where order.customer matches the customer._id
      const filtered = (allOrders || []).filter(o => {
        if (!o) return false;
        if (o.customer && typeof o.customer === 'object') {
          return String(o.customer._id || o.customer) === String(customer._id);
        }
        return String(o.customer) === String(customer._id);
      });
      setCustomerOrders(filtered);
    } catch (err) {
      console.error('Failed to load orders for customer', err);
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Customers Management</h1>
          <p className="text-gray-600 text-lg">Manage your restaurant customers and their accounts.</p>
        </div>
        {/* Removed Add Customer button as per request */}
        {/* <button className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center">
          <FiUserPlus className="mr-2" />
          Add Customer
        </button> */}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Customers List ({filteredCustomers.length})</h2>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                            {customer.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          customer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (customer.status || "Active") === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectCustomer(customer)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="View Order History"
                          >
                            <FiShoppingCart className="w-4 h-4" />
                          </button>
                        {/*}  <button
                            className="text-red-600 hover:text-red-900 p-1"
                            onClick={() => handleDelete(customer._id)}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
            {/*}  <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiTrash2 className="w-6 h-6" />
              </button> */}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Customer Info */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {selectedCustomer.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedCustomer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedCustomer.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (selectedCustomer.status || "Active") === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCustomer.status || "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : "-"}</span>
                    </div>
                    {/* Addresses */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Addresses</h4>
                      {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                        <div className="space-y-2 text-sm text-gray-700">
                          {selectedCustomer.addresses.map((addr) => (
                            <div key={addr._id || addr.id || addr.label} className="p-2 bg-white rounded border">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{addr.label}</div>
                                  <div className="text-xs text-gray-500 break-words">{addr.address}</div>
                                </div>
                                {addr.isDefault && <div className="text-xs text-green-600 font-medium">Default</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No addresses on file.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Order Statistics (placeholder) */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{customerOrders.length}</div>
                    <div className="text-sm text-blue-800">Total Orders</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">${(customerOrders.reduce((s, o) => s + (o.total || 0), 0)).toFixed(2)}</div>
                    <div className="text-sm text-green-800">Total Spent</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{customerOrders.length > 0 ? new Date(customerOrders[0].createdAt).toLocaleDateString() : '-'}</div>
                    <div className="text-sm text-orange-800">Last Order</div>
                  </div>
                </div>
                {/* Order History (placeholder) */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order History</h4>
                  {ordersLoading ? (
                    <div className="text-center py-4">Loading orders...</div>
                  ) : customerOrders.length === 0 ? (
                    <div className="space-y-4 text-gray-400">No order history available for this customer.</div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div key={order._id || order.orderId} className="border border-gray-100 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-semibold">Order {order.orderId}</div>
                              <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                              <div className="text-xs text-gray-700 mt-2">Items: {order.items.map(i => i.name).join(', ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">${(order.total || 0).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">{order.status}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
