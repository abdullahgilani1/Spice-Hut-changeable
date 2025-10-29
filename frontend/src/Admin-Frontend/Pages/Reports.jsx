import React from "react";
import { FiTrendingUp, FiTrendingDown, FiBarChart2, FiDownload } from "react-icons/fi";

const reportData = [
  { month: "September", orders: 85, revenue: 12340, growth: 15.2 },
  { month: "August", orders: 70, revenue: 10500, growth: 8.7 },
  { month: "July", orders: 65, revenue: 9800, growth: -2.1 },
  { month: "June", orders: 68, revenue: 10200, growth: 12.5 },
];

const topItems = [
  { name: "Margherita Pizza", orders: 45, revenue: 2250 },
  { name: "Chicken Burger", orders: 32, revenue: 1600 },
  { name: "Caesar Salad", orders: 28, revenue: 1120 },
  { name: "Pasta Carbonara", orders: 25, revenue: 1250 },
];

export default function Reports() {
  const totalOrders = reportData.reduce((sum, item) => sum + item.orders, 0);
  const totalRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
  const avgGrowth = reportData.reduce((sum, item) => sum + item.growth, 0) / reportData.length;

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 text-lg">Track your restaurant's performance and insights.</p>
        </div>
        <button className="mt-4 sm:mt-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 flex items-center">
          <FiDownload className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiBarChart2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Growth</p>
              <p className="text-3xl font-bold text-gray-900">{avgGrowth.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              {avgGrowth > 0 ? <FiTrendingUp className="w-6 h-6 text-orange-600" /> : <FiTrendingDown className="w-6 h-6 text-red-600" />}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">${(totalRevenue / totalOrders).toFixed(0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiBarChart2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Performance</h2>
          <div className="space-y-4">
            {reportData.map((item) => (
              <div key={item.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {item.month.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.month}</p>
                    <p className="text-sm text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.revenue.toLocaleString()}</p>
                  <p className={`text-sm flex items-center ${item.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.growth > 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(item.growth)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Selling Items</h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900">${item.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Monthly Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item) => (
                <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
