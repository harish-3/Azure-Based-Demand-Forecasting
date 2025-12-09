import { toast } from "react-toastify";

export function showHighRiskAlert({ resource, usage, threshold }) {
  toast.error(
    `${resource} demand is ${usage}% (threshold ${threshold}%) — High Risk`,
    {
      pauseOnHover: true,
      closeOnClick: true,
    }
  );
}
