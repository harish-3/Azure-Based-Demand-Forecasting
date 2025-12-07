import React from 'react';

const Dropdown = ({ label, options, value, onChange, labelClass = "" }) => (
  <div className="mb-6">
    <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
      {label}
    </label>
    <select
      className="
        w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-fuchsia-500 rounded-lg
        font-medium text-[#2d2a1f] dark:text-white shadow-inner
        focus:border-yellow-200 dark:focus:border-orange-500
        focus:ring-2 focus:ring-yellow-50 dark:focus:ring-fuchsia-400
        transition-all
      "
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option
        value=""
        className="text-[#2d2a1f] dark:text-white"
      >
        Select {label}
      </option>
      {options.map(option => (
        <option key={option} value={option} className="text-[#2d2a1f] dark:text-white">
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default Dropdown;
