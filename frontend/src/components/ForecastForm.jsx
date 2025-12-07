import React, { useState, useEffect, useRef } from "react";
import Dropdown from "./Dropdown";

const regionOptions = [
  "Central India",
  "South India",
  "North India",
  "East India",
  "West India",
];
const serviceOptions = ["Compute", "Storage"];
const timeHorizonOptions = ["7 days", "14 days", "30 days"];

const ForecastForm = ({ onSubmit }) => {
  const [region, setRegion] = useState("");
  const [service, setService] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");

  const borderRef = useRef(null);

  // Helper to set gradient border based on theme
  const applyBorderGradient = (isDark) => {
    if (!borderRef.current) return;
    borderRef.current.style.borderImage = isDark
      ? "linear-gradient(135deg,#f472b6 0%,#fb7185 40%,#fb923c 100%)"
      : "linear-gradient(120deg,#b7d2f7 0%,#afd8fa 100%)";
    borderRef.current.style.borderImageSlice = 1;
  };

  // Detect prefers-color-scheme and react to changes
  useEffect(() => {
    if (!window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyBorderGradient(mq.matches);

    const listener = (e) => applyBorderGradient(e.matches);
    mq.addEventListener
      ? mq.addEventListener("change", listener)
      : mq.addListener(listener);

    return () => {
      mq.removeEventListener
        ? mq.removeEventListener("change", listener)
        : mq.removeListener(listener);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ region, service, timeHorizon });
    }
  };

  const handleReset = () => {
    setRegion("");
    setService("");
    setTimeHorizon("");
    if (onSubmit) {
      onSubmit({ region: "", service: "", timeHorizon: "" });
    }
  };

  const isDisabled = !region || !service || !timeHorizon;

  return (
    <form
      className="
        py-10 px-12 rounded-3xl shadow-2xl border-4 border-transparent mx-auto relative
        bg-gradient-to-br from-[#f7f7f5] via-[#ececec] to-[#f3f5f7]
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-fuchsia-950/90 dark:to-orange-900/80
      "
      style={{
        maxWidth: 600,
        minHeight: 420,
        boxShadow:
          "0 4px 32px 0 rgba(171,166,140,0.12), 0 1.5px 12px 0 rgba(125,125,120,0.10)",
      }}
      onSubmit={handleSubmit}
    >
      <div
        ref={borderRef}
        className="absolute inset-0 rounded-3xl pointer-events-none z-0"
        style={{
          border: "2px solid",
          opacity: 0.22,
          zIndex: 0,
        }}
      />

      <h2
        className="
        text-2xl font-extrabold mb-2 text-center drop-shadow text-[#2d2a1f]
        dark:bg-gradient-to-r dark:from-fuchsia-400 dark:to-orange-300 dark:bg-clip-text dark:text-transparent
      "
      >
        Forecast Dashboard
      </h2>
      <p className="text-xs text-center mb-6 text-[#6b6a5a] dark:text-gray-400">
        Choose region, service, and horizon to personalize the Azure demand forecast.
      </p>

      <Dropdown
        label="Region"
        options={regionOptions}
        value={region}
        onChange={setRegion}
        labelClass="text-[#2d2a1f] dark:text-white"
      />
      <Dropdown
        label="Service"
        options={serviceOptions}
        value={service}
        onChange={setService}
        labelClass="text-[#2d2a1f] dark:text-white"
      />
      <Dropdown
        label="Time Horizon"
        options={timeHorizonOptions}
        value={timeHorizon}
        onChange={setTimeHorizon}
        labelClass="text-[#2d2a1f] dark:text-white"
      />

      <div className="mt-8 flex items-center gap-3">
        <button
          type="submit"
          disabled={isDisabled}
          className={`
            flex-1 py-3 rounded-lg transition-all font-bold text-lg shadow-md
            bg-gradient-to-r from-white via-[#f6f6f6] to-[#e8e7eb]
            hover:bg-gradient-to-r hover:from-[#ececec] hover:to-[#fafaf9]
            text-[#2d2a1f]
            dark:bg-gradient-to-r dark:from-fuchsia-700 dark:via-orange-500 dark:to-orange-400
            dark:hover:from-fuchsia-900 dark:hover:via-orange-600 dark:hover:to-orange-500
            dark:text-white
            ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
          style={{
            boxShadow: "0 0 10px 0 #afd8fa40, 0 2px 8px 0 #b7d2f730",
          }}
        >
          Show Forecast
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="
            px-4 py-3 rounded-lg text-sm font-medium border border-[#d4d4cf]
            bg-white/60 hover:bg-[#f3f3ef]
            text-[#4b4b3a]
            dark:bg-black/30 dark:border-fuchsia-800 dark:text-orange-100
            dark:hover:bg-black/60
          "
        >
          Reset
        </button>
      </div>

      {isDisabled && (
        <p className="mt-3 text-[11px] text-center text-[#8a8978] dark:text-gray-400">
          Select a region, service, and time horizon to enable the forecast.
        </p>
      )}
    </form>
  );
};

export default ForecastForm;
