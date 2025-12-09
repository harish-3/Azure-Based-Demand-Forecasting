import { motion } from "framer-motion";

export default function KPICard({ title, value, delta, subtitle, icon }) {
  const isPositive =
    typeof delta === "number"
      ? delta >= 0
      : delta?.toString().startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="text-gray-400 dark:text-gray-300">
            {icon}
          </div>
        )}
      </div>

      {delta !== undefined && (
        <div className="mt-3 text-sm">
          <span
            className={[
              "inline-flex items-center rounded-md px-2 py-1 font-medium",
              isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
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
