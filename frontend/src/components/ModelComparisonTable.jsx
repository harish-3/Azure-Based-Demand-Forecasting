import React, { useState } from "react";

export default function ModelComparisonTable({ models }) {
  const [sortKey, setSortKey] = useState("rmse");
  const [sortOrder, setSortOrder] = useState("asc");

  // Handle sorting logic
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedModels = [...models].sort((a, b) => {
    if (sortOrder === "asc") return a[sortKey] - b[sortKey];
    return b[sortKey] - a[sortKey];
  });

  const bestModel = sortedModels[0];

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        📊 Model Comparison Dashboard
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 text-left">
            <SortableTH label="Model Name" onSort={() => handleSort("name")} />
            <SortableTH label="MAE" onSort={() => handleSort("mae")} />
            <SortableTH label="RMSE" onSort={() => handleSort("rmse")} />
            <SortableTH label="MAPE" onSort={() => handleSort("mape")} />
            <SortableTH label="Training Time" onSort={() => handleSort("trainingTime")} />
            <SortableTH label="Inference Speed" onSort={() => handleSort("inferenceSpeed")} />
          </tr>
        </thead>

        <tbody>
          {sortedModels.map((model, idx) => (
            <tr
              key={idx}
              className={`transition cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${
                bestModel.name === model.name
                  ? "bg-green-100 dark:bg-green-900 font-semibold"
                  : "bg-white dark:bg-gray-900"
              }`}
              onClick={() => alert(`Selected model: ${model.name}`)}
            >
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.name}</td>
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.mae}</td>
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.rmse}</td>
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.mape}%</td>
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.trainingTime}</td>
              <td className="p-3 border text-gray-800 dark:text-gray-200">{model.inferenceSpeed}</td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper Component: Sortable Table Header
function SortableTH({ label, onSort }) {
  return (
    <th
      onClick={onSort}
      className="p-3 border text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
    >
      {label} ⬍
    </th>
  );
}
