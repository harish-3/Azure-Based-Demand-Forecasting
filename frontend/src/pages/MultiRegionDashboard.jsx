import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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
  Label,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
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
  const [horizonSteps, setHorizonSteps] = useState(4);
  const [detailRegion, setDetailRegion] = useState(null);

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

  const horizonLabels = Array.from({ length: Math.min(horizonSteps, 4) }, (_, i) => `T+${i + 1}`);
  const forecastChartData = horizonLabels.map((label, idx) => {
    const point = { step: label };
    visibleRegions.forEach((r) => {
      point[r.name] = r.forecast[idx] ?? r.forecast[r.forecast.length - 1] ?? 0;
    });
    return point;
  });

  // Radar chart data comparing regions across key metrics
  const radarData = [
    Object.assign(
      { metric: "CPU (%)" },
      ...visibleRegions.map((r) => ({ [r.name]: Number(((r.cpuUsage ?? 0)).toFixed(2)) }))
    ),
    Object.assign(
      { metric: "Storage (TB)" },
      ...visibleRegions.map((r) => ({ [r.name]: Number(((r.storageUsage ?? 0)).toFixed(2)) }))
    ),
    Object.assign(
      { metric: "Forecast T+1" },
      ...visibleRegions.map((r) => {
        const v = Array.isArray(r.forecast)
          ? (r.forecast[0] ?? r.forecast[r.forecast.length - 1] ?? 0)
          : 0;
        return { [r.name]: Number(((v ?? 0)).toFixed(2)) };
      })
    ),
  ];

  const handleExport = () => {
    const header1 = ["Multi-Region Capacity Comparison"];
    const table1 = [["Region", "CPU (%)", "Storage (TB)"]].concat(
      capacityChartData.map((d) => [d.region, d.cpu, d.storage])
    );
    const header2 = ["Forecast Demand (Relative Units)"];
    const table2 = [["Step", ...visibleRegions.map((r) => r.name)]].concat(
      forecastChartData.map((row) => [row.step, ...visibleRegions.map((r) => row[r.name] ?? 0)])
    );
    const aoa = [header1, ...table1, [], header2, ...table2];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data");
    XLSX.writeFile(wb, "multi_region_dashboard.xlsx");
  };

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
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-2 rounded-full bg-[#2563eb] text-white shadow-sm hover:bg-[#1e4b9a]"
        >
          ⬇️ Export Data
        </button>
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

      <div className="mb-6 flex items-center gap-3 text-xs">
        <span className="text-[#6b6a5a] dark:text-gray-400">Forecast horizon:</span>
        {[2,3,4].map((n) => (
          <button
            key={n}
            onClick={() => setHorizonSteps(n)}
            className={`px-3 py-1 rounded-full border ${horizonSteps === n ? "bg-[#b7d2f7] border-[#b7d2f7] text-[#1f2937]" : "bg-white border-[#b7d2f7] text-[#1f2937] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"}`}
          >
            T+{n}
          </button>
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
                <YAxis stroke="#6b7280">
                  <Label value="CPU (%) / Storage (TB)" angle={-90} position="insideLeft" style={{ textAnchor: "middle", fill: "#6b7280" }} />
                </YAxis>
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

      {/* Radar comparison */}
      {visibleRegions.length > 0 && (
        <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm mb-8">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Region comparison radar
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Tooltip />
                {visibleRegions.map((r, idx) => (
                  <Radar
                    key={r.name}
                    name={r.name}
                    dataKey={r.name}
                    stroke={["#3b82f6", "#22c55e", "#f97316"][idx % 3]}
                    fill={["#3b82f6", "#22c55e", "#f97316"][idx % 3]}
                    fillOpacity={0.35}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Peak hours + recommendations */}
      {visibleRegions.length === 0 ? (
        <div className="p-6 text-sm text-[#557399] dark:text-orange-200 border border-dashed border-[#b7d2f7]/40 rounded-xl">No regions selected. Choose regions above to view comparisons.</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleRegions.map((r) => (
          <div
            key={r.name}
            className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-xs"
            onClick={() => setDetailRegion(r)}
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
      )}

      {detailRegion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetailRegion(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl w-[90%] max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{detailRegion.name} · Detailed View</h4>
              <button onClick={() => setDetailRegion(null)} className="text-sm px-3 py-1 rounded-full bg-[#b7d2f7] text-[#1f2937] dark:bg-fuchsia-600 dark:text-white">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>CPU Usage: <span className="font-semibold">{detailRegion.cpuUsage}%</span></div>
                <div>Storage Usage: <span className="font-semibold">{detailRegion.storageUsage} TB</span></div>
                <div>Peak Hours: <span className="font-semibold">{detailRegion.peakHours.join(", ")}</span></div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailRegion.forecast.map((v, i) => ({ step: `T+${i+1}`, value: v, lower: v*0.85, upper: v*1.15 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="step" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
