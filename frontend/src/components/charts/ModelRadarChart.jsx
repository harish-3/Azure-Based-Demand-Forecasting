import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function ModelRadarChart({ models }) {
  // Convert model data into radar chart series
  const radarData = [
    { metric: "MAE", LSTM: models[0].mae, RF: models[1].mae, ARIMA: models[2].mae },
    { metric: "RMSE", LSTM: models[0].rmse, RF: models[1].rmse, ARIMA: models[2].rmse },
    { metric: "MAPE", LSTM: models[0].mape, RF: models[1].mape, ARIMA: models[2].mape },
    {
      metric: "Training Time",
      LSTM: models[0].trainingTime,
      RF: models[1].trainingTime,
      ARIMA: models[2].trainingTime,
    },
    {
      metric: "Inference Speed",
      LSTM: models[0].inferenceSpeed,
      RF: models[1].inferenceSpeed,
      ARIMA: models[2].inferenceSpeed,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        🧭 Model Strength Radar View
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <Tooltip />
          <Radar name="LSTM" dataKey="LSTM" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
          <Radar name="Random Forest" dataKey="RF" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
          <Radar name="ARIMA" dataKey="ARIMA" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
