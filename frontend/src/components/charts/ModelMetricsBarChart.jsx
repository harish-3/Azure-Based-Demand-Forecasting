import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ModelMetricsBarChart({ models }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        📊 Model Metrics Comparison
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={models}>
          <XAxis dataKey="name" stroke="#888" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="mae" fill="#4F46E5" name="MAE" />
          <Bar dataKey="rmse" fill="#10B981" name="RMSE" />
          <Bar dataKey="mape" fill="#F59E0B" name="MAPE (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
