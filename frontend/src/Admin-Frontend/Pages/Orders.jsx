

import React, { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiEye, FiCheck, FiX, FiClock } from "react-icons/fi";
import { orderAPI } from "../../services/api";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // admin Orders page should fetch all orders (admin endpoint)
      const data = await orderAPI.getOrders();
      const mapped = (data || []).map((o) => ({
        id: o._id,
        orderId: o.orderId,
        customer: o.customerName || o.customer?.name || (o.customer?.email || '').split('@')[0],
        items: (o.items || []).map(i => i.name || i),
        total: o.total,
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString(),
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        payment: o.paymentMethod || '—',
        raw: o,
      }));
      setOrders(mapped);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders by search term
  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = (order.orderId || order.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group orders by status
  const pendingOrders = filteredOrders.filter(order => order.status === "Pending");
  const processingOrders = filteredOrders.filter(order => order.status === "Processing");
  const deliveredOrders = filteredOrders.filter(order => order.status === "Delivered");

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Processing": return "bg-blue-100 text-blue-800";
      case "Delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto text-center py-20">Loading orders...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto text-center py-20 text-red-600">{error}</div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600 text-lg">Track and manage all customer orders.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Orders</p>
              <p className="text-3xl font-bold">{pendingOrders.length}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Processing Orders</p>
              <p className="text-3xl font-bold">{processingOrders.length}</p>
            </div>
            <FiCheck className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Delivered Orders</p>
              <p className="text-3xl font-bold">{deliveredOrders.length}</p>
            </div>
            <FiCheck className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Orders ({pendingOrders.length})</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId || order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={order.items.join(", ")}>
                        {order.items.join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{order.date}</div>
                      <div className="text-xs">{order.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, "Processing")}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                          Start Processing
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pendingOrders.length === 0 && (
            <div className="text-center py-12">
              <FiClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
              <p className="mt-1 text-sm text-gray-500">All orders are being processed or delivered.</p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Orders Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">Processing Orders ({processingOrders.length})</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId || order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={order.items.join(", ")}>
                        {order.items.join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{order.date}</div>
                      <div className="text-xs">{order.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, "Delivered")}
                          className="text-green-600 hover:text-green-900 px-2 py-1 text-xs bg-green-100 rounded hover:bg-green-200 transition-colors"
                        >
                          Mark Delivered
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processingOrders.length === 0 && (
            <div className="text-center py-12">
              <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No processing orders</h3>
              <p className="mt-1 text-sm text-gray-500">No orders are currently being processed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivered Orders Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">Delivered Orders ({deliveredOrders.length})</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId || order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={order.items.join(", ")}>
                        {order.items.join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{order.date}</div>
                      <div className="text-xs">{order.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deliveredOrders.length === 0 && (
            <div className="text-center py-12">
              <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No delivered orders</h3>
              <p className="mt-1 text-sm text-gray-500">No orders have been delivered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Order ID:</span> {selectedOrder.orderId || selectedOrder.id}</p>
                  <p><span className="font-medium">Customer:</span> {selectedOrder.customer}</p>
                  <p><span className="font-medium">Date:</span> {selectedOrder.date} at {selectedOrder.time}</p>
                  <p><span className="font-medium">Payment:</span> {selectedOrder.payment}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-2 text-sm font-medium rounded-lg ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>

                  {selectedOrder.status === "Pending" && (
                    <button
                      onClick={() => { updateOrderStatus(selectedOrder.id, "Processing"); setSelectedOrder(null); }}
                      className="text-blue-600 hover:text-blue-900 px-3 py-2 text-sm bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                    >
                      Start Processing
                    </button>
                  )}

                  {selectedOrder.status === "Processing" && (
                    <button
                      onClick={() => { updateOrderStatus(selectedOrder.id, "Delivered"); setSelectedOrder(null); }}
                      className="text-green-600 hover:text-green-900 px-3 py-2 text-sm bg-green-100 rounded hover:bg-green-200 transition-colors"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">{item}</span>
                    <span className="text-sm font-medium text-gray-700">${(selectedOrder.total / (selectedOrder.items.length || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">${selectedOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
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
