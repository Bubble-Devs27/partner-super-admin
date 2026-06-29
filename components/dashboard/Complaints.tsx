"use client";

import { useEffect, useState, useCallback } from "react";

interface Complaint {
  _id: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string;
  status: "open" | "resolved";
  resolvedAt?: string;
  createdAt: string;
}

export function Complaints() {
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchComplaints = useCallback(async (status: "open" | "resolved") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints?status=${status}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints ?? []);
        setOpenCount(data.openCount ?? 0);
        setResolvedCount(data.resolvedCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(tab); }, [tab, fetchComplaints]);

  async function updateStatus(id: string, status: "open" | "resolved") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchComplaints(tab);
        setExpanded(null);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-sub">Manage customer complaints and feedback</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          id="complaints-tab-open"
          className={`tab-btn ${tab === "open" ? "tab-btn-active" : ""}`}
          onClick={() => setTab("open")}
        >
          Open
          <span className="tab-count" style={{ background: tab === "open" ? "#ef4444" : "#e2e8f0", color: tab === "open" ? "#fff" : "#64748b" }}>
            {openCount}
          </span>
        </button>
        <button
          id="complaints-tab-resolved"
          className={`tab-btn ${tab === "resolved" ? "tab-btn-active" : ""}`}
          onClick={() => setTab("resolved")}
        >
          Resolved
          <span className="tab-count" style={{ background: tab === "resolved" ? "#10b981" : "#e2e8f0", color: tab === "resolved" ? "#fff" : "#64748b" }}>
            {resolvedCount}
          </span>
        </button>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="complaint-skeleton" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === "open" ? "🎉" : "📭"}</div>
          <div className="empty-title">
            {tab === "open" ? "No open complaints!" : "No resolved complaints yet"}
          </div>
          <div className="empty-sub">
            {tab === "open"
              ? "Your customers are happy. Keep it up!"
              : "Resolve an open complaint first."}
          </div>
        </div>
      ) : (
        <div className="complaints-list">
          {complaints.map((c) => (
            <div key={c._id} className="complaint-card">
              <div
                className="complaint-header"
                onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                style={{ cursor: "pointer" }}
              >
                <div className="complaint-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      className="status-badge"
                      style={{
                        color: c.status === "open" ? "#ef4444" : "#10b981",
                        background: c.status === "open" ? "#fef2f2" : "#ecfdf5",
                      }}
                    >
                      {c.status === "open" ? "● Open" : "✓ Resolved"}
                    </span>
                    <span className="complaint-subject">{c.subject}</span>
                  </div>
                  <div className="complaint-info">
                    <span>{c.customerName}</span>
                    <span>·</span>
                    <span>{c.customerPhone}</span>
                    <span>·</span>
                    <span>
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  style={{
                    transform: expanded === c._id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {expanded === c._id && (
                <div className="complaint-body">
                  <p className="complaint-desc">{c.description}</p>
                  {c.resolvedAt && (
                    <div className="resolved-note">
                      ✓ Resolved on{" "}
                      {new Date(c.resolvedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  <div className="complaint-actions">
                    {c.status === "open" ? (
                      <button
                        id={`resolve-${c._id}`}
                        className="action-btn action-btn-success"
                        style={{ padding: "0.5rem 1rem" }}
                        disabled={updating === c._id}
                        onClick={() => updateStatus(c._id, "resolved")}
                      >
                        {updating === c._id ? "Updating…" : "✓ Mark as Resolved"}
                      </button>
                    ) : (
                      <button
                        id={`reopen-${c._id}`}
                        className="action-btn action-btn-primary"
                        style={{ padding: "0.5rem 1rem" }}
                        disabled={updating === c._id}
                        onClick={() => updateStatus(c._id, "open")}
                      >
                        {updating === c._id ? "Updating…" : "↩ Reopen"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
