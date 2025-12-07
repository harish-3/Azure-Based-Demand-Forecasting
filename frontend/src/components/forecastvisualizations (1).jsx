// src/components/ForecastVisualizations.jsx

import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";

export default function ForecastVisualizations() {
  const [region, setRegion] = useState("Central India");
  const [metric, setMetric] = useState("CPU Usage");
  const [model, setModel] = useState("arima");
  const [horizon, setHorizon] = useState("7 days");

  const [dates, setDates] = useState([]);
  const [actual, setActual] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [lower95, setLower95] = useState([]);
  const [upper95, setUpper95] = useState([]);

  const [isRunning, setIsRunning] = useState(false);

  // anomalies + what‑if
  const [anomalies, setAnomalies] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [whatIfGrowth, setWhatIfGrowth] = useState(0); // -30 to +50%
  const [whatIfForecast, setWhatIfForecast] = useState([]);

  // Run forecasts (demo generator – replace with API later)
  const runForecasts = async () => {
    setIsRunning(true);

    const len = horizon === "7 days" ? 7 : horizon === "14 days" ? 14 : 30;
    const baseDates = Array.from({ length: len }, (_, i) => `Day ${i + 1}`);

    const modelFactor =
      model === "xgboost" ? 1.08 : model === "lstm" ? 1.15 : 1.0;
    const metricBase =
      metric === "CPU Usage" ? 60 : metric === "Storage Usage" ? 50 : 40;

    const newActual = baseDates.map(
      (_d, i) => metricBase + i * 2 + (i % 3) * 3
    );
    const newForecast = baseDates.map(
      (_d, i) => (metricBase + i * 2.5 + 5) * modelFactor
    );
    const newLower = newForecast.map((v) => v - 8);
    const newUpper = newForecast.map((v) => v + 8);

    setDates(baseDates);
    setActual(newActual);
    setForecast(newForecast);
    setLower95(newLower);
    setUpper95(newUpper);

    // anomaly detection on actuals (relaxed threshold 1.2 * std)
    const n = newActual.length;
    if (n > 0) {
      const meanActual =
        newActual.reduce((s, v) => s + v, 0) / n;
      const stdActual = Math.sqrt(
        newActual.reduce((s, v) => s + Math.pow(v - meanActual, 2), 0) / n
      );

      const detected = newActual
        .map((v, i) => ({
          index: i,
          date: baseDates[i],
          value: v,
          isSpike: v > meanActual + 1.2 * stdActual,
        }))
        .filter((a) => a.isSpike);

      setAnomalies(detected);
      setSelectedAnomaly(detected[0] || null);
    } else {
      setAnomalies([]);
      setSelectedAnomaly(null);
    }

    setIsRunning(false);
  };

  // Auto‑run once on mount so graphs are fresh on every page reload
  useEffect(() => {
    runForecasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recompute what‑if forecast whenever base forecast or growth changes
  useEffect(() => {
    if (!forecast.length) {
      setWhatIfForecast([]);
      return;
    }
    const factor = 1 + whatIfGrowth / 100;
    setWhatIfForecast(forecast.map((v) => v * factor));
  }, [forecast, whatIfGrowth]);

  const downloadCSV = () => {
    if (!dates.length) return;

    let csv =
      "date,actual,forecast,lower95,upper95,region,metric,model,horizon\n";
    dates.forEach((d, i) => {
      csv += `${d},${actual[i]},${forecast[i]},${lower95[i]},${upper95[i]},${region},${metric},${model},${horizon}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_${model}_${metric.replace(" ", "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary rows for analysis table
  const getSummaryRows = () => {
    if (!dates.length) return [];

    const n = dates.length;
    const mean = (arr) => arr.reduce((s, v) => s + v, 0) / n;

    const absErrors = actual.map((v, i) => Math.abs(v - forecast[i]));
    const maxError = Math.max(...absErrors).toFixed(1);

    return [
      {
        label: "Average actual",
        value: mean(actual).toFixed(1),
      },
      {
        label: "Average forecast",
        value: mean(forecast).toFixed(1),
      },
      {
        label: "Max absolute error",
        value: maxError,
      },
      {
        label: "Minimum actual",
        value: Math.min(...actual).toFixed(1),
      },
      {
        label: "Maximum actual",
        value: Math.max(...actual).toFixed(1),
      },
    ];
  };

  const commonLayout = {
    height: 360,
    hovermode: "x unified",
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#111827" },
    margin: { l: 50, r: 20, t: 50, b: 40 },
  };

  // base pill style
  const filterPill =
    "px-3 py-1 rounded-full text-sm border transition font-medium";

  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Forecast Visualizations
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose a region, metric, model and horizon, then run forecasts, view
          charts, and export the results.
        </p>
      </div>

      {/* Card wrapper */}
      <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md shadow-xl p-5 md:p-6 space-y-8">
        {/* Controls stacked: REGION → METRIC → MODEL → HORIZON */}
        <div className="flex flex-col gap-4 pb-4 mb-4 border-b border-gray-200 dark:border-gray-800">
          {/* REGION */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">
              REGION
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                "Central India",
                "South India",
                "North India",
                "US West",
                "US East",
                "Asia-Pacific",
              ].map((r) => {
                const isActive = region === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`${filterPill} ${
                      isActive
                        ? "bg-teal-500 text-white border-teal-500 shadow ring-2 ring-teal-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-teal-50 hover:border-teal-400 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* METRIC */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">
              METRIC
            </span>
            <div className="flex flex-wrap gap-2">
              {["CPU Usage", "Storage Usage"].map((m) => {
                const isActive = metric === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`${filterPill} ${
                      isActive
                        ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow ring-2 ring-fuchsia-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-fuchsia-50 hover:border-fuchsia-400 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODEL */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">
              MODEL
            </span>
            <div className="flex flex-wrap gap-2">
              {["arima", "xgboost", "lstm"].map((m) => {
                const isActive = model === m;
                return (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`${filterPill} capitalize ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow ring-2 ring-emerald-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HORIZON */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">
              HORIZON
            </span>
            <div className="flex flex-wrap gap-2">
              {["7 days", "14 days", "30 days"].map((h) => {
                const isActive = horizon === h;
                return (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`${filterPill} ${
                      isActive
                        ? "bg-orange-500 text-white border-orange-500 shadow ring-2 ring-orange-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-400 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={runForecasts}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-blue-500 to-indigo-500
                         text-white shadow-md hover:shadow-lg
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all"
            >
              {isRunning ? "Running…" : "Run Forecasts"}
            </button>
            <button
              onClick={downloadCSV}
              disabled={!dates.length}
              className="px-4 py-2 rounded-xl text-sm font-semibold
                         bg-emerald-600 text-white shadow-md
                         hover:bg-emerald-500 disabled:opacity-60
                         disabled:cursor-not-allowed transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Anomaly alerts */}
        {anomalies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            {anomalies.map((a) => (
              <button
                key={a.date}
                onClick={() => setSelectedAnomaly(a)}
                className={`px-3 py-1 rounded-full border transition ${
                  selectedAnomaly?.date === a.date
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
              >
                Spike on {a.date}: {a.value.toFixed(1)} {metric}
              </button>
            ))}
          </div>
        )}

        {/* What‑if lab */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <span className="font-semibold">What‑if lab:</span>{" "}
            Adjust growth % to see an alternate forecast line.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Growth %
            </span>
            <input
              type="range"
              min="-30"
              max="50"
              value={whatIfGrowth}
              onChange={(e) => setWhatIfGrowth(Number(e.target.value))}
              className="w-40"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {whatIfGrowth > 0 ? "+" : ""}
              {whatIfGrowth}%
            </span>
          </div>
        </div>

        {/* Charts and analysis */}
        {!dates.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Choose options above and click{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Run Forecasts
            </span>{" "}
            to generate charts.
          </div>
        ) : (
          <>
            <div className="space-y-10">
              {/* 1. Historical + Forecast Trend */}
              <Plot
                data={[
                  {
                    x: dates,
                    y: actual,
                    mode: "lines+markers",
                    name: "Historical",
                    line: { color: "#38bdf8" },
                    marker: { color: "#38bdf8" },
                  },
                  {
                    x: dates,
                    y: forecast,
                    mode: "lines",
                    name: "Forecast",
                    line: { dash: "dash", color: "#f472b6" },
                  },
                  whatIfForecast.length
                    ? {
                        x: dates,
                        y: whatIfForecast,
                        mode: "lines",
                        name: `What‑if (${whatIfGrowth > 0 ? "+" : ""}${whatIfGrowth}%)`,
                        line: { color: "#6366f1", width: 3, dash: "dot" },
                      }
                    : null,
                ].filter(Boolean)}
                layout={{
                  ...commonLayout,
                  title: `${metric} – Historical + Forecast (${region})`,
                  shapes: selectedAnomaly
                    ? [
                        {
                          type: "line",
                          x0: selectedAnomaly.date,
                          x1: selectedAnomaly.date,
                          y0: 0,
                          y1: 1,
                          xref: "x",
                          yref: "paper",
                          line: { color: "red", width: 2, dash: "dot" },
                        },
                      ]
                    : [],
                }}
                style={{ width: "100%" }}
              />

              {/* 2. Forecast with 95% CI */}
              <Plot
                data={[
                  {
                    x: [...dates, ...dates.slice().reverse()],
                    y: [...upper95, ...lower95.slice().reverse()],
                    fill: "toself",
                    fillcolor: "rgba(56,189,248,0.18)",
                    line: { color: "transparent" },
                    hoverinfo: "skip",
                    name: "95% CI",
                  },
                  {
                    x: dates,
                    y: forecast,
                    mode: "lines",
                    name: "Forecast",
                    line: { color: "#f97316" },
                  },
                ]}
                layout={{
                  ...commonLayout,
                  title: `${metric} – Forecast with 95% Confidence Interval`,
                }}
                style={{ width: "100%" }}
              />

              {/* 3. Actual vs Predicted */}
              <Plot
                data={[
                  {
                    x: dates,
                    y: actual,
                    mode: "lines+markers",
                    name: "Actual",
                    line: { color: "#22c55e" },
                    marker: { color: "#22c55e" },
                  },
                  {
                    x: dates,
                    y: forecast,
                    mode: "lines+markers",
                    name: "Predicted",
                    line: { color: "#e11d48" },
                    marker: { color: "#e11d48" },
                  },
                ]}
                layout={{
                  ...commonLayout,
                  title: `${metric} – Actual vs Predicted`,
                }}
                style={{ width: "100%" }}
              />
            </div>

            {/* Analysis table */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Brief analysis
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Summary based on the currently displayed forecast series.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Metric</th>
                      <th className="px-4 py-2 text-left">
                        Value ({metric}, {region})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
                    {getSummaryRows().map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-gray-200 dark:border-gray-800"
                      >
                        <td className="px-4 py-2 font-medium">{row.label}</td>
                        <td className="px-4 py-2">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
