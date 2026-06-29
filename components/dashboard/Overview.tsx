"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  openComplaints: number;
  activeServices: number;
}

export function Overview() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [revenueRes, ordersRes, complaintsRes, servicesRes] = await Promise.all([
        fetch("/api/revenue?period=month", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
        fetch("/api/complaints", { credentials: "include" }),
        fetch("/api/services", { credentials: "include" }),
      ]);

      const [revenue, orders, complaints, services] = await Promise.all([
        revenueRes.json(),
        ordersRes.json(),
        complaintsRes.json(),
        servicesRes.json(),
      ]);

      setStats({
        totalRevenue: revenue.totalRevenue ?? 0,
        totalOrders: (orders.pendingCount ?? 0) + (orders.completedCount ?? 0),
        pendingOrders: orders.pendingCount ?? 0,
        completedOrders: orders.completedCount ?? 0,
        openComplaints: complaints.openCount ?? 0,
        activeServices: (services.services ?? []).filter((s: { isVisible: boolean }) => s.isVisible).length,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST", credentials: "include" });
      await fetchStats();
    } finally {
      setSeeding(false);
    }
  }

  const kpis = stats
    ? [
        {
          label: "Monthly Revenue",
          value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
          sub: "This month (completed orders)",
          icon: "💰",
          color: "#10b981",
          bg: "#ecfdf5",
          href: "/dashboard/revenue",
        },
        {
          label: "Total Orders",
          value: stats.totalOrders.toString(),
          sub: `${stats.completedOrders} completed`,
          icon: "📋",
          color: "#f97316",
          bg: "#fff7ed",
          href: "/dashboard/orders",
        },
        {
          label: "Pending Orders",
          value: stats.pendingOrders.toString(),
          sub: "Awaiting completion",
          icon: "⏳",
          color: "#f59e0b",
          bg: "#fffbeb",
          href: "/dashboard/orders",
        },
        {
          label: "Open Complaints",
          value: stats.openComplaints.toString(),
          sub: "Need attention",
          icon: "💬",
          color: "#ef4444",
          bg: "#fef2f2",
          href: "/dashboard/complaints",
        },
        {
          label: "Active Services",
          value: stats.activeServices.toString(),
          sub: "Visible to customers",
          icon: "⚙️",
          color: "#ea580c",
          bg: "#fff7ed",
          href: "/dashboard/services",
        },
      ]
    : [];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-bg-circle welcome-bg-circle-1" />
        <div className="welcome-bg-circle welcome-bg-circle-2" />
        <div className="welcome-content">
          <p className="welcome-greeting">Welcome back 👋</p>
          <h1 className="welcome-title">Hello, {user?.username}!</h1>
          <p className="welcome-sub">
            Here&apos;s your station overview for today.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="kpi-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-card kpi-skeleton" />
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <button
              key={kpi.label}
              className="kpi-card"
              onClick={() => router.push(kpi.href)}
              style={{ cursor: "pointer" }}
            >
              <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="kpi-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="section-card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          {[
            { label: "Add New Service", icon: "➕", href: "/dashboard/services", color: "#6366f1" },
            { label: "View Revenue", icon: "📊", href: "/dashboard/revenue", color: "#10b981" },
            { label: "Manage Orders", icon: "📦", href: "/dashboard/orders", color: "#f59e0b" },
            { label: "Resolve Complaints", icon: "🔔", href: "/dashboard/complaints", color: "#ef4444" },
          ].map((action) => (
            <button
              key={action.label}
              id={`quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="quick-action-btn"
              onClick={() => router.push(action.href)}
            >
              <span className="qa-icon" style={{ background: `${action.color}18`, color: action.color }}>
                {action.icon}
              </span>
              <span className="qa-label">{action.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
