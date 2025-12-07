import KPICard from "./KPIcard";
import ChartCard from "./ChartCard";
import TrendLineChart from "./charts/TrendLineChart";
import TrafficPieChart from "./charts/TrafficPieChart";

export default function MainArea() {
  const weeklyUsage = [
    { name: "Mon", value: 120 },
    { name: "Tue", value: 180 },
    { name: "Wed", value: 150 },
    { name: "Thu", value: 200 },
    { name: "Fri", value: 240 },
    { name: "Sat", value: 190 },
    { name: "Sun", value: 220 },
  ];

  const costBreakdown = [
    { name: "Compute", value: 48 },
    { name: "Storage", value: 22 },
    { name: "Networking", value: 16 },
    { name: "AI/ML", value: 14 },
  ];

  return (
    <div className="space-y-6">

      {/* ✅ KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Resources" value="342" delta={+4.3} subtitle="active services" />
        <KPICard title="Monthly Spend" value="$12,420" delta={-1.8} subtitle="vs last month" />
        <KPICard title="Active Alerts" value="3" delta={+1} subtitle="needs attention" />
        <KPICard title="Cost Savings" value="$920" delta={+5.6} subtitle="this month" />
      </div>

      {/* ✅ Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard
          title="Weekly Usage Trend"
          description="Past 7 days activity across Azure services"
        >
          <TrendLineChart data={weeklyUsage} />
        </ChartCard>

        <ChartCard
          title="Cost Breakdown"
          description="Distribution of resource spending"
        >
          <TrafficPieChart data={costBreakdown} />
        </ChartCard>
      </div>

      {/* ✅ Recommendations section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recommended Actions
        </h3>

        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li> Consider shutting down unused VMs to save cost.</li>
          <li>Enable auto-scaling for high traffic workloads.</li>
          <li>Review storage accounts with low access frequency.</li>
          <li>Update network security rules for best practices.</li>
        </ul>
      </div>

    </div>
  );
}