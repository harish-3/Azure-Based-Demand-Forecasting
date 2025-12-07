function getCapacityRecommendation({ region, resource, forecastPct }) {
  let level, delta, text;

  if (forecastPct >= 85) {
    level = "High Load";
    delta = 12;
    text = `Increase ${resource} capacity by +${delta}%`;
  } else if (forecastPct <= 50) {
    level = "Low Load";
    delta = 15;
    text = `Consider reducing ${resource} capacity by -${delta}% to save cost`;
  } else {
    level = "Moderate Load";
    delta = 0;
    text = `Keep ${resource} capacity steady and monitor usage`;
  }

  return {
    region,
    resource,
    forecastPct,
    level,
    delta,
    text,
  };
}
