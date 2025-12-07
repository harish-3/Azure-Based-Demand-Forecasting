import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function BarComparisonChart({ data }) {
  // Colors for bars
  const currentColor = "#99bde7"; // light blue, light mode
  const forecastColor = "#bfcfdc"; // silver, light mode
  const currentColorDark = "#f472b6"; // magenta, dark mode
  const forecastColorDark = "#fb923c"; // orange, dark mode

  return (
    <div className="h-72 bg-white dark:bg-gray-900 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
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

          {/* Current Usage */}
          <Bar
            dataKey="current"
            name="Current"
            fill={currentColor}
            className="dark:!fill-[#f472b6]"
          />

          {/* Forecast */}
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
