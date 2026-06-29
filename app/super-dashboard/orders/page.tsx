"use client";

import { useEffect, useState, useCallback } from "react";

interface Order {
  _id: string;
  stationId: {
    _id: string;
    username: string;
  } | string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber: string;
  amount: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export default function SuperDashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch orders.");
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      // Optimistically update UI
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating order status");
      fetchOrders(); // Revert on failure
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return { color: "#10b981", bg: "#ecfdf5" };
      case "in_progress": return { color: "#3b82f6", bg: "#eff6ff" };
      case "cancelled": return { color: "#ef4444", bg: "#fef2f2" };
      default: return { color: "#f59e0b", bg: "#fffbeb" }; // pending
    }
  };

  return (
    <div className="page-container">
      <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", boxShadow: "0 8px 24px rgba(15,23,42,0.3)" }}>
        <div className="welcome-bg-circle welcome-bg-circle-1" />
        <div className="welcome-bg-circle welcome-bg-circle-2" />
        <div className="welcome-content">
          <h1 className="welcome-title">All Orders</h1>
          <p className="welcome-sub">
            Monitor and manage all customer orders across every service station in the platform.
          </p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <div className="section-card" style={{ marginTop: "1.5rem" }}>
        <h2 className="section-title">Order Directory</h2>
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-skeleton-row" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No orders found</div>
            <div className="empty-sub">Customer orders will appear here once placed.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID / Date</th>
                  <th>Station</th>
                  <th>Customer Info</th>
                  <th>Vehicle Info</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusStyle = getStatusColor(order.status);
                  const stationName = typeof order.stationId === 'object' && order.stationId !== null ? order.stationId.username : "Unknown Station";
                  const stationIdStr = typeof order.stationId === 'object' && order.stationId !== null ? order.stationId._id : order.stationId;

                  return (
                    <tr key={order._id} className="table-row">
                      <td>
                        <div className="cell-primary">...{order._id.slice(-6)}</div>
                        <div className="cell-secondary">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td>
                        <div className="cell-primary">{stationName}</div>
                        <div className="cell-secondary">ID: ...{String(stationIdStr).slice(-6)}</div>
                      </td>
                      <td>
                        <div className="cell-primary">{order.customerName}</div>
                        <div className="cell-secondary">{order.customerPhone}</div>
                      </td>
                      <td>
                        <div className="cell-primary">{order.vehicleNumber}</div>
                        <div className="cell-secondary">{order.serviceName}</div>
                      </td>
                      <td>
                        <strong>₹{order.amount.toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "6px",
                            border: `1px solid ${statusStyle.color}40`,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                            fontSize: "0.875rem"
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
