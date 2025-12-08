// Backend API base URL - adjust if your backend runs on a different port
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Helper function to handle API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ==================== Backend API Functions ====================

/**
 * Health check endpoint
 */
export async function fetchHealth() {
  return apiRequest("/");
}

/**
 * Get model metrics and status
 */
export async function fetchMetrics() {
  return apiRequest("/api/metrics");
}


/**
 * Get 7-day CPU forecast
 */
export async function fetchForecast7(region = "East") {
  return apiRequest(`/api/forecast_7?region=${encodeURIComponent(region)}`);
}

/**
 * Get 30-day CPU forecast
 */
export async function fetchForecast30(region = "East") {
  return apiRequest(`/api/forecast_30?region=${encodeURIComponent(region)}`);
}

/**
 * Single CPU prediction with custom input
 */
export async function predictCpu(inputData) {
  return apiRequest("/api/predict_cpu", {
    method: "POST",
    body: JSON.stringify(inputData),
  });
}

/**
 * Capacity planning analysis
 */
export async function fetchCapacityPlanning(capacity, forecastDays = 7) {
  return apiRequest("/api/capacity_planning", {
    method: "POST",
    body: JSON.stringify({ capacity, forecast_days: forecastDays }),
  });
}

/**
 * Get optimization suggestions
 */
export async function fetchOptimization(capacity, forecastDays = 7, region = "unknown") {
  return apiRequest("/api/optimization", {
    method: "POST",
    body: JSON.stringify({ capacity, forecast_days: forecastDays, region }),
  });
}

/**
 * Get model monitoring/health data
 */
export async function fetchMonitoring(mape = 8.5) {
  return apiRequest(`/api/monitoring?mape=${mape}`);
}

/**
 * Get comprehensive report
 */
export async function fetchReport(capacity = 10000, mape = 8.5) {
  return apiRequest(`/api/report?capacity=${capacity}&mape=${mape}`);
}

/**
 * Get multi-region capacity comparison data
 */
export async function fetchMultiRegion(regions = "East US,West Europe,Central India") {
  return apiRequest(`/api/multi_region?regions=${encodeURIComponent(regions)}`);
}

// ==================== Legacy/Compatibility Functions ====================

/**
 * @deprecated Use fetchForecast7() instead
 */
export async function fetchCpuUsage() {
  return fetchForecast7();
}

/**
 * @deprecated Use fetchReport() instead
 */
export async function fetchComparison() {
  return fetchReport();
}

/**
 * @deprecated Use fetchForecast30() instead
 */
export async function fetchSeasonal() {
  return fetchForecast30();
}

/**
 * @deprecated Use fetchReport() or fetchOptimization() instead
 */
export async function fetchInsights() {
  return fetchReport();
}
