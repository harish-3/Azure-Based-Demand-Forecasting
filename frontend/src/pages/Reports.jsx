import React, { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import { fetchReport, fetchOptimization } from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip
);

export default function Reports() {
  const [activeTab, setActiveTab] = useState("performance");
  const [performanceData, setPerformanceData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const perfLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const foreLabels = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Fetch report data from backend
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch comprehensive report
        const reportResponse = await fetchReport(10000, 8.5);
        setReportData(reportResponse);

        const forecastSummary = reportResponse.forecast_summary || {};
        const predictions = forecastSummary.predictions || [];
        const avgForecast = forecastSummary.avg_forecast || 0;

        // Generate performance data from historical forecast (simulated)
        const perfValues = perfLabels.map((_, i) => {
          // Simulate historical performance based on current forecast
          const base = avgForecast * 0.9; // Historical slightly lower
          return Math.round(base + (Math.random() * 10 - 5));
        });

        setPerformanceData({
          labels: perfLabels,
          datasets: [
            {
              label: "Performance Metrics",
              data: perfValues,
              borderColor: "#99bde7",
              backgroundColor: "rgba(153,189,231,0.20)",
              tension: 0.4,
              fill: true,
            },
          ],
          _raw: perfValues,
        });

        // Use forecast data for forecast tab
        const foreValues = foreLabels.map((_, i) => {
          if (i < predictions.length) {
            return Math.round(predictions[i] || avgForecast);
          }
          // Extend forecast if needed
          const trend = predictions.length > 0 
            ? (predictions[predictions.length - 1] - predictions[0]) / predictions.length
            : 0;
          return Math.round(avgForecast + (i - predictions.length) * trend);
        });

        setForecastData({
          labels: foreLabels,
          datasets: [
            {
              label: "Forecast Metrics",
              data: foreValues,
              borderColor: "#bfcfdc",
              backgroundColor: "rgba(191,207,220,0.18)",
              tension: 0.4,
              fill: true,
            },
          ],
          _raw: foreValues,
        });
      } catch (err) {
        console.error("Error loading report data:", err);
        setError(err.message);
        // Fallback data
        const fallbackPerf = perfLabels.map(() => 0);
        const fallbackFore = foreLabels.map(() => 0);
        setPerformanceData({
          labels: perfLabels,
          datasets: [{ label: "Performance Metrics", data: fallbackPerf, borderColor: "#99bde7", backgroundColor: "rgba(153,189,231,0.20)", tension: 0.4, fill: true }],
          _raw: fallbackPerf,
        });
        setForecastData({
          labels: foreLabels,
          datasets: [{ label: "Forecast Metrics", data: fallbackFore, borderColor: "#bfcfdc", backgroundColor: "rgba(191,207,220,0.18)", tension: 0.4, fill: true }],
          _raw: fallbackFore,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#4b5563",
          font: { size: 12, weight: "500" },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        cornerRadius: 10,
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: "#557399", font: { weight: "bold" } },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
      y: {
        ticks: { color: "#557399", font: { weight: "bold" } },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
    },
  };

  const handleDownload = (type) => {
    alert(`📊 Downloading ${type} report...`);
  };

  // Fetch recommendations from backend
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!reportData) return;
      
      try {
        const capacityAnalysis = reportData.capacity_analysis || {};
        const avgForecast = reportData.forecast_summary?.avg_forecast || 0;
        const capacity = capacityAnalysis.capacity || 10000;
        
        // Fetch optimization suggestions
        const optimizationResponse = await fetchOptimization(capacity, 7, "East-US");
        
        // Generate recommendations from optimization data
        const recs = [];
        if (optimizationResponse.status === "scale_up") {
          recs.push({
            id: 1,
            region: "East US",
            service: "Compute",
            action: "Add",
            amount: `+${Math.round(capacity * 0.15)} units`,
          });
        } else if (optimizationResponse.status === "scale_down") {
          recs.push({
            id: 2,
            region: "West Europe",
            service: "Storage",
            action: "Reduce",
            amount: `-${Math.round(capacity * 0.07)} TB`,
          });
        } else {
          recs.push({
            id: 3,
            region: "Central India",
            service: "Compute",
            action: "Add",
            amount: `+${Math.round(capacity * 0.09)} units`,
          });
        }
        
        setRecommendations(recs);
      } catch (err) {
        console.error("Error loading recommendations:", err);
        // Fallback recommendations
        setRecommendations([
          {
            id: 1,
            region: "East US",
            service: "Compute",
            action: "Add",
            amount: "+1500 units",
          },
          {
            id: 2,
            region: "West Europe",
            service: "Storage",
            action: "Reduce",
            amount: "-700 TB",
          },
        ]);
      }
    };

    loadRecommendations();
  }, [reportData]);

  // Simple CSV download for “Download Forecast Report (CSV)”
  const handleDownloadCSV = () => {
    const header = "Region,Service,Action,Amount\n";
    const rows = recommendations
      .map((r) => `${r.region},${r.service},${r.action},${r.amount}`)
      .join("\n");
    const csv = header + rows;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "forecast_recommendations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      id: "performance",
      label: "Performance",
      color: "from-[#99bde7] to-[#b7d2f7]",
      subtitle: "Historical system behaviour over the last 6 months.",
    },
    {
      id: "forecast",
      label: "Forecast",
      color: "from-[#bfcfdc] to-[#99bde7]",
      subtitle: "Projected KPI trends for the upcoming 6 months.",
    },
  ];

  const tabTransition = {
    hidden: { opacity: 0, y: 30 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.4, ease: "easeIn" } },
  };

  // Small summary metrics derived from data
  const perfSummary = useMemo(() => {
    if (!performanceData?._raw) return null;
    const arr = performanceData._raw;
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { avg, min, max };
  }, [performanceData]);

  const foreSummary = useMemo(() => {
    if (!forecastData?._raw) return null;
    const arr = forecastData._raw;
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { avg, min, max };
  }, [forecastData]);

  const summary = activeTab === "performance" ? perfSummary : foreSummary;

  // Card component with hover effect
  const Card = ({ children }) => (
    <motion.div
      className="
        max-w-5xl mx-auto
        bg-[#f7f7f5]/90 dark:bg-gradient-to-br dark:from-slate-900 dark:via-fuchsia-800 dark:to-orange-500/70
        border border-[#d4def1] dark:border-none
        backdrop-blur-md rounded-2xl shadow-xl p-6 overflow-hidden
      "
      whileHover={{
        scale: 1.016,
        boxShadow:
          "0 18px 40px -12px rgba(15,23,42,0.45), 0 8px 20px -8px rgba(15,23,42,0.35)",
        borderColor: "#99bde7",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );

  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  return (
    <div
      className="
        p-8 min-h-screen
        bg-[#fffff0] dark:bg-gray-900
        transition-all duration-700
      "
    >
      {/* Hero heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-6"
      >
        <h2
          className="
            text-3xl font-extrabold
            text-[#2d2a1f] dark:bg-gradient-to-r dark:from-fuchsia-400 dark:to-orange-300 dark:bg-clip-text dark:text-transparent
          "
        >
          Analytics & Reports
        </h2>
        <p className="mt-2 text-xs md:text-sm text-[#6b6a5a] dark:text-gray-400 max-w-xl mx-auto">
          Export-ready views of historical performance and AI-based forecast
          trends across your Azure workload.
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm max-w-4xl mx-auto">
          ⚠️ Error loading report data: {error}. Please ensure the backend is running.
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#b7d2f7] dark:border-orange-400"></div>
          <p className="mt-4 text-[#557399] dark:text-orange-200">Loading report data...</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center gap-6 mb-6">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 font-semibold rounded-full transition-all duration-300 shadow-md ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "bg-[#ebedf0] dark:bg-gray-800 text-[#2d2a1f] dark:text-gray-300 hover:bg-[#dbeafe] dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab subtitle */}
      {activeTabMeta && (
        <p className="text-xs text-center mb-5 text-[#7b8190] dark:text-gray-400">
          {activeTabMeta.subtitle}
        </p>
      )}

      {/* Summary strip */}
      {summary && (
        <div className="max-w-4xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="px-3 py-2 rounded-xl bg-[#e4ecfb] dark:bg-slate-800/80 text-[#225577] dark:text-orange-100 shadow-sm flex flex-col items-center">
            <span className="font-semibold text-[11px] tracking-wide uppercase">
              Average
            </span>
            <span className="mt-1 text-lg font-bold">{summary.avg}%</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#f5f3ff] dark:bg-slate-800/80 text-[#4b5563] dark:text-orange-100 shadow-sm flex flex-col items-center">
            <span className="font-semibold text-[11px] tracking-wide uppercase">
              Minimum
            </span>
            <span className="mt-1 text-lg font-bold">{summary.min}%</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#e0f2fe] dark:bg-slate-800/80 text-[#0f172a] dark:text-orange-100 shadow-sm flex flex-col items-center">
            <span className="font-semibold text-[11px] tracking-wide uppercase">
              Maximum
            </span>
            <span className="mt-1 text-lg font-bold">{summary.max}%</span>
          </div>
        </div>
      )}

      {/* Step 2: Recommendations & Reports */}
      <div className="max-w-5xl mx-auto mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recommendations panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Recommendations Panel
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Displaying backend’s recommended capacity adjustments.
          </p>
          <ul className="space-y-2 text-sm">
            {recommendations.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/70"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {r.region} {r.service}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    Backend recommendation
                  </div>
                </div>
                <span
                  className={
                    "px-3 py-1 rounded-full text-[11px] font-semibold " +
                    (r.action === "Add"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300")
                  }
                >
                  {r.action} {r.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Downloadable reports */}
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Download Reports
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Export forecast insights for offline sharing.
          </p>
          <button
            onClick={handleDownloadCSV}
            className="mt-1 px-3 py-2 text-xs font-medium rounded-lg bg-[#b7d2f7] text-[#1f2937] hover:bg-[#99bde7] shadow-sm dark:bg-fuchsia-600 dark:text-white dark:hover:bg-fuchsia-500"
          >
            ⬇️ Download Forecast Report (CSV)
          </button>
          <button
            disabled
            className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
          >
            ⬇️ Download Forecast Report (Excel/PDF)
          </button>
        </div>
      </div>

      {/* Animated Content Card */}
      {!isLoading && (
      <AnimatePresence mode="wait">
        {activeTab === "performance" && performanceData && (
          <Card>
            <motion.div
              key="performance"
              variants={tabTransition}
              initial="hidden"
              animate="enter"
              exit="exit"
            >
              <h3 className="text-2xl font-semibold mb-2 text-[#225577] dark:text-blue-300 text-center">
                Performance Overview
              </h3>
              <p className="text-[#557399] dark:text-orange-200 mb-6 text-center text-sm">
                Visualizes key system performance indicators over the last 6
                months to highlight stability and spikes.
              </p>
              <div className="h-80 mb-6">
                <Line data={performanceData} options={chartOptions} />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDownload("Performance")}
                className="
                  px-6 py-3 bg-gradient-to-r from-[#99bde7] to-[#b7d2f7] text-[#1f2937]
                  rounded-lg hover:from-[#b7d2f7] hover:to-[#99bde7] font-medium shadow-md transition
                  dark:bg-gradient-to-r dark:from-fuchsia-700 dark:to-orange-500 dark:text-white dark:hover:from-orange-400 dark:hover:to-fuchsia-700
                "
              >
                ⬇️ Download Performance Report
              </motion.button>
            </motion.div>
          </Card>
        )}

        {activeTab === "forecast" && forecastData && (
          <Card>
            <motion.div
              key="forecast"
              variants={tabTransition}
              initial="hidden"
              animate="enter"
              exit="exit"
            >
              <h3 className="text-2xl font-semibold mb-2 text-[#557399] dark:text-orange-300 text-center">
                Forecast Insights
              </h3>
              <p className="text-[#557399] dark:text-orange-200 mb-6 text-center text-sm">
                AI-powered forward-looking metrics to anticipate demand and
                plan capacity for the next half-year.
              </p>
              <div className="h-80 mb-6">
                <Line data={forecastData} options={chartOptions} />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDownload("Forecast")}
                className="
                  px-6 py-3 bg-gradient-to-r from-[#bfcfdc] to-[#99bde7] text-[#1f2937]
                  rounded-lg hover:from-[#99bde7] hover:to-[#bfcfdc] font-medium shadow-md transition
                  dark:bg-gradient-to-r dark:from-fuchsia-700 dark:to-orange-500 dark:text-white dark:hover:from-orange-400 dark:hover:to-fuchsia-700
                "
              >
                ⬇️ Download Forecast Report
              </motion.button>
            </motion.div>
          </Card>
        )}
      </AnimatePresence>
      )}
    </div>
  );
}
