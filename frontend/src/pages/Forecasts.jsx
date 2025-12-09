import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Label,
} from "recharts";
import { motion } from "framer-motion";
import { Cpu, HardDrive, Network, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import ForecastForm from "../components/ForecastForm";
import { showHighRiskAlert } from "../utils/alerts";
import { fetchForecast7, fetchCapacityPlanning, fetchOptimization, fetchWhatIf } from "../services/api";
import ForecastVisualizations from "../components/ForecastVisualizations";

function getCapacityRecommendation({ region, resource, forecastPct }) {
  let level, delta, text;
  if (forecastPct >= 85) {
    level = "High Load";
    delta = 12;
    text = `Increase ${resource} capacity by +${delta}%`;
  } else if (forecastPct <= 50) {
    level = "Low Load";
    delta = 15;
    text = `Consider reducing ${resource} capacity by -${delta}% to save cost`;
  } else {
    level = "Moderate Load";
    delta = 0;
    text = `Keep ${resource} capacity steady and monitor usage`;
  }
  return { region, resource, forecastPct, level, delta, text };
}

const generateCapacityData = () => {
  const base = 120;
  return [
    { date: "Week 1", forecast: base, capacity: base + 35, lower: base - 20, upper: base + 15 },
    { date: "Week 2", forecast: base + 15, capacity: base + 20, lower: base - 10, upper: base + 25 },
    { date: "Week 3", forecast: base + 30, capacity: base + 30, lower: base, upper: base + 35 },
    { date: "Week 4", forecast: base + 50, capacity: base + 45, lower: base + 10, upper: base + 45 },
  ];
};

function Forecasts() {
  const [filters, setFilters] = useState({ region: "", service: "", timeHorizon: "" });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeOpt, setActiveOpt] = useState(null);
  const [workloadDelta, setWorkloadDelta] = useState(0);
  const [trafficDelta, setTrafficDelta] = useState(0);
  const [visibleLines, setVisibleLines] = useState({ cpuBase: true, cpuSim: true, storageBase: true, storageSim: true });
  const [forecastData, setForecastData] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const forecastResponse = await fetchForecast7();
        const predictions = forecastResponse.predictions || forecastResponse.predictions_cpu || [];
        setForecastData(predictions);
        const capacityResponse = await fetchCapacityPlanning(10000, 7);
        setCapacityData(capacityResponse);
      } catch (err) {
        setError(err.message);
        setForecastData(Array(7).fill(0));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    if (!forecastData || forecastData.length === 0) {
      return [
        { id: "cpu", icon: <Cpu className="w-6 h-6 text-[#282828] dark:text-white" />, title: "CPU Demand", unit: "%", current: 0, forecast: Array(7).fill(0), pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }] },
        { id: "storage", icon: <HardDrive className="w-6 h-6 text-[#282828] dark:text-white" />, title: "Storage Usage", unit: "TB", current: 0, forecast: Array(7).fill(0), pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }] },
        { id: "network", icon: <Network className="w-6 h-6 text-[#282828] dark:text-white" />, title: "Network Bandwidth", unit: "Mbps", current: 0, forecast: Array(7).fill(0), pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }] },
      ];
    }
    const cpuForecast = forecastData.slice(0, 7).map((v) => Number(Number(v).toFixed(2)));
    const cpuCurrent = cpuForecast[0] || 0;
    const storageCurrent = Number((cpuCurrent * 0.01 * 2.5).toFixed(2));
    const storageForecast = cpuForecast.map((cpu) => Number((cpu * 0.01 * 2.5).toFixed(2)));
    const netCurrent = Number((cpuCurrent * 10).toFixed(2));
    const netForecast = cpuForecast.map((cpu) => Number((cpu * 10).toFixed(2)));
    return [
      { id: "cpu", icon: <Cpu className="w-6 h-6 text-[#282828] dark:text-white" />, title: "CPU Demand", unit: "%", current: cpuCurrent, forecast: cpuForecast, pie: [{ name: "Used", value: cpuCurrent }, { name: "Remaining", value: Math.max(0, 100 - cpuCurrent) }] },
      { id: "storage", icon: <HardDrive className="w-6 h-6 text-[#282828] dark:text-white" />, title: "Storage Usage", unit: "TB", current: storageCurrent, forecast: storageForecast, pie: (() => { const next = storageForecast[storageForecast.length - 1] || storageCurrent; const usedPercent = Math.round((storageCurrent / Math.max(0.1, next)) * 100); return [{ name: "Used", value: Math.min(100, usedPercent) }, { name: "Remaining", value: Math.max(0, 100 - usedPercent) }]; })() },
      { id: "network", icon: <Network className="w-6 h-6 text-[#282828] dark:text-white" />, title: "Network Bandwidth", unit: "Mbps", current: netCurrent, forecast: netForecast, pie: (() => { const next = netForecast[netForecast.length - 1] || netCurrent; const usedPercent = Math.round((netCurrent / Math.max(1, next)) * 100); return [{ name: "Used", value: Math.min(100, usedPercent) }, { name: "Remaining", value: Math.max(0, 100 - usedPercent) }]; })() },
    ];
  }, [forecastData]);

  useEffect(() => { setCurrentSlide(0); }, [filters]);

  const filteredMetrics = useMemo(() => {
    if (!filters.service) return metrics;
    return metrics.filter((m) => (filters.service === "Compute" ? m.id === "cpu" : filters.service === "Storage" ? m.id === "storage" : m.id));
  }, [metrics, filters.service]);

  useEffect(() => { setCurrentSlide((s) => Math.min(s, filteredMetrics.length - 1)); }, [filteredMetrics.length]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % filteredMetrics.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + filteredMetrics.length) % filteredMetrics.length);

  const COLORS = ["#99bde7", "#ebedf0"];
  const makeLineData = (forecast) => forecast.map((v, i) => ({ name: `Week ${i + 1}`, value: v }));

  const getRisk = (forecast, capacity) => {
    const gap = capacity - forecast;
    if (gap >= 0.1 * forecast) return "Sufficient";
    if (gap < -0.05 * forecast) return "Shortage";
    return "Over / Slight risk";
  };

  const capacityRows = useMemo(() => {
    if (!capacityData || !forecastData) {
      const fallback = generateCapacityData();
      return fallback.map((d) => ({ ...d, gap: d.capacity - d.forecast, status: getRisk(d.forecast, d.capacity), band: Math.round(d.forecast * 0.3) }));
    }
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const capacity = capacityData.capacity || 10000;
    const avgForecast = capacityData.avg_forecast || 0;
    return weeks.map((week, idx) => {
      const forecast = forecastData[idx] || avgForecast;
      const weekCapacity = capacity + idx * 100;
      return { date: week, forecast: Number(forecast.toFixed(2)), capacity: weekCapacity, lower: Number((forecast * 0.85).toFixed(2)), upper: Number((forecast * 1.15).toFixed(2)), band: Number((forecast * 0.3).toFixed(2)), gap: Number((weekCapacity - forecast).toFixed(2)), status: getRisk(forecast, weekCapacity) };
    });
  }, [capacityData, forecastData]);

  const region = filters.region || "East-US";
  const [optimizationData, setOptimizationData] = useState(null);
  useEffect(() => {
    const loadOpt = async () => {
      if (!forecastData || forecastData.length === 0) return;
      try {
        const avgForecast = forecastData.reduce((a, b) => a + b, 0) / forecastData.length;
        const capacity = Math.round(avgForecast * 100);
        const response = await fetchOptimization(capacity, 7, region);
        setOptimizationData(response);
      } catch {}
    };
    loadOpt();
  }, [forecastData, region]);

  const recommendations = useMemo(() => {
    if (optimizationData && optimizationData.recommendation) {
      return metrics.map((m) => {
        const forecastArr = Array.isArray(m.forecast) ? m.forecast : [];
        const nextCycle = forecastArr[forecastArr.length - 1] ?? m.current;
        const forecastPct = m.unit === "%" ? nextCycle : Math.min(100, Math.round(nextCycle));
        return { region, resource: m.title, forecastPct, level: optimizationData.status || "Moderate Load", delta: optimizationData.suggested_change || 0, text: optimizationData.recommendation || "Monitor usage" };
      });
    }
    return metrics.map((m) => {
      const forecastArr = Array.isArray(m.forecast) ? m.forecast : [];
      const nextCycle = forecastArr[forecastArr.length - 1] ?? m.current;
      const forecastPct = m.unit === "%" ? nextCycle : Math.min(100, Math.round(nextCycle));
      return getCapacityRecommendation({ region, resource: m.title, forecastPct });
    });
  }, [metrics, region, optimizationData]);

  const [whatIfBackend, setWhatIfBackend] = useState(null);
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchWhatIf(workloadDelta, trafficDelta);
        setWhatIfBackend(res);
      } catch {}
    };
    run();
  }, [workloadDelta, trafficDelta]);

  const whatIfResults = useMemo(() => {
    const cpuMetric = metrics.find((m) => m.id === "cpu");
    const storageMetric = metrics.find((m) => m.id === "storage");
    if (!cpuMetric || !storageMetric) return null;
    const baseCpu = cpuMetric.forecast?.[cpuMetric.forecast.length - 1] ?? cpuMetric.current;
    const baseStorage = storageMetric.forecast?.[storageMetric.forecast.length - 1] ?? storageMetric.current;
    const cpuFactor = 1 + workloadDelta / 100;
    const storageFactor = 1 + trafficDelta / 100;
    const simulatedCpu = Number((baseCpu * cpuFactor).toFixed(2));
    const simulatedStorage = Number((baseStorage * storageFactor).toFixed(2));
    const beSimCpu = whatIfBackend?.simulated_cpu?.[whatIfBackend.simulated_cpu.length - 1];
    const beSimStorage = whatIfBackend?.simulated_storage?.[whatIfBackend.simulated_storage.length - 1];
    return { baseCpu, baseStorage, simulatedCpu: beSimCpu ?? simulatedCpu, simulatedStorage: beSimStorage ?? simulatedStorage };
  }, [metrics, workloadDelta, trafficDelta, whatIfBackend]);

  const whatIfCombinedSeries = useMemo(() => {
    const baseCpuArr = Array.isArray(whatIfBackend?.base_cpu) ? whatIfBackend.base_cpu : [];
    const simCpuArr = Array.isArray(whatIfBackend?.simulated_cpu) ? whatIfBackend.simulated_cpu : [];
    const baseStorArr = Array.isArray(whatIfBackend?.base_storage) ? whatIfBackend.base_storage : [];
    const simStorArr = Array.isArray(whatIfBackend?.simulated_storage) ? whatIfBackend.simulated_storage : [];
    const n = Math.min(baseCpuArr.length, baseStorArr.length);
    return Array.from({ length: n }, (_, i) => ({
      name: `Day ${i + 1}`,
      baseCpu: Number((baseCpuArr[i] ?? 0).toFixed(2)),
      simCpu: Number(((simCpuArr[i] ?? baseCpuArr[i] ?? 0)).toFixed(2)),
      baseStorage: Number((baseStorArr[i] ?? 0).toFixed(2)),
      simStorage: Number(((simStorArr[i] ?? baseStorArr[i] ?? 0)).toFixed(2)),
    }));
  }, [whatIfBackend]);

  const capacityRequirement = useMemo(() => {
    const bc = Array.isArray(whatIfBackend?.base_cpu) ? whatIfBackend.base_cpu : [];
    const sc = Array.isArray(whatIfBackend?.simulated_cpu) ? whatIfBackend.simulated_cpu : [];
    const bs = Array.isArray(whatIfBackend?.base_storage) ? whatIfBackend.base_storage : [];
    const ss = Array.isArray(whatIfBackend?.simulated_storage) ? whatIfBackend.simulated_storage : [];
    if (bc.length === 0 || bs.length === 0) return null;
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const baseCpuAvg = avg(bc);
    const simCpuAvg = avg(sc.length ? sc : bc);
    const baseStorAvg = avg(bs);
    const simStorAvg = avg(ss.length ? ss : bs);
    const cpuDelta = Math.round(((simCpuAvg - baseCpuAvg) / Math.max(1, baseCpuAvg)) * 100);
    const storDelta = Number(((simStorAvg - baseStorAvg) / Math.max(0.0001, baseStorAvg)) * 100).toFixed(1);
    const baseCapacity = capacityData?.capacity || 10000;
    const recommendedCapacity = Math.round(baseCapacity * (simCpuAvg / Math.max(1, baseCpuAvg)));
    const action = cpuDelta >= 5 ? "Increase" : cpuDelta <= -5 ? "Reduce" : "Keep steady";
    return { baseCpuAvg, simCpuAvg, cpuDelta, baseStorAvg, simStorAvg, storDelta, baseCapacity, recommendedCapacity, action };
  }, [whatIfBackend, capacityData]);

  useEffect(() => {
    const week4 = capacityRows.find((r) => r.date === "Week 4");
    if (week4 && week4.status === "Shortage") {
      showHighRiskAlert({ resource: "Capacity (Week 4)", usage: week4.forecast, threshold: week4.capacity });
    }
    const cpuMetric = metrics.find((m) => m.id === "cpu");
    if (cpuMetric && Array.isArray(cpuMetric.forecast)) {
      const nextWeekCpu = cpuMetric.forecast[cpuMetric.forecast.length - 1];
      const cpuThreshold = 80;
      if (nextWeekCpu > cpuThreshold) {
        showHighRiskAlert({ resource: "CPU (next week)", usage: nextWeekCpu, threshold: cpuThreshold });
      }
    }
  }, [capacityRows, metrics]);

  const activeMetric = filteredMetrics[currentSlide];

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen bg-[#fffff0] dark:bg-gray-900">
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          ⚠️ Error loading forecast data: {error}. Please ensure the backend is running.
        </div>
      )}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#b7d2f7] dark:border-orange-400"></div>
          <p className="mt-4 text-[#557399] dark:text-orange-200">Loading forecast data...</p>
        </div>
      )}

      <ForecastForm onSubmit={(nf) => setFilters(nf)} />

      <div className="my-8 border-t border-[#b7d2f7]/30" />

      <motion.h1 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-extrabold text-center mb-3 text-[#282828] dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-fuchsia-600 dark:to-orange-400">
        Azure Demand Forecasting
      </motion.h1>

      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#557399] dark:text-orange-100">
          <span className="px-2.5 py-1 rounded-full bg-[#e0f3fa] dark:bg-fuchsia-800/60 font-medium">
            Active view: {filters.region || "All regions"} · {filters.service || "All services"} · {filters.timeHorizon || "Default horizon"}
          </span>
          <span className="opacity-80">7-week predictive outlook · updated when filters change</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {filteredMetrics.length > 0 ? (
            <ForecastCard metric={activeMetric} COLORS={COLORS} makeLineData={makeLineData} />
          ) : (
            <div className="p-10 text-center text-[#557399]">No forecasts available for selected options.</div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button onClick={prevSlide} className="px-4 py-2 rounded-lg bg-[#e0f3fa] dark:bg-fuchsia-800 hover:bg-[#afd8fa] dark:hover:bg-fuchsia-700 text-[#225577] dark:text-orange-200 shadow-sm transition">← Previous</button>
            <div className="text-sm text-[#557399] dark:text-orange-300 font-medium">{filteredMetrics.length === 0 ? 0 : currentSlide + 1} / {filteredMetrics.length}</div>
            <button onClick={nextSlide} className="px-4 py-2 rounded-lg bg-[#b7d2f7] text-[#2d2a1f] dark:bg-fuchsia-600 dark:text-white hover:bg-[#99bde7] shadow-md transition">Next →</button>
          </div>
        </div>

        <div className="mt-14 space-y-6">
          <h3 className="text-2xl font-semibold text-[#2d2a1f] dark:text-orange-300">Capacity Planning</h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Forecasted Demand (with Confidence)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={capacityRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ReTooltip />
                  <Area type="monotone" dataKey="lower" stackId="1" stroke="none" fill="transparent" />
                  <Area type="monotone" dataKey="band" stackId="1" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                  <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Capacity vs Forecast</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={capacityRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ReTooltip />
                  <ReLegend />
                  <Bar dataKey="forecast" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Capacity Risk by Week</h4>
            <table className="w-full text-xs text-left">
              <thead className="text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-3">Week</th>
                  <th className="py-2 pr-3">Forecast</th>
                  <th className="py-2 pr-3">Capacity</th>
                  <th className="py-2 pr-3">Gap</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                {capacityRows.map((r) => (
                  <tr key={r.date} className="border-t border-[#e5e7eb] dark:border-gray-800">
                    <td className="py-2 pr-3">{r.date}</td>
                    <td className="py-2 pr-3">{r.forecast}</td>
                    <td className="py-2 pr-3">{r.capacity}</td>
                    <td className="py-2 pr-3">{r.gap}</td>
                    <td className="py-2 pr-3">
                      <span className={"px-2 py-0.5 rounded-full text-[11px] " + (r.status === "Sufficient" ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : r.status === "Shortage" ? "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300")}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <h3 className="text-2xl font-semibold text-[#2d2a1f] dark:text-orange-300">What‑If Simulator</h3>
          <p className="text-[12px] text-[#557399] dark:text-orange-200">Adjust workload and traffic to simulate future CPU and storage requirements.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Workload Delta (%)</span>
                <span className="text-sm font-semibold text-[#2d2a1f] dark:text-white">{workloadDelta > 0 ? "+" : ""}{workloadDelta}%</span>
              </div>
              <input type="range" min="-30" max="50" value={workloadDelta} onChange={(e) => setWorkloadDelta(Number(e.target.value))} className="w-full" />
              {whatIfResults && (
                <div className="mt-3 text-xs text-[#557399] dark:text-orange-200">
                  Base CPU: <span className="font-semibold text-[#2d2a1f] dark:text-white">{Number(whatIfResults.baseCpu).toFixed(2)}</span> · Simulated: <span className="font-semibold text-[#2d2a1f] dark:text-white">{Number(whatIfResults.simulatedCpu).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Traffic Delta (%)</span>
                <span className="text-sm font-semibold text-[#2d2a1f] dark:text-white">{trafficDelta > 0 ? "+" : ""}{trafficDelta}%</span>
              </div>
              <input type="range" min="-30" max="50" value={trafficDelta} onChange={(e) => setTrafficDelta(Number(e.target.value))} className="w-full" />
              {whatIfResults && (
                <div className="mt-3 text-xs text-[#557399] dark:text-orange-200">
                  Base Storage: <span className="font-semibold text-[#2d2a1f] dark:text-white">{Number(whatIfResults.baseStorage).toFixed(2)}</span> · Simulated: <span className="font-semibold text-[#2d2a1f] dark:text-white">{Number(whatIfResults.simulatedStorage).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">CPU & Storage: Base vs Simulated</h4>
            <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={visibleLines.cpuBase} onChange={() => setVisibleLines((p) => ({ ...p, cpuBase: !p.cpuBase }))} className="accent-[#2563eb]" />
                <span className="text-gray-700 dark:text-gray-300">CPU Base</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={visibleLines.cpuSim} onChange={() => setVisibleLines((p) => ({ ...p, cpuSim: !p.cpuSim }))} className="accent-[#f97316]" />
                <span className="text-gray-700 dark:text-gray-300">CPU Simulated</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={visibleLines.storageBase} onChange={() => setVisibleLines((p) => ({ ...p, storageBase: !p.storageBase }))} className="accent-[#60a5fa]" />
                <span className="text-gray-700 dark:text-gray-300">Storage Base</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={visibleLines.storageSim} onChange={() => setVisibleLines((p) => ({ ...p, storageSim: !p.storageSim }))} className="accent-[#22c55e]" />
                <span className="text-gray-700 dark:text-gray-300">Storage Simulated</span>
              </label>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={whatIfCombinedSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280">
                    <Label value="CPU (%)" angle={-90} position="insideLeft" style={{ textAnchor: "middle", fill: "#6b7280" }} />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280">
                    <Label value="Storage (TB)" angle={-90} position="insideRight" style={{ textAnchor: "middle", fill: "#6b7280" }} />
                  </YAxis>
                  <ReTooltip />
                  <ReLegend />
                  {visibleLines.cpuBase && (<Line yAxisId="left" type="monotone" dataKey="baseCpu" name="CPU Base" stroke="#94a3b8" strokeWidth={3} dot={{ r: 3 }} />)}
                  {visibleLines.cpuSim && (<Line yAxisId="left" type="monotone" dataKey="simCpu" name="CPU Simulated" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />)}
                  {visibleLines.storageBase && (<Line yAxisId="right" type="monotone" dataKey="baseStorage" name="Storage Base" stroke="#60a5fa" strokeWidth={3} dot={{ r: 3 }} />)}
                  {visibleLines.storageSim && (<Line yAxisId="right" type="monotone" dataKey="simStorage" name="Storage Simulated" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {capacityRequirement && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">CPU Avg</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Base: {Number(capacityRequirement.baseCpuAvg).toFixed(2)}%</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Simulated: {Number(capacityRequirement.simCpuAvg).toFixed(2)}% <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${capacityRequirement.cpuDelta >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>{capacityRequirement.cpuDelta >= 0 ? "+" : ""}{capacityRequirement.cpuDelta}%</span></div>
              </div>
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Storage Avg</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Base: {Number(capacityRequirement.baseStorAvg).toFixed(2)} TB</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Simulated: {Number(capacityRequirement.simStorAvg).toFixed(2)} TB <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${parseFloat(capacityRequirement.storDelta) >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>{parseFloat(capacityRequirement.storDelta) >= 0 ? "+" : ""}{capacityRequirement.storDelta}%</span></div>
              </div>
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Recommended Capacity</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Current: {capacityRequirement.baseCapacity}</div>
                <div className="text-xs text-[#557399] dark:text-orange-200">Suggested: <span className="font-semibold text-[#2d2a1f] dark:text-white">{capacityRequirement.recommendedCapacity}</span> <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${capacityRequirement.action === "Increase" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : capacityRequirement.action === "Reduce" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"}`}>{capacityRequirement.action}</span></div>
              </div>
            </div>
          )}
        </div>

        <ForecastVisualizations />
      </div>
    </div>
  );
}

function ForecastCard({ metric: m, COLORS, makeLineData }) {
  if (!m) return null;
  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 180, damping: 18 }} className="rounded-3xl px-10 py-9 shadow-2xl border border-[#c5d7f3] bg-gradient-to-br from-[#f7f9fc] via-[#f1f3f8] to-[#ececec] dark:bg-gradient-to-br dark:from-gray-900 dark:via-fuchsia-800 dark:to-orange-500 dark:border-none backdrop-blur-md flex flex-col justify-center items-center">
      <div className="flex flex-col items-center mb-2">
        <div className="w-16 h-16 rounded-xl bg-[#e0f3fa] dark:bg-black/40 flex items-center justify-center mb-2 shadow-md shadow-[#b7d2f7]/40">{m.icon}</div>
        <h2 className="text-3xl font-bold mb-1 text-[#222] dark:text-white">{m.title}</h2>
        <div className="text-sm font-light text-[#557399] dark:text-orange-50 mb-1">7-week forecast overview</div>
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-start w-full gap-8 justify-between">
        <div className="flex flex-col items-center">
          <PieChart width={120} height={120} style={{ marginBottom: 10 }}>
            <Pie data={m.pie} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={6} dataKey="value" labelLine={false} label={({ percent }) => (percent > 0.15 ? `${Math.round(percent * 100)}%` : "")}>
              {m.pie.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
          <div className="flex items-center gap-2 mt-3 mb-2">
            {m.forecast[m.forecast.length - 1] >= m.current ? (
              <ArrowUpCircle className="w-5 h-5 text-[#b7d2f7] dark:text-orange-200" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-[#aca899] dark:text-fuchsia-200" />
            )}
            <span className="text-sm font-medium text-[#282828] dark:text-white">Current</span>
          </div>
          <div className="text-2xl font-extrabold text-[#282828] dark:text-white">{m.current} <span className="text-lg">{m.unit}</span></div>
        </div>
        <div className="flex-1 bg-white/80 dark:bg-black/30 rounded-xl p-6 backdrop-blur-sm shadow-lg mt-6 md:mt-0">
          <div className="h-44 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={makeLineData(m.forecast)}>
                <defs>
                  <linearGradient id={`grad-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b7d2f7" stopOpacity={0.9} />
                    <stop offset="80%" stopColor="#f97316" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#557399", fontWeight: 600, fontSize: 11 }} />
                <YAxis tick={{ fill: "#557399", fontWeight: 600, fontSize: 11 }} />
                <ReTooltip contentStyle={{ background: "#eef3f8", borderRadius: 10, border: "1px solid #c5d7f3", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)", padding: "8px 10px" }} labelStyle={{ color: "#1f2933", fontWeight: 600 }} itemStyle={{ fontSize: 12 }} />
                <ReLegend verticalAlign="bottom" height={18} wrapperStyle={{ color: "#4b5563", fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke={`url(#grad-${m.id})`} strokeWidth={4} dot={{ r: 4, stroke: "#e0f3fa", fill: "#b7d2f7" }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-[#557399]/90 dark:text-orange-50/90">7-week projection · hover points for exact values</div>
            <div className="font-bold text-lg text-[#2d2a1f] dark:text-white drop-shadow">
              {Array.isArray(m.forecast) ? `${m.forecast[m.forecast.length - 1]} ${m.unit}` : `- ${m.unit}`}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default Forecasts;
