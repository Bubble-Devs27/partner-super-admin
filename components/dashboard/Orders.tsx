"use client";

import { useEffect, useState, useCallback } from "react";

type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface Order {
  _id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber: string;
  status: OrderStatus;
  amount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  in_progress: "#6366f1",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_BG: Record<OrderStatus, string> = {
  pending: "#fffbeb",
  in_progress: "#eef2ff",
  completed: "#ecfdf5",
  cancelled: "#fef2f2",
};

export function Orders() {
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: "pending" | "completed") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${status}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPendingCount(data.pendingCount ?? 0);
        setCompletedCount(data.completedCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(tab);
  }, [tab, fetchOrders]);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders(tab);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">Manage service orders from your customers</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          id="orders-tab-pending"
          className={`tab-btn ${tab === "pending" ? "tab-btn-active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Pending
          <span className="tab-count" style={{ background: tab === "pending" ? "#6366f1" : "#e2e8f0", color: tab === "pending" ? "#fff" : "#64748b" }}>
            {pendingCount}
          </span>
        </button>
        <button
          id="orders-tab-completed"
          className={`tab-btn ${tab === "completed" ? "tab-btn-active" : ""}`}
          onClick={() => setTab("completed")}
        >
          Completed
          <span className="tab-count" style={{ background: tab === "completed" ? "#6366f1" : "#e2e8f0", color: tab === "completed" ? "#fff" : "#64748b" }}>
            {completedCount}
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2rem" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-skeleton-row" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No {tab} orders</div>
            <div className="empty-sub">Orders will appear here once received.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  {tab === "pending" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="table-row">
                    <td>
                      <div className="cell-primary">{order.customerName}</div>
                      <div className="cell-secondary">{order.customerPhone}</div>
                    </td>
                    <td>{order.serviceName}</td>
                    <td>
                      <span className="vehicle-badge">{order.vehicleNumber}</span>
                    </td>
                    <td>
                      <strong>₹{order.amount.toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          color: STATUS_COLORS[order.status],
                          background: STATUS_BG[order.status],
                        }}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="cell-secondary">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    {tab === "pending" && (
                      <td>
                        <div className="action-btns">
                          {order.status === "pending" && (
                            <button
                              className="action-btn action-btn-primary"
                              disabled={updating === order._id}
                              onClick={() => updateStatus(order._id, "in_progress")}
                            >
                              Start
                            </button>
                          )}
                          {(order.status === "pending" || order.status === "in_progress") && (
                            <button
                              className="action-btn action-btn-success"
                              disabled={updating === order._id}
                              onClick={() => updateStatus(order._id, "completed")}
                            >
                              Complete
                            </button>
                          )}
                          <button
                            className="action-btn action-btn-danger"
                            disabled={updating === order._id}
                            onClick={() => updateStatus(order._id, "cancelled")}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
