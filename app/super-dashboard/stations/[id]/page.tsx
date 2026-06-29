"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface StationDetailData {
  station: {
    id: string;
    username: string;
    createdAt: string;
  };
  services: any[];
  orders: any[];
  complaints: any[];
  stats: {
    servicesCount: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    openComplaints: number;
    totalRevenue: number;
  };
}

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<StationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "orders" | "complaints">("services");

  // Add Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [addServiceError, setAddServiceError] = useState("");

  // Edit Service State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServicePrice, setEditServicePrice] = useState("");
  const [editServiceDuration, setEditServiceDuration] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editServiceError, setEditServiceError] = useState("");

  const fetchStationData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stations/${id}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch station details.");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching station details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchStationData();
    }
  }, [id, fetchStationData]);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingService(true);
    setAddServiceError("");
    try {
      const res = await fetch(`/api/admin/stations/${id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          price: Number(newServicePrice),
          duration: Number(newServiceDuration),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add service.");
      }
      setIsAddServiceModalOpen(false);
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceDuration("30");
      fetchStationData();
    } catch (err) {
      setAddServiceError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmittingService(false);
    }
  }

  async function handleToggleServiceVisibility(serviceId: string, currentVisibility: boolean) {
    try {
      const res = await fetch(`/api/admin/stations/${id}/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });
      if (!res.ok) throw new Error("Failed to toggle visibility");
      fetchStationData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating service");
    }
  }

  async function handleDeleteService(serviceId: string) {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/admin/stations/${id}/services/${serviceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      fetchStationData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting service");
    }
  }

  function openEditModal(service: any) {
    setEditingServiceId(service._id);
    setEditServiceName(service.name);
    setEditServicePrice(String(service.price));
    setEditServiceDuration(String(service.duration));
    setEditServiceError("");
  }

  async function handleEditService(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServiceId) return;
    setIsSubmittingEdit(true);
    setEditServiceError("");
    try {
      const res = await fetch(`/api/admin/stations/${id}/services/${editingServiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editServiceName,
          price: Number(editServicePrice),
          duration: Number(editServiceDuration),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update service.");
      }
      setEditingServiceId(null);
      fetchStationData();
    } catch (err) {
      setEditServiceError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="page-container">
        <div className="kpi-skeleton" style={{ height: "150px", marginBottom: "2rem" }} />
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card kpi-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="alert-error">{error || "Station not found."}</div>
        <button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: "1rem" }}>
          Go Back
        </button>
      </div>
    );
  }

  const { station, stats, services, orders, complaints } = data;

  return (
    <div className="page-container" style={{ position: "relative" }}>
      {/* Header */}
      <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", boxShadow: "0 8px 24px rgba(16,185,129,0.3)" }}>
        <button 
          onClick={() => router.push("/super-dashboard/stations")} 
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", fontWeight: 600 }}
        >
          ← Back to Stations
        </button>
        <div className="welcome-bg-circle welcome-bg-circle-1" />
        <div className="welcome-bg-circle welcome-bg-circle-2" />
        <div className="welcome-content">
          <h1 className="welcome-title">{station.username}</h1>
          <p className="welcome-sub">
            Station ID: {station.id} | Registered: {new Date(station.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="kpi-grid" style={{ marginBottom: "2rem" }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#ecfdf5", color: "#10b981" }}>💰</div>
          <div className="kpi-value" style={{ color: "#10b981" }}>₹{stats.totalRevenue.toLocaleString("en-IN")}</div>
          <div className="kpi-label">Total Revenue</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>📦</div>
          <div className="kpi-value" style={{ color: "#3b82f6" }}>{stats.totalOrders}</div>
          <div className="kpi-label">Total Orders</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>⚠️</div>
          <div className="kpi-value" style={{ color: "#ef4444" }}>{stats.openComplaints}</div>
          <div className="kpi-label">Open Complaints</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>🛠️</div>
          <div className="kpi-value" style={{ color: "#8b5cf6" }}>{stats.servicesCount}</div>
          <div className="kpi-label">Active Services</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #e2e8f0" }}>
        {(["services", "orders", "complaints"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #f43f5e" : "2px solid transparent",
              color: activeTab === tab ? "#f43f5e" : "#64748b",
              fontWeight: 600,
              textTransform: "capitalize",
              cursor: "pointer",
              marginBottom: "-2px"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="section-card">
        {activeTab === "services" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 className="section-title" style={{ margin: 0 }}>Services & Prices</h2>
              <button 
                onClick={() => setIsAddServiceModalOpen(true)}
                style={{
                  background: "#3b82f6", color: "white", padding: "0.5rem 1rem", borderRadius: "6px", fontWeight: "bold", border: "none", cursor: "pointer"
                }}
              >
                + Add Service
              </button>
            </div>
            
            {services.length === 0 ? (
              <p className="empty-sub" style={{ textAlign: "center", padding: "2rem" }}>No services found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Duration (min)</th>
                    <th>Price (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr key={svc._id} className="table-row">
                      <td className="cell-primary">{svc.name}</td>
                      <td>{svc.duration}</td>
                      <td><strong>₹{svc.price}</strong></td>
                      <td>
                        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={svc.isVisible !== false}
                            onChange={() => handleToggleServiceVisibility(svc._id, svc.isVisible !== false)}
                            style={{ marginRight: "0.5rem", cursor: "pointer", accentColor: "#10b981" }}
                          />
                          <span style={{ fontSize: "0.875rem", color: svc.isVisible !== false ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
                            {svc.isVisible !== false ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={() => openEditModal(svc)}
                          style={{
                            background: "none", border: "none", color: "#3b82f6", cursor: "pointer", marginRight: "1rem", fontWeight: 600
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(svc._id)}
                          style={{
                            background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 600
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="section-title">Orders</h2>
            {orders.length === 0 ? (
              <p className="empty-sub" style={{ textAlign: "center", padding: "2rem" }}>No orders found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Info</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="table-row">
                      <td className="cell-secondary">...{order._id.slice(-6)}</td>
                      <td>
                        <div className="cell-primary">{order.customerName}</div>
                        <div className="cell-secondary">{order.customerPhone}</div>
                      </td>
                      <td><strong>₹{order.amount || 0}</strong></td>
                      <td>
                        <span className="status-badge" style={{
                          color: order.status === "completed" ? "#10b981" : order.status === "pending" ? "#f59e0b" : "#3b82f6",
                          background: order.status === "completed" ? "#ecfdf5" : order.status === "pending" ? "#fffbeb" : "#eff6ff"
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="cell-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div>
            <h2 className="section-title">Complaints</h2>
            {complaints.length === 0 ? (
              <p className="empty-sub" style={{ textAlign: "center", padding: "2rem" }}>No complaints found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((comp) => (
                    <tr key={comp._id} className="table-row">
                      <td className="cell-primary">{comp.title}</td>
                      <td>
                        <span className="status-badge" style={{
                          color: comp.status === "open" ? "#ef4444" : "#10b981",
                          background: comp.status === "open" ? "#fef2f2" : "#ecfdf5"
                        }}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="cell-secondary">{new Date(comp.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "450px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Add New Service</h2>
            {addServiceError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{addServiceError}</div>}
            
            <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                    outline: "none"
                  }}
                  placeholder="e.g. Basic Wash"
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                      outline: "none"
                    }}
                    placeholder="e.g. 500"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                      outline: "none"
                    }}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  style={{
                    flex: 1, padding: "0.75rem", background: "#f1f5f9", color: "#64748b", border: "none",
                    borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmittingService}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1, padding: "0.75rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmittingService}
                >
                  {isSubmittingService ? "Saving..." : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingServiceId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "450px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Edit Service</h2>
            {editServiceError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{editServiceError}</div>}
            
            <form onSubmit={handleEditService} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                    outline: "none"
                  }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editServicePrice}
                    onChange={(e) => setEditServicePrice(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editServiceDuration}
                    onChange={(e) => setEditServiceDuration(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingServiceId(null)}
                  style={{
                    flex: 1, padding: "0.75rem", background: "#f1f5f9", color: "#64748b", border: "none",
                    borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1, padding: "0.75rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
