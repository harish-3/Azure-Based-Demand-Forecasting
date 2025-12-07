import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

export default function ChartCard({
  title,
  labels,
  dataValues,
  chartType = "line",
  large = false,
  multiLine = false,
}) {
  const isMultiDataset = multiLine && Array.isArray(dataValues);

  const data = {
    labels,
    datasets: isMultiDataset
      ? dataValues.map((dataset, i) => ({
          label: dataset.label || `Dataset ${i + 1}`,
          data: dataset.data,
          borderColor: i === 0 ? "rgb(37, 99, 235)" : "rgb(99, 102, 241)",
          backgroundColor:
            i === 0
              ? "rgba(37, 99, 235, 0.3)"
              : "rgba(99, 102, 241, 0.3)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        }))
      : [
          {
            label: title,
            data: dataValues,
            borderColor: "rgb(37, 99, 235)",
            backgroundColor: "rgba(37, 99, 235, 0.3)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: isMultiDataset,
        position: "top",
        labels: {
          color: "#9ca3af",
          font: { size: 12 },
        },
      },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(156, 163, 175, 0.2)" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(156, 163, 175, 0.2)" },
      },
    },
  };

  const ChartComponent = chartType === "bar" ? Bar : Line;

  return (
    <div
      className={`bg-white dark:bg-gray-800 dark:text-white shadow-xl rounded-2xl p-6 mx-auto transition-all ${
        large ? "max-w-6xl" : "max-w-4xl"
      }`}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
      <div
        className={`${
          large ? "h-[500px]" : "h-[350px]"
        } w-full flex justify-center`}
      >
        <ChartComponent data={data} options={options} />
      </div>
    </div>
  );
}
