import React from "react";

export default function SystemUsageTable() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const cpuUsageData = [40, 55, 60, 70, 65, 75, 90]; 
  const storageUsageData = [50, 45, 60, 55, 80, 85, 70]; 

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 m-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Weekly CPU & Storage Usage
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-800 uppercase text-sm">
            <tr>
              <th className="py-3 px-4 border">Day</th>
              <th className="py-3 px-4 border">CPU Usage (%)</th>
              <th className="py-3 px-4 border">Storage Usage (%)</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((day, index) => (
              <tr
                key={day}
                className="hover:bg-blue-50 transition-colors duration-200"
              >
                <td className="py-3 px-4 border">{day}</td>
                <td className="py-3 px-4 border font-medium text-blue-600">
                  {cpuUsageData[index]}%
                </td>
                <td className="py-3 px-4 border font-medium text-green-600">
                  {storageUsageData[index]}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}