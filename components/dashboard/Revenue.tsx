"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Period = "day" | "week" | "month";

interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface RevenueData {
  chartData: ChartPoint[];
  totalRevenue: number;
  totalOrders: number;
  period: Period;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: "#f97316" }} />
        <span>Revenue</span>
        <strong>₹{payload[0]?.value?.toLocaleString("en-IN")}</strong>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: "#10b981" }} />
        <span>Orders</span>
        <strong>{payload[1]?.value ?? 0}</strong>
      </div>
    </div>
  );
}

export function Revenue() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/revenue?period=${p}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue(period);
  }, [period, fetchRevenue]);

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue</h1>
          <p className="page-sub">Track earnings from completed orders</p>
        </div>
        <div className="period-toggle">
          {periods.map((p) => (
            <button
              key={p.value}
              id={`period-${p.value}`}
              className={`period-btn ${period === p.value ? "period-btn-active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary">
        <div className="rev-card">
          <div className="rev-card-label">Total Revenue</div>
          <div className="rev-card-value">
            ₹{(data?.totalRevenue ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="rev-card-sub">
            {period === "day" ? "Last 24 hours" : period === "week" ? "Last 7 days" : "This month"} · completed orders
          </div>
        </div>
        <div className="rev-card">
          <div className="rev-card-label">Orders Completed</div>
          <div className="rev-card-value" style={{ color: "#10b981" }}>
            {data?.totalOrders ?? 0}
          </div>
          <div className="rev-card-sub">Across the selected period</div>
        </div>
        <div className="rev-card">
          <div className="rev-card-label">Avg. Order Value</div>
          <div className="rev-card-value" style={{ color: "#f59e0b" }}>
            ₹{data?.totalOrders
              ? Math.round((data.totalRevenue ?? 0) / data.totalOrders).toLocaleString("en-IN")
              : "0"}
          </div>
          <div className="rev-card-sub">Revenue ÷ orders</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="section-card">
        <h2 className="section-title">Revenue Breakdown</h2>
        {loading ? (
          <div className="chart-skeleton" />
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={data?.chartData ?? []}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === "month" ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#f97316" }} />
                Revenue (₹)
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#10b981" }} />
                Orders (count)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
