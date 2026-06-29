"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StationStats {
  servicesCount: number;
  pendingOrders: number;
  completedOrders: number;
  openComplaints: number;
  totalRevenue: number;
}

interface Station {
  id: string;
  username: string;
  createdAt: string;
  stats: StationStats;
}

interface PlatformTotals {
  totalRevenue: number;
  totalOrders: number;
  totalComplaints: number;
  totalStations: number;
}

export default function SuperDashboardPage() {
  const { user } = useAuthStore();
  const [stations, setStations] = useState<Station[]>([]);
  const [totals, setTotals] = useState<PlatformTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/stations", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to fetch admin data.");
        }
        const data = await res.json();
        setStations(data.stations ?? []);
        setTotals(data.totals ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching platform statistics.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const kpiStats = totals
    ? [
        {
          label: "Active Stations",
          value: totals.totalStations.toString(),
          sub: "Partner service stations",
          icon: "🏢",
          color: "#f43f5e",
          bg: "#fff1f2",
        },
        {
          label: "Platform Revenue",
          value: `₹${totals.totalRevenue.toLocaleString("en-IN")}`,
          sub: "Aggregated station earnings",
          icon: "💰",
          color: "#10b981",
          bg: "#ecfdf5",
        },
        {
          label: "Total Platform Orders",
          value: totals.totalOrders.toString(),
          sub: "Completed & pending orders",
          icon: "📦",
          color: "#f59e0b",
          bg: "#fffbeb",
        },
        {
          label: "Total Open Complaints",
          value: totals.totalComplaints.toString(),
          sub: "Require partner resolution",
          icon: "🔔",
          color: "#ef4444",
          bg: "#fef2f2",
        },
      ]
    : [];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)", boxShadow: "0 8px 24px rgba(244,63,94,0.3)" }}>
        <div className="welcome-bg-circle welcome-bg-circle-1" />
        <div className="welcome-bg-circle welcome-bg-circle-2" />
        <div className="welcome-content">
          <p className="welcome-greeting">Platform Control Center 🛠️</p>
          <h1 className="welcome-title">System Administrator: {user?.username}</h1>
          <p className="welcome-sub">
            Monitor registered partner service stations, verify service counts, and check system performance.
          </p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {/* KPI Stats */}
      {loading ? (
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card kpi-skeleton" />
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          {kpiStats.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="kpi-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      {!loading && totals && (
        <div className="section-card" style={{ marginTop: "1.5rem" }}>
          <h2 className="section-title">Total Platform Revenue</h2>
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Total Platform",
                    revenue: totals.totalRevenue,
                  },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{ fill: "rgba(244,63,94,0.05)" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={150} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
