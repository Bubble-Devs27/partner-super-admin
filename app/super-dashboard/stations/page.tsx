"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  isActive?: boolean;
  stats: StationStats;
}

export default function SuperDashboardStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stations", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch stations data.");
      }
      const data = await res.json();
      setStations(data.stations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching stations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  async function handleAddStation(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create station.");
      }
      setIsAddModalOpen(false);
      setNewUsername("");
      setNewPassword("");
      fetchStations();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStationActive(stationId: string, currentStatus: boolean, username: string) {
    const action = currentStatus ? "deactivate" : "activate";
    const msg = currentStatus 
      ? `Are you sure you want to deactivate the station "${username}"? They will no longer be able to log in.`
      : `Are you sure you want to activate the station "${username}"?`;
      
    if (!window.confirm(msg)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/stations/${stationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchStations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating station status");
    }
  }

  return (
    <div className="page-container" style={{ position: "relative" }}>
      <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", boxShadow: "0 8px 24px rgba(30,27,75,0.3)" }}>
        <div className="welcome-bg-circle welcome-bg-circle-1" />
        <div className="welcome-bg-circle welcome-bg-circle-2" />
        <div className="welcome-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="welcome-title">Service Stations</h1>
            <p className="welcome-sub">
              Manage all registered partner service stations, view their overall performance, and drill down into specific details.
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: "#10b981", color: "white", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", boxShadow: "0 4px 6px rgba(16,185,129,0.3)"
            }}
          >
            + Add Station Admin
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <div className="section-card" style={{ marginTop: "1.5rem" }}>
        <h2 className="section-title">All Stations</h2>
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-skeleton-row" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-title">No service stations found</div>
            <div className="empty-sub">Service stations will appear here when partners register.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Station Details</th>
                  <th>Registered On</th>
                  <th>Active Services</th>
                  <th>Completed Orders</th>
                  <th>Pending Orders</th>
                  <th>Earnings (₹)</th>
                  <th>Complaints</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id} className="table-row">
                    <td>
                      <div className="cell-primary">{station.username}</div>
                      <div className="cell-secondary">ID: {station.id}</div>
                    </td>
                    <td className="cell-secondary">
                      {new Date(station.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: "#3b82f6", background: "#eff6ff" }}>
                        {station.stats.servicesCount} Services
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: "#10b981", background: "#ecfdf5" }}>
                        {station.stats.completedOrders} Orders
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: "#f59e0b", background: "#fffbeb" }}>
                        {station.stats.pendingOrders} Orders
                      </span>
                    </td>
                    <td>
                      <strong>₹{station.stats.totalRevenue.toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                      {station.stats.openComplaints > 0 ? (
                        <span className="status-badge" style={{ color: "#ef4444", background: "#fef2f2" }}>
                          ⚠️ {station.stats.openComplaints} Open
                        </span>
                      ) : (
                        <span className="status-badge" style={{ color: "#10b981", background: "#ecfdf5" }}>
                          ✓ Clear
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div 
                          onClick={() => handleToggleStationActive(station.id, station.isActive !== false, station.username)}
                          style={{
                            width: "44px", height: "24px", borderRadius: "24px",
                            background: station.isActive !== false ? "#10b981" : "#cbd5e1",
                            position: "relative", cursor: "pointer", transition: "background 0.3s"
                          }}
                        >
                          <div style={{
                            width: "18px", height: "18px", background: "white", borderRadius: "50%",
                            position: "absolute", top: "3px", transition: "left 0.3s",
                            left: station.isActive !== false ? "23px" : "3px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                        <span style={{ fontSize: "0.875rem", color: station.isActive !== false ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                          {station.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/super-dashboard/stations/${station.id}`)}
                        className="btn-primary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Station Modal */}
      {isAddModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "400px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Add New Station Admin</h2>
            {addError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{addError}</div>}
            
            <form onSubmit={handleAddStation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                    outline: "none"
                  }}
                  placeholder="e.g. station_west"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                    outline: "none"
                  }}
                  placeholder="Enter a secure password"
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    flex: 1, padding: "0.75rem", background: "#f1f5f9", color: "#64748b", border: "none",
                    borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1, padding: "0.75rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer"
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
