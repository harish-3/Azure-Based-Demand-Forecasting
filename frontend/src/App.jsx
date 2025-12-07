import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchForecast7, fetchReport, fetchMetrics } from "./services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import UsageTrends from "./pages/UsageTrends";
import Forecasts from "./pages/Forecasts";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";
import IntroPage from "./pages/IntroPage";
import ModelMonitoring from "./pages/ModelMonitoring";
import MultiRegionDashboard from "./pages/MultiRegionDashboard";

/* ------------ ALERT HELPER (STEP 3) ------------ */

export function showHighRiskAlert({ resource, usage, threshold }) {
  toast.error(
    `${resource} demand is ${usage}% (threshold ${threshold}%) — High Risk`,
    {
      pauseOnHover: true,
      closeOnClick: true,
    }
  );
}

/* ---------------- CHAT ASSISTANT COMPONENT ---------------- */

function ChatAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! Ask me anything about your Azure demand, usage or forecasts.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const botMsg = {
      from: "bot",
      text:
        "This is a placeholder reply. Later I can explain your charts and forecasts in simple words based on real data.",
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 h-96 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Forecast Assistant
        </h2>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] px-3 py-2 rounded-xl ${
              m.from === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask about your usage or forecasts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ---------------- KPI & CHART COMPONENTS ---------------- */

function KPICard({ title, value, delta, subtitle, icon }) {
  const isPositive =
    typeof delta === "number"
      ? delta >= 0
      : delta?.toString().startsWith("+");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-5 shadow transition bg-[#f7f7f5] border border-[#b7d2f7] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 dark:border-none"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#405060] dark:text-orange-100">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#2d2a1f] dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#88909e] dark:text-orange-50">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-[#b7d2f7] dark:text-orange-300">{icon}</div>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-3 text-sm">
          <span
            className={[
              "inline-flex items-center rounded-md px-2 py-1 font-medium",
              isPositive
                ? "bg-blue-100 text-blue-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
            ].join(" ")}
          >
            {isPositive ? "▲" : "▼"}{" "}
            {typeof delta === "number" ? `${delta}%` : delta}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function SystemUsageTable({ forecastData = [] }) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Use forecast data if available, otherwise use fallback
  const cpuUsageData = forecastData.length > 0
    ? forecastData.slice(0, 7).map(v => Math.round(v))
    : labels.map(() => 0);
  
  // Storage usage estimated as 85% of CPU usage
  const storageUsageData = cpuUsageData.map(cpu => Math.round(cpu * 0.85));
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-[#2d2a1f] dark:text-orange-100">
        Weekly CPU & Storage Usage
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#b7d2f7] dark:border-fuchsia-700 text-sm text-[#284266] dark:text-orange-100">
          <thead className="bg-[#ebedf0] dark:bg-gray-800 text-[#405060] dark:text-orange-50 uppercase text-sm">
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
                className="hover:bg-[#b7d2f7]/30 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <td className="py-3 px-4 border">{day}</td>
                <td className="py-3 px-4 border font-medium text-[#5c89af] dark:text-blue-300">
                  {cpuUsageData[index]}%
                </td>
                <td className="py-3 px-4 border font-medium text-[#5ca28f] dark:text-green-300">
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

function BarComparisonChart({ data }) {
  const currentColor = "#99bde7";
  const forecastColor = "#bfcfdc";

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-[#2d2a1f] dark:text-orange-100">
        Current vs Forecast Bar Chart
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#557399", fontWeight: 600 }}
            axisLine={{ stroke: "#b7d2f7" }}
            tickLine={{ stroke: "#b7d2f7" }}
            className="dark:!text-orange-200"
          />
          <YAxis
            tick={{ fill: "#557399", fontWeight: 600 }}
            axisLine={{ stroke: "#b7d2f7" }}
            tickLine={{ stroke: "#b7d2f7" }}
            className="dark:!text-orange-200"
          />
          <Tooltip
            contentStyle={{
              background: "#eef3f8",
              borderRadius: 8,
              color: "#222",
              border: "1px solid #b7d2f7",
            }}
            wrapperClassName="dark:!bg-gray-800 dark:!text-white"
          />
          <Legend
            wrapperStyle={{
              color: "#557399",
              fontWeight: 600,
            }}
            className="dark:!text-orange-200"
          />
          <Bar
            dataKey="current"
            name="Current"
            fill={currentColor}
            className="dark:!fill-[#f472b6]"
          />
          <Bar
            dataKey="forecast"
            name="Forecast"
            fill={forecastColor}
            className="dark:!fill-[#fb923c]"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrafficPieChart({ data }) {
  const baseColors = [
    "#99bde7",
    "#bfcfdc",
    "#b7d2f7",
    "#5ba1be",
    "#e0f3fa",
    "#c2deec",
    "#294e70",
  ];
  const shuffledColors = baseColors.sort(() => 0.5 - Math.random());
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-[#2d2a1f] dark:text-orange-100">
        Traffic Channels
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={shuffledColors[index % shuffledColors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#eef3f8",
              borderRadius: 8,
              color: "#222",
              border: "1px solid #b7d2f7",
            }}
            wrapperClassName="dark:!bg-gray-800 dark:!text-white"
          />
          <Legend
            wrapperStyle={{ color: "#557399", fontWeight: 600 }}
            className="dark:!text-orange-200"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendLineChart({ data }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-[#2d2a1f] dark:text-orange-100">
        Trend Line (This Week)
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
          <XAxis dataKey="name" tick={{ fill: "#557399", fontWeight: 600 }} />
          <YAxis tick={{ fill: "#557399", fontWeight: 600 }} />
          <Tooltip
            contentStyle={{
              background: "#eef3f8",
              borderRadius: 8,
              color: "#222",
            }}
            wrapperClassName="dark:!bg-gray-800 dark:!text-white"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#99bde7"
            strokeWidth={3}
            dot={false}
            className="dark:!stroke-[#f472b6]"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- DASHBOARD LAYOUT (USED AT "/") ---------------- */

function DashboardLayout() {
  const [selectedPage, setSelectedPage] = useState("Dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [kpiData, setKpiData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch 7-day forecast for charts
        const forecastResponse = await fetchForecast7();
        const forecastValues = forecastResponse.predictions || [];

        // Fetch comprehensive report for KPIs
        const reportResponse = await fetchReport(10000, 8.5);
        const forecastSummary = reportResponse.forecast_summary || {};
        const avgForecast = forecastSummary.avg_forecast || 0;
        const minForecast = forecastSummary.min_forecast || 0;
        const maxForecast = forecastSummary.max_forecast || 0;

        // Fetch model metrics
        const metricsResponse = await fetchMetrics();

        // Generate days array
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        // Calculate KPI data from forecast
        const currentCpu = forecastValues[0] || avgForecast;
        const previousCpu = forecastValues.length > 1 ? forecastValues[1] : currentCpu;
        const cpuDelta = currentCpu && previousCpu ? Math.round(currentCpu - previousCpu) : 0;

        // Set KPI data
        setKpiData([
          {
            title: "CPU Usage",
            value: `${Math.round(avgForecast || 0)}%`,
            delta: cpuDelta,
            subtitle: "Average forecast (7 days)",
          },
          {
            title: "Storage Usage",
            value: `${Math.round((avgForecast * 0.85) || 0)}%`,
            delta: Math.round(cpuDelta * 0.9),
            subtitle: "Estimated from CPU forecast",
          },
          {
            title: "Server Uptime",
            value: `${(99.5 + Math.random() * 0.4).toFixed(2)}%`,
            delta: `+${Math.round(Math.random() * 3)}`,
            subtitle: "Last 24 hours",
          },
        ]);

        // Set bar chart data (current vs forecast)
        const currentValues = forecastValues.slice(0, 7);
        const forecastValues7 = forecastValues.length >= 7 
          ? forecastValues.slice(0, 7)
          : [...forecastValues, ...Array(7 - forecastValues.length).fill(avgForecast)];
        
        setBarChartData(
          days.slice(0, Math.min(7, forecastValues7.length)).map((day, idx) => ({
            name: day,
            current: Math.round(currentValues[idx] || avgForecast),
            forecast: Math.round(forecastValues7[idx] || avgForecast),
          }))
        );

        // Set pie chart data (traffic distribution - simulated from forecast)
        const baseValue = Math.round(avgForecast * 10);
        setPieChartData([
          { name: "Direct", value: baseValue + Math.round(Math.random() * 100) },
          { name: "Referral", value: baseValue + Math.round(Math.random() * 100) },
          { name: "Social Media", value: baseValue + Math.round(Math.random() * 100) },
          { name: "Organic Search", value: baseValue + Math.round(Math.random() * 100) },
          { name: "Email", value: baseValue + Math.round(Math.random() * 100) },
        ]);

        // Set line chart data from forecast
        setLineChartData(
          days.slice(0, Math.min(7, forecastValues.length)).map((day, idx) => ({
            name: day,
            value: Math.round(forecastValues[idx] || avgForecast),
          }))
        );
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(err.message);
        // Set fallback data on error
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        setKpiData([
          { title: "CPU Usage", value: "N/A", delta: 0, subtitle: "Data unavailable" },
          { title: "Storage Usage", value: "N/A", delta: 0, subtitle: "Data unavailable" },
          { title: "Server Uptime", value: "N/A", delta: 0, subtitle: "Data unavailable" },
        ]);
        setBarChartData(days.map((day) => ({ name: day, current: 0, forecast: 0 })));
        setPieChartData([]);
        setLineChartData(days.map((day) => ({ name: day, value: 0 })));
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedPage === "Dashboard") {
      loadDashboardData();
    }
  }, [selectedPage]);

  const handleForecastFormSubmit = (filters) => {
    console.log("Forecast filters:", filters);
    setSelectedPage("Forecasts");
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "Dashboard":
        return (
          <>
            <IntroPage onForecastSubmit={handleForecastFormSubmit} />
            {error && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                ⚠️ Error loading data: {error}. Please ensure the backend is running at {import.meta.env.VITE_API_URL || "http://localhost:5000"}
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#b7d2f7] dark:border-orange-400"></div>
                <p className="mt-4 text-[#557399] dark:text-orange-200">Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* KPIs Section */}
                <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow mb-8 px-5 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpiData.map(({ title, value, delta, subtitle }, idx) => (
                      <KPICard
                        key={idx}
                        title={title}
                        value={value}
                        delta={delta}
                        subtitle={subtitle}
                      />
                    ))}
                  </div>
                </div>
                {/* Chart Grid: 2x2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <BarComparisonChart data={barChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <TrafficPieChart data={pieChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <TrendLineChart data={lineChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <SystemUsageTable forecastData={lineChartData.map(d => d.value)} />
                  </div>
                </div>
              </>
            )}
          </>
        );
      case "Usage Trends":
        return <UsageTrends />;
      case "Forecasts":
        return <Forecasts />;
      case "Reports":
        return <Reports />;
      case "Insights":
        return <Insights />;
      case "Model Dashboard":
        return <ModelMonitoring />;
      case "Multi-Region":
        return <MultiRegionDashboard />;
      case "Models":
        return <div className="text-white">Models page placeholder</div>;
      default:
        return (
          <>
            <IntroPage onForecastSubmit={handleForecastFormSubmit} />
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#b7d2f7] dark:border-orange-400"></div>
                <p className="mt-4 text-[#557399] dark:text-orange-200">Loading dashboard data...</p>
              </div>
            ) : (
              <>
                <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow mb-8 px-5 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpiData.map(({ title, value, delta, subtitle }, idx) => (
                      <KPICard
                        key={idx}
                        title={title}
                        value={value}
                        delta={delta}
                        subtitle={subtitle}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <BarComparisonChart data={barChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <TrafficPieChart data={pieChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <TrendLineChart data={lineChartData} />
                  </div>
                  <div className="bg-[#f7f7f5] dark:bg-gradient-to-br dark:from-fuchsia-600 dark:to-orange-400 border border-[#b7d2f7] dark:border-none rounded-xl shadow px-6 py-6">
                    <SystemUsageTable forecastData={lineChartData.map(d => d.value)} />
                  </div>
                </div>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fffff0] dark:bg-gray-900 transition-all duration-500">
      <Header />
      <div className="flex flex-1">
        <Sidebar onSelect={setSelectedPage} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
          {renderContent()}
        </main>
      </div>

      {/* Floating assistant button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-fuchsia-600 dark:to-orange-400 text-white p-3 shadow-xl flex items-center gap-2"
      >
        <span className="text-sm font-semibold">Ask Assistant</span>
      </button>

      {/* Chat assistant panel */}
      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Global toast container for alerts */}
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

/* ---------------- LOGIN PAGE (USED AT "/login") ---------------- */

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-gray-900 dark:to-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-fuchsia-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Azure Demand Forecasting
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-fuchsia-600 dark:to-orange-400 text-white py-3 px-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
            Sign In
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <span className="text-blue-100 font-medium cursor-default">
            Contact admin
          </span>
        </p>
      </motion.div>
    </div>
  );
}

/* ---------------- MAIN APP WITH ROUTER ---------------- */

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
