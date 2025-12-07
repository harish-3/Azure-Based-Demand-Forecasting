import React, { useMemo, useState, useEffect } from "react";
import ForecastVisualizations from "../components/ForecastVisualizations";
import { fetchForecast7, fetchCapacityPlanning, fetchOptimization } from "../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Cpu,
  HardDrive,
  Network,
} from "lucide-react";
import ForecastForm from "../components/ForecastForm";
import { showHighRiskAlert } from "../App";

// ---- Simple rule-based recommendation helper ----
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

  return {
    region,
    resource,
    forecastPct,
    level,
    delta,
    text,
  };
}

// capacity planning random data generator
const generateCapacityData = () => {
  const base = 120;
  return [
    {
      date: "Week 1",
      forecast: base,
      capacity: base + 30 + Math.round(Math.random() * 10),
      lower: base - 20,
      upper: base + 15,
    },
    {
      date: "Week 2",
      forecast: base + 15,
      capacity: base + 10 + Math.round(Math.random() * 10),
      lower: base - 10,
      upper: base + 25,
    },
    {
      date: "Week 3",
      forecast: base + 30,
      capacity: base + 20 + Math.round(Math.random() * 10),
      lower: base,
      upper: base + 35,
    },
    {
      date: "Week 4",
      forecast: base + 50,
      capacity: base + 35 + Math.round(Math.random() * 10),
      lower: base + 10,
      upper: base + 45,
    },
  ];
};

export default function Forecasts() {
  const [filters, setFilters] = useState({
    region: "",
    service: "",
    timeHorizon: "",
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeOpt, setActiveOpt] = useState(null);

  const [workloadDelta, setWorkloadDelta] = useState(0); // -50 to +50
  const [trafficDelta, setTrafficDelta] = useState(0);   // -50 to +50

  const [forecastData, setForecastData] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch forecast data from backend
  useEffect(() => {
    const loadForecastData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch 7-day forecast
        const forecastResponse = await fetchForecast7();
        const predictions = forecastResponse.predictions || [];
        
        setForecastData(predictions);

        // Fetch capacity planning data
        const capacityResponse = await fetchCapacityPlanning(10000, 7);
        setCapacityData(capacityResponse);
      } catch (err) {
        console.error("Error loading forecast data:", err);
        setError(err.message);
        // Set fallback data
        setForecastData(Array(7).fill(0));
      } finally {
        setIsLoading(false);
      }
    };

    loadForecastData();
  }, []);

  const metrics = useMemo(() => {
    if (!forecastData || forecastData.length === 0) {
      // Return empty metrics if no data
      return [
        {
          id: "cpu",
          icon: <Cpu className="w-6 h-6 text-[#282828] dark:text-white" />,
          title: "CPU Demand",
          unit: "%",
          current: 0,
          forecast: Array(7).fill(0),
          pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }],
        },
        {
          id: "storage",
          icon: <HardDrive className="w-6 h-6 text-[#282828] dark:text-white" />,
          title: "Storage Usage",
          unit: "TB",
          current: 0,
          forecast: Array(7).fill(0),
          pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }],
        },
        {
          id: "network",
          icon: <Network className="w-6 h-6 text-[#282828] dark:text-white" />,
          title: "Network Bandwidth",
          unit: "Mbps",
          current: 0,
          forecast: Array(7).fill(0),
          pie: [{ name: "Used", value: 0 }, { name: "Remaining", value: 100 }],
        },
      ];
    }

    // Use real forecast data
    const cpuForecast = forecastData.slice(0, 7).map(v => Math.round(v));
    const cpuCurrent = cpuForecast[0] || 0;

    // Storage estimated as 85% of CPU, converted to TB
    const storageCurrent = Number((cpuCurrent * 0.01 * 2.5).toFixed(2));
    const storageForecast = cpuForecast.map(cpu => 
      Number((cpu * 0.01 * 2.5).toFixed(2))
    );

    // Network estimated from CPU (scaled)
    const netCurrent = Math.round(cpuCurrent * 10);
    const netForecast = cpuForecast.map(cpu => Math.round(cpu * 10));

    return [
      {
        id: "cpu",
        icon: <Cpu className="w-6 h-6 text-[#282828] dark:text-white" />,
        title: "CPU Demand",
        unit: "%",
        current: cpuCurrent,
        forecast: cpuForecast,
        pie: [
          { name: "Used", value: cpuCurrent },
          { name: "Remaining", value: Math.max(0, 100 - cpuCurrent) },
        ],
      },
      {
        id: "storage",
        icon: (
          <HardDrive className="w-6 h-6 text-[#282828] dark:text-white" />
        ),
        title: "Storage Usage",
        unit: "TB",
        current: storageCurrent,
        forecast: storageForecast,
        pie: (() => {
          const next = storageForecast[storageForecast.length - 1] || storageCurrent;
          const usedPercent = Math.round((storageCurrent / Math.max(0.1, next)) * 100);
          return [
            { name: "Used", value: Math.min(100, usedPercent) },
            { name: "Remaining", value: Math.max(0, 100 - usedPercent) },
          ];
        })(),
      },
      {
        id: "network",
        icon: (
          <Network className="w-6 h-6 text-[#282828] dark:text-white" />
        ),
        title: "Network Bandwidth",
        unit: "Mbps",
        current: netCurrent,
        forecast: netForecast,
        pie: (() => {
          const next = netForecast[netForecast.length - 1] || netCurrent;
          const usedPercent = Math.round((netCurrent / Math.max(1, next)) * 100);
          return [
            { name: "Used", value: Math.min(100, usedPercent) },
            { name: "Remaining", value: Math.max(0, 100 - usedPercent) },
          ];
        })(),
      },
    ];
  }, [forecastData]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [filters]);

  const filteredMetrics = useMemo(() => {
    if (!filters.service) return metrics;
    return metrics.filter((m) =>
      filters.service === "Compute"
        ? m.id === "cpu"
        : filters.service === "Storage"
        ? m.id === "storage"
        : m.id
    );
  }, [metrics, filters.service]);

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, filteredMetrics.length - 1));
  }, [filteredMetrics.length]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const nextSlide = () =>
    setCurrentSlide((p) => (p + 1) % filteredMetrics.length);
  const prevSlide = () =>
    setCurrentSlide((p) => (p - 1 + filteredMetrics.length) % filteredMetrics.length);

  const optimizations = [
    {
      id: "opt-cpu",
      title: "Auto-scale CPU",
      description:
        "Enable auto-scaling for east-region CPU clusters during predicted peak weeks. Configure conservative cooldown and step scaling policies.",
      impact: "High",
      metric: "cpu",
      date: "2025-11-01",
    },
    {
      id: "opt-storage",
      title: "Storage Rightsizing",
      description:
        "Reclaim unused storage, identify cold data and migrate to cheaper tiers (Archive/Blob Cool). Run lifecycle policies weekly.",
      impact: "Medium",
      metric: "storage",
      date: "2025-10-18",
    },
    {
      id: "opt-network",
      title: "Network QoS Tuning",
      description:
        "Adjust QoS rules to prioritize critical traffic, apply burst controls on non-critical flows and reduce latency spikes.",
      impact: "Low",
      metric: "network",
      date: "2025-10-10",
    },
  ];

  const COLORS = ["#99bde7", "#ebedf0"];
  const makeLineData = (forecast) =>
    forecast.map((v, i) => ({ name: `Week ${i + 1}`, value: v }));

  const slideVariants = {
    hidden: { opacity: 0, x: 80, scale: 0.98 },
    enter: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: -80,
      scale: 0.98,
      transition: { duration: 0.6, ease: "easeIn" },
    },
  };

  const timelineItemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.12 * i, duration: 0.45 },
    }),
  };

  const activeMetric = filteredMetrics[currentSlide];

  // Capacity Planning data is now fetched from backend in the useEffect above

  const getRisk = (forecast, capacity) => {
    const gap = capacity - forecast;
    if (gap >= 0.1 * forecast) return "Sufficient"; // green
    if (gap < -0.05 * forecast) return "Shortage";  // red
    return "Over / Slight risk";                    // yellow
  };

  // Generate capacity planning rows from backend data or fallback
  const capacityRows = useMemo(() => {
    if (!capacityData || !forecastData) {
      // Fallback to generated data if backend data not available
      const fallbackData = generateCapacityData();
      return fallbackData.map((d) => ({
        ...d,
        gap: d.capacity - d.forecast,
        status: getRisk(d.forecast, d.capacity),
      }));
    }

    // Use backend forecast data for capacity planning
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const capacity = capacityData.capacity || 10000;
    const avgForecast = capacityData.avg_forecast || 0;
    
    return weeks.map((week, idx) => {
      const forecast = forecastData[idx] || avgForecast;
      const weekCapacity = capacity + (idx * 100); // Simulate capacity changes
      return {
        date: week,
        forecast: Math.round(forecast),
        capacity: weekCapacity,
        lower: Math.round(forecast * 0.85),
        upper: Math.round(forecast * 1.15),
        gap: weekCapacity - forecast,
        status: getRisk(forecast, weekCapacity),
      };
    });
  }, [capacityData, forecastData]);
  // ------------------------------------------------

  // ---- Auto recommendations from backend ----
  const region = filters.region || "East-US";
  const [optimizationData, setOptimizationData] = useState(null);

  useEffect(() => {
    const loadOptimization = async () => {
      if (!forecastData || forecastData.length === 0) return;
      
      try {
        const avgForecast = forecastData.reduce((a, b) => a + b, 0) / forecastData.length;
        const capacity = Math.round(avgForecast * 100); // Estimate capacity from forecast
        const response = await fetchOptimization(capacity, 7, region);
        setOptimizationData(response);
      } catch (err) {
        console.error("Error loading optimization data:", err);
      }
    };

    loadOptimization();
  }, [forecastData, region]);

  const recommendations = useMemo(() => {
    // Use backend optimization if available, otherwise fallback to rule-based
    if (optimizationData && optimizationData.recommendation) {
      return metrics.map((m) => {
        const forecastArr = Array.isArray(m.forecast) ? m.forecast : [];
        const nextCycle = forecastArr[forecastArr.length - 1] ?? m.current;
        const forecastPct = m.unit === "%" ? nextCycle : Math.min(100, Math.round(nextCycle));

        return {
          region,
          resource: m.title,
          forecastPct,
          level: optimizationData.status || "Moderate Load",
          delta: optimizationData.suggested_change || 0,
          text: optimizationData.recommendation || "Monitor usage",
        };
      });
    }

    // Fallback to rule-based recommendations
    return metrics.map((m) => {
      const forecastArr = Array.isArray(m.forecast) ? m.forecast : [];
      const nextCycle = forecastArr[forecastArr.length - 1] ?? m.current;
      const forecastPct = m.unit === "%" ? nextCycle : Math.min(100, Math.round(nextCycle));

      return getCapacityRecommendation({
        region,
        resource: m.title,
        forecastPct,
      });
    });
  }, [metrics, region, optimizationData]);
  // --------------------------------------------------

  // ---- What-If simulated impact (frontend-only) ----
  const whatIfResults = useMemo(() => {
    const cpuMetric = metrics.find((m) => m.id === "cpu");
    const storageMetric = metrics.find((m) => m.id === "storage");

    if (!cpuMetric || !storageMetric) return null;

    const baseCpu =
      cpuMetric.forecast?.[cpuMetric.forecast.length - 1] ?? cpuMetric.current;
    const baseStorage =
      storageMetric.forecast?.[storageMetric.forecast.length - 1] ??
      storageMetric.current;

    const cpuFactor = 1 + workloadDelta / 100;
    const storageFactor = 1 + trafficDelta / 100;

    const simulatedCpu = Math.round(baseCpu * cpuFactor);
    const simulatedStorage = Number((baseStorage * storageFactor).toFixed(2));

    return { baseCpu, baseStorage, simulatedCpu, simulatedStorage };
  }, [metrics, workloadDelta, trafficDelta]);
  // --------------------------------------------------

  // --------- PREDICTION ALERT (toast) -------------
  useEffect(() => {
    const week4 = capacityRows.find((r) => r.date === "Week 4");
    if (week4 && week4.status === "Shortage") {
      showHighRiskAlert({
        resource: "Capacity (Week 4)",
        usage: week4.forecast,
        threshold: week4.capacity,
      });
    }

    const cpuMetric = metrics.find((m) => m.id === "cpu");
    if (cpuMetric && Array.isArray(cpuMetric.forecast)) {
      const nextWeekCpu = cpuMetric.forecast[cpuMetric.forecast.length - 1];
      const cpuThreshold = 80;
      if (nextWeekCpu > cpuThreshold) {
        showHighRiskAlert({
          resource: "CPU (next week)",
          usage: nextWeekCpu,
          threshold: cpuThreshold,
        });
      }
    }
  }, [capacityRows, metrics]);
  // -----------------------------------------------

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen bg-[#fffff0] dark:bg-gray-900 transition-colors duration-500">
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
      <ForecastForm onSubmit={handleApplyFilters} />

      <div className="my-8 border-t border-[#b7d2f7]/30" />

      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-extrabold text-center mb-3 text-[#282828] dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-fuchsia-600 dark:to-orange-400"
      >
        Azure Demand Forecasting
      </motion.h1>

      {/* Context bar */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#557399] dark:text-orange-100">
          <span className="px-2.5 py-1 rounded-full bg-[#e0f3fa] dark:bg-fuchsia-800/60 font-medium">
            Active view: {filters.region || "All regions"} ·{" "}
            {filters.service || "All services"} ·{" "}
            {filters.timeHorizon || "Default horizon"}
          </span>
          <span className="opacity-80">
            7-week predictive outlook · updated when filters change
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={filteredMetrics[currentSlide]?.id ?? "none"}
              variants={slideVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="w-full"
            >
              {filteredMetrics.length > 0 ? (
                <ForecastCard
                  metric={activeMetric}
                  COLORS={COLORS}
                  makeLineData={makeLineData}
                />
              ) : (
                <div className="p-10 text-center text-[#557399]">
                  No forecasts available for selected options.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevSlide}
              className="px-4 py-2 rounded-lg bg-[#e0f3fa] dark:bg-fuchsia-800 hover:bg-[#afd8fa] dark:hover:bg-fuchsia-700 text-[#225577] dark:text-orange-200 shadow-sm transition"
            >
              ← Previous
            </button>
            <div className="text-sm text-[#557399] dark:text-orange-300 font-medium">
              {filteredMetrics.length === 0 ? 0 : currentSlide + 1} /{" "}
              {filteredMetrics.length}
            </div>
            <button
              onClick={nextSlide}
              className="px-4 py-2 rounded-lg bg-[#b7d2f7] text-[#2d2a1f] dark:bg-fuchsia-600 dark:text-white hover:bg-[#99bde7] shadow-md transition"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold mb-6 text-[#2d2a1f] dark:text-orange-300">
            Optimization Insights
          </h3>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#b7d2f7] dark:bg-fuchsia-700 rounded" />
            <ul className="space-y-8">
              {optimizations.map((opt, i) => {
                const active = activeMetric?.id === opt.metric;
                const expanded = activeOpt === opt.id;
                return (
                  <motion.li
                    key={opt.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={timelineItemVariants}
                    className="relative"
                  >
                    <div
                      className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${
                        active
                          ? "bg-[#b7d2f7] border-[#afd8fa]"
                          : "bg-white dark:bg-[#dbeafe] border-[#b7d2f7] dark:border-fuchsia-600"
                      }`}
                    />
                    <div
                      className={`pl-6 py-4 pr-4 rounded-xl shadow-sm transition-all cursor-pointer ${
                        active
                          ? "bg-white dark:bg-orange-900 ring-1 ring-[#b7d2f7]/50"
                          : "bg-[#f7f7f5]/80 dark:bg-fuchsia-900/60"
                      }`}
                      onClick={() =>
                        setActiveOpt(expanded ? null : opt.id)
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-[#225577] dark:text-orange-200">
                            {opt.title}
                          </h4>
                          <div className="text-xs text-[#557399] mt-1">
                            {opt.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              opt.impact === "High"
                                ? "bg-blue-100 text-blue-700 dark:bg-red-900/30 dark:text-red-300"
                                : opt.impact === "Medium"
                                ? "bg-slate-100 text-slate-900 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            {opt.impact}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 pr-4 pt-3 pb-4 mt-0.5 mb-0 rounded-xl bg-[#fafdff] dark:bg-fuchsia-900/50 border border-[#d2e0ed] dark:border-fuchsia-800 text-sm text-[#2d2a1f] dark:text-orange-200"
                      >
                        <div>
                          <span className="font-semibold">Description:</span>{" "}
                          {opt.description}
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold">Impact:</span>{" "}
                          {opt.impact}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() =>
                              setCurrentSlide(
                                filteredMetrics.findIndex(
                                  (m) => m.id === opt.metric
                                )
                              )
                            }
                            className="text-sm px-3 py-1 rounded-md font-medium bg-[#e0f3fa] text-[#225577] border border-[#b7d2f7]"
                          >
                            View related metric
                          </button>
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="text-sm text-[#557399] hover:text-[#225577] dark:hover:text-orange-300"
                          >
                            Learn more →
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Auto Recommendations (Milestone 4) */}
        <div className="mt-10 max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4 text-[#2d2a1f] dark:text-orange-300">
            Optimization Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.resource}
                className="rounded-2xl border border-[#b7d2f7] dark:border-fuchsia-700 bg-[#f7f7f5] dark:bg-gray-900/60 p-4 shadow-sm"
              >
                <div className="text-xs text-[#557399] dark:text-orange-100 mb-1">
                  Region: <span className="font-semibold">{rec.region}</span>
                </div>
                <div className="text-sm font-semibold text-[#2d2a1f] dark:text-white">
                  {rec.resource}
                </div>
                <div className="text-xs text-[#557399] dark:text-orange-200 mt-1">
                  Forecast next cycle:{" "}
                  <span className="font-semibold">
                    {rec.forecastPct}% ({rec.level})
                  </span>
                </div>
                <div className="mt-3 text-sm text-[#1f2933] dark:text-orange-50">
                  Recommendation:{" "}
                  <span className="font-semibold">{rec.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What-If Simulator (Milestone 4) */}
        <div className="mt-10 max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4 text-[#2d2a1f] dark:text-orange-300">
            What-If Simulator
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="rounded-2xl border border-[#b7d2f7] dark:border-fuchsia-700 bg-[#f7f7f5] dark:bg-gray-900/60 p-4 shadow-sm">
              <p className="text-sm font-medium text-[#2d2a1f] dark:text-white mb-3">
                Adjust hypothetical changes and see impact on CPU & Storage.
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#557399] dark:text-orange-100">
                    Workload change (%)
                  </span>
                  <span className="text-xs font-semibold text-[#225577] dark:text-orange-200">
                    {workloadDelta > 0 ? `+${workloadDelta}` : workloadDelta}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={workloadDelta}
                  onChange={(e) => setWorkloadDelta(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#557399] dark:text-orange-100">
                    Traffic change (%)
                  </span>
                  <span className="text-xs font-semibold text-[#225577] dark:text-orange-200">
                    {trafficDelta > 0 ? `+${trafficDelta}` : trafficDelta}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={trafficDelta}
                  onChange={(e) => setTrafficDelta(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>
            </div>

            {/* Result card */}
            <div className="rounded-2xl border border-[#b7d2f7] dark:border-fuchsia-700 bg-white dark:bg-gray-900/60 p-4 shadow-sm">
              {whatIfResults ? (
                <>
                  <p className="text-sm font-medium text-[#2d2a1f] dark:text-white mb-3">
                    Simulated next-cycle impact
                  </p>
                  <div className="space-y-3 text-xs text-[#4b5563] dark:text-orange-100">
                    <div>
                      <div className="font-semibold mb-1">CPU</div>
                      <div className="flex justify-between">
                        <span>Base forecast</span>
                        <span className="font-semibold">
                          {whatIfResults.baseCpu}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>With workload change</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          {whatIfResults.simulatedCpu}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Storage</div>
                      <div className="flex justify-between">
                        <span>Base forecast</span>
                        <span className="font-semibold">
                          {whatIfResults.baseStorage} TB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>With traffic change</span>
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          {whatIfResults.simulatedStorage} TB
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-[#6b7280] dark:text-gray-300">
                  Not enough data to run what-if simulation.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capacity Planning section */}
        <div className="mt-14 space-y-6">
          <h3 className="text-2xl font-semibold text-[#2d2a1f] dark:text-orange-300">
            Capacity Planning
          </h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Forecasted demand with confidence */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Forecasted Demand (with Confidence)
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={capacityRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ReTooltip />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    stroke="#4f46e5"
                    strokeWidth={0}
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lower"
                    stroke="#4f46e5"
                    strokeWidth={0}
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Capacity vs Forecast bar chart */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Capacity vs Forecast
              </h4>
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

          {/* Risk indicators table */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm dark:bg-gray-900/60 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Capacity Risk by Week
            </h4>
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
                  <tr
                    key={r.date}
                    className="border-t border-[#e5e7eb] dark:border-gray-800"
                  >
                    <td className="py-2 pr-3">{r.date}</td>
                    <td className="py-2 pr-3">{r.forecast}</td>
                    <td className="py-2 pr-3">{r.capacity}</td>
                    <td className="py-2 pr-3">{r.gap}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          "px-2 py-0.5 rounded-full text-[11px] " +
                          (r.status === "Sufficient"
                            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : r.status === "Shortage"
                            ? "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                            : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300")
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

        {/* Milestone 3 visualizations */}
        <ForecastVisualizations />
      </div>
    </div>
  );
}

// ----- ForecastCard -----
function ForecastCard({ metric: m, COLORS, makeLineData }) {
  if (!m) return null;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className="
        rounded-3xl px-10 py-9 shadow-2xl border border-[#c5d7f3] 
        bg-gradient-to-br from-[#f7f9fc] via-[#f1f3f8] to-[#ececec]
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-fuchsia-800 dark:to-orange-500 dark:border-none
        backdrop-blur-md 
        flex flex-col justify-center items-center
        transition-all
      "
      style={{
        minHeight: 420,
        maxWidth: "700px",
        margin: "auto",
      }}
    >
      <div className="flex flex-col items-center mb-2">
        <div className="w-16 h-16 rounded-xl bg-[#e0f3fa] dark:bg-black/40 flex items-center justify-center mb-2 shadow-md shadow-[#b7d2f7]/40">
          {m.icon}
        </div>
        <h2 className="text-3xl font-bold mb-1 text-[#222] dark:text-white">
          {m.title}
        </h2>
        <div className="text-sm font-light text-[#557399] dark:text-orange-50 mb-1">
          7-week forecast overview
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start w-full gap-8 justify-between">
        {/* Pie / Donut chart & current */}
        <div className="flex flex-col items-center">
          <PieChart width={120} height={120} style={{ marginBottom: 10 }}>
            <Pie
              data={m.pie}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={55}
              paddingAngle={6}
              dataKey="value"
              labelLine={false}
              label={({ percent }) =>
                percent > 0.15 ? `${Math.round(percent * 100)}%` : ""
              }
            >
              {m.pie.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
          <div className="flex items-center gap-2 mt-3 mb-2">
            {m.forecast[m.forecast.length - 1] >= m.current ? (
              <ArrowUpCircle className="w-5 h-5 text-[#b7d2f7] dark:text-orange-200" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-[#aca899] dark:text-fuchsia-200" />
            )}
            <span className="text-sm font-medium text-[#282828] dark:text-white">
              Current
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#282828] dark:text-white">
            {m.current} <span className="text-lg">{m.unit}</span>
          </div>
        </div>

        {/* Line chart */}
        <div className="flex-1 bg-white/80 dark:bg-black/30 rounded-xl p-6 backdrop-blur-sm shadow-lg mt-6 md:mt-0">
          <div className="h-44 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={makeLineData(m.forecast)}>
                <defs>
                  <linearGradient id={`grad-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop
                      offset="0%"
                      stopColor="#b7d2f7"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="80%"
                      stopColor="#f97316"
                      stopOpacity={0.7}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e0e7ef"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#557399", fontWeight: 600, fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "#557399", fontWeight: 600, fontSize: 11 }}
                />
                <ReTooltip
                  contentStyle={{
                    background: "#eef3f8",
                    borderRadius: 10,
                    border: "1px solid #c5d7f3",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
                    padding: "8px 10px",
                  }}
                  labelStyle={{ color: "#1f2933", fontWeight: 600 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <ReLegend
                  verticalAlign="bottom"
                  height={18}
                  wrapperStyle={{ color: "#4b5563", fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={`url(#grad-${m.id})`}
                  strokeWidth={4}
                  dot={{ r: 4, stroke: "#e0f3fa", fill: "#b7d2f7" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-[#557399]/90 dark:text-orange-50/90">
              7-week projection · hover points for exact values
            </div>
            <div className="font-bold text-lg text-[#2d2a1f] dark:text-white drop-shadow">
              {Array.isArray(m.forecast)
                ? `${m.forecast[m.forecast.length - 1]} ${m.unit}`
                : `- ${m.unit}`}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
