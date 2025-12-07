import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { fetchMultiRegion } from "../services/api";

export default function MultiRegionDashboard() {
  const [allRegions, setAllRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([
    "East US",
    "West Europe",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch multi-region data from backend
  useEffect(() => {
    const loadMultiRegionData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchMultiRegion();
        const regionsData = response.regions || [];
        setAllRegions(regionsData);
        
        // Set default selected regions if available
        if (regionsData.length > 0 && selectedRegions.length === 0) {
          setSelectedRegions(regionsData.slice(0, 2).map(r => r.name));
        }
      } catch (err) {
        console.error("Error loading multi-region data:", err);
        setError(err.message);
        // Fallback to empty array
        setAllRegions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMultiRegionData();
  }, []);

  const visibleRegions = allRegions.filter((r) =>
    selectedRegions.includes(r.name)
  );

  const handleToggleRegion = (name) => {
    setSelectedRegions((prev) =>
      prev.includes(name)
        ? prev.filter((r) => r !== name)
        : [...prev, name]
    );
  };

  const capacityChartData = visibleRegions.map((r) => ({
    region: r.name,
    cpu: r.cpuUsage,
    storage: r.storageUsage,
  }));

  const horizonLabels = ["T+1", "T+2", "T+3", "T+4"];
  const forecastChartData = horizonLabels.map((label, idx) => {
    const point = { step: label };
    visibleRegions.forEach((r) => {
      point[r.name] = r.forecast[idx];
    });
    return point;
  });

  return (
    <div className="p-8 min-h-screen bg-[#fffff0] dark:bg-gray-900">
      <h2 className="text-3xl font-extrabold mb-2 text-[#2d2a1f] dark:text-white">
        Multi‑Region Capacity Comparison
      </h2>
      <p className="text-xs md:text-sm text-[#6b6a5a] dark:text-gray-400 mb-6">
        Compare CPU, storage, forecasts, peak hours, and recommendations across regions.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          ⚠️ Error loading multi-region data: {error}. Please ensure the backend is running.
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#b7d2f7] dark:border-orange-400"></div>
          <p className="mt-4 text-[#557399] dark:text-orange-200">Loading multi-region data...</p>
        </div>
      ) : (
        <>
      {/* Region selector */}
      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        {allRegions.map((r) => (
          <label
            key={r.name}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#b7d2f7] dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer"
          >
            <input
              type="checkbox"
              className="accent-[#2563eb]"
              checked={selectedRegions.includes(r.name)}
              onChange={() => handleToggleRegion(r.name)}
            />
            <span className="font-medium text-[#1f2933] dark:text-gray-100">
              {r.name}
            </span>
          </label>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* CPU & Storage */}
        <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            CPU & Storage by region
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="cpu" name="CPU (%)" fill="#60a5fa" />
                <Bar dataKey="storage" name="Storage (TB)" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast comparison */}
        <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Forecast demand (relative units)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="step" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                {visibleRegions.map((r, idx) => (
                  <Line
                    key={r.name}
                    type="monotone"
                    dataKey={r.name}
                    stroke={["#3b82f6", "#22c55e", "#f97316"][idx % 3]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak hours + recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleRegions.map((r) => (
          <div
            key={r.name}
            className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-xs"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {r.name}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
              Peak hours: {r.peakHours.join(", ")}
            </p>
            <p className="text-[11px] font-medium text-[#1f2933] dark:text-gray-100">
              Recommendation:
            </p>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">
              {r.recommendation}
            </p>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
