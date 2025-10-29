import React from "react";

export default function StatsCard({ title, value, icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    green: "bg-gradient-to-br from-green-500 to-green-600 text-white",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className={`mb-4 p-3 rounded-full ${colorClasses[color]}`}>
        <div className="text-2xl">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
