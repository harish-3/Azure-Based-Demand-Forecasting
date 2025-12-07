// src/components/charts/CapacityPlanning.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const data = [
  { date: "Dec 01", forecast: 120, capacity: 150, lower: 100, upper: 140 },
  { date: "Dec 02", forecast: 130, capacity: 125, lower: 110, upper: 150 },
  { date: "Dec 03", forecast: 160, capacity: 140, lower: 130, upper: 190 },
  { date: "Dec 04", forecast: 180, capacity: 210, lower: 150, upper: 220 },
];

function getRisk(forecast, capacity) {
  const gap = capacity - forecast;
  if (gap >= 0.1 * forecast) return "Sufficient";      // green
  if (gap < -0.05 * forecast) return "Shortage risk";  // red
  return "Over / Slight risk";                         // yellow
}

export default function CapacityPlanning() {
  const rows = data.map((d) => ({
    ...d,
    gap: d.capacity - d.forecast,
    status: getRisk(d.forecast, d.capacity),
  }));

  return (
    <div className="space-y-6">
      {/* Line chart with confidence */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-100 mb-2">
          Forecasted Demand (with Confidence)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#4f46e5"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#4f46e5"
              fillOpacity={0.1}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Capacity vs forecast bar chart */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-100 mb-2">
          Capacity vs Forecast
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Bar dataKey="forecast" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk indicators table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-100 mb-3">
          Capacity Risk by Day
        </h3>
        <table className="w-full text-xs text-left">
          <thead className="text-gray-400">
            <tr>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Forecast</th>
              <th className="py-2 pr-3">Capacity</th>
              <th className="py-2 pr-3">Gap</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {rows.map((r) => (
              <tr key={r.date} className="border-t border-gray-800">
                <td className="py-2 pr-3">{r.date}</td>
                <td className="py-2 pr-3">{r.forecast}</td>
                <td className="py-2 pr-3">{r.capacity}</td>
                <td className="py-2 pr-3">{r.gap}</td>
                <td className="py-2 pr-3">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full text-[11px] " +
                      (r.status === "Sufficient"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : r.status === "Shortage risk"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-yellow-500/15 text-yellow-300")
                    }
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
