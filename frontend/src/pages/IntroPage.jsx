import React from "react";
import { motion } from "framer-motion";
import { FaCloud, FaChartLine, FaCogs } from "react-icons/fa";

export default function IntroPage() {
  const cards = [
    {
      title: "Smart Forecasts",
      desc: "Generate CPU, storage, and network forecasts with confidence bands and exportable data for further analysis.",
    },
    {
      title: "Optimization Insights",
      desc: "Get human-readable recommendations like autoscaling, rightsizing, and tiering to cut Azure costs safely.",
    },
    {
      title: "AI Assistant",
      desc: "Use a built‑in chat assistant to explain charts in simple language and answer \"why\" questions about trends.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-4xl px-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
          Azure Demand Forecasting and Optimization System
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
          Welcome to your AI-powered Azure resource management dashboard. This
          system analyzes cloud usage trends, forecasts future demands, and
          provides smart optimization insights to enhance performance and reduce
          operational costs.
        </p>

        {/* Icons row */}
        <div className="flex justify-center gap-6 mt-4 mb-8">
          <div className="flex flex-col items-center">
            <FaCloud className="text-blue-600 dark:text-blue-400 text-4xl mb-2" />
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Cloud Analysis
            </p>
          </div>
          <div className="flex flex-col items-center">
            <FaChartLine className="text-green-600 dark:text-green-400 text-4xl mb-2" />
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Usage Forecasting
            </p>
          </div>
          <div className="flex flex-col items-center">
            <FaCogs className="text-indigo-600 dark:text-indigo-400 text-4xl mb-2" />
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Optimization
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
          {cards.map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/70 border border-indigo-100 dark:border-gray-700 shadow-md px-4 py-5 text-left"
            >
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
