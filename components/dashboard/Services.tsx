"use client";

import { useEffect, useState, useCallback } from "react";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isVisible: boolean;
}

const CATEGORIES = ["General", "Washing", "Cleaning", "Detailing", "Protection", "Other"];

function ServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: Partial<Service> | null;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Service>>(
    service ?? { name: "", description: "", price: 0, duration: 30, category: "General", isVisible: true }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { setError("Service name is required."); return; }
    if (!form.price || Number(form.price) < 0) { setError("Valid price is required."); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{service?._id ? "Edit Service" : "Add New Service"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              id="svc-name"
              className="input-field"
              placeholder="e.g. Full Body Wash"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="svc-description"
              className="input-field"
              placeholder="Brief description of the service"
              rows={3}
              style={{ resize: "vertical" }}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                id="svc-price"
                className="input-field"
                type="number"
                min="0"
                placeholder="299"
                value={form.price ?? ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input
                id="svc-duration"
                className="input-field"
                type="number"
                min="1"
                placeholder="30"
                value={form.duration ?? ""}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              id="svc-category"
              className="input-field"
              value={form.category ?? "General"}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                id="svc-visible"
                type="checkbox"
                checked={form.isVisible ?? true}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                className="toggle-checkbox"
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-text">Visible to customers</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: "auto", padding: "0.7rem 1.5rem" }}>
              {saving ? "Saving…" : service?._id ? "Update Service" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalService, setModalService] = useState<Partial<Service> | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  async function handleSave(data: Partial<Service>) {
    if (data._id) {
      // Update
      await fetch(`/api/services/${data._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      // Create
      await fetch("/api/services", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    await fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE", credentials: "include" });
      await fetchServices();
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleVisibility(svc: Service) {
    setToggling(svc._id);
    try {
      await fetch(`/api/services/${svc._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !svc.isVisible }),
      });
      await fetchServices();
    } finally {
      setToggling(null);
    }
  }

  const grouped = CATEGORIES.reduce<Record<string, Service[]>>((acc, cat) => {
    const catServices = services.filter((s) => s.category === cat);
    if (catServices.length > 0) acc[cat] = catServices;
    return acc;
  }, {});

  // Services with unknown categories
  const knownCats = new Set(CATEGORIES);
  const otherServices = services.filter((s) => !knownCats.has(s.category));
  if (otherServices.length > 0) grouped["Other"] = otherServices;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-sub">{services.length} services · {services.filter(s => s.isVisible).length} visible to customers</p>
        </div>
        <button
          id="add-service-btn"
          className="btn-primary"
          style={{ width: "auto", padding: "0.65rem 1.25rem", fontSize: "0.875rem" }}
          onClick={() => setModalService(null)}
        >
          + Add Service
        </button>
      </div>

      {loading ? (
        <div className="services-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="service-card service-skeleton" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <div className="empty-title">No services yet</div>
          <div className="empty-sub">Add your first service to get started.</div>
          <button className="btn-primary" style={{ width: "auto", padding: "0.65rem 1.5rem", marginTop: "1rem" }} onClick={() => setModalService(null)}>
            + Add Service
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catServices]) => (
          <div key={cat} style={{ marginBottom: "2rem" }}>
            <div className="category-label">{cat}</div>
            <div className="services-grid">
              {catServices.map((svc) => (
                <div key={svc._id} className={`service-card ${!svc.isVisible ? "service-card-hidden" : ""}`}>
                  <div className="service-card-header">
                    <div>
                      <div className="service-name">{svc.name}</div>
                      <div className="service-category">{svc.category} · {svc.duration} min</div>
                    </div>
                    <div className="service-price">₹{svc.price.toLocaleString("en-IN")}</div>
                  </div>
                  {svc.description && (
                    <div className="service-desc">{svc.description}</div>
                  )}
                  <div className="service-card-footer">
                    <label className="toggle-label" style={{ gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={svc.isVisible}
                        disabled={toggling === svc._id}
                        onChange={() => handleToggleVisibility(svc)}
                        className="toggle-checkbox"
                      />
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                      <span style={{ fontSize: "0.8125rem", color: svc.isVisible ? "#10b981" : "#94a3b8" }}>
                        {svc.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </label>
                    <div className="action-btns">
                      <button
                        className="action-btn action-btn-primary"
                        onClick={() => setModalService(svc)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn action-btn-danger"
                        disabled={deleting === svc._id}
                        onClick={() => handleDelete(svc._id)}
                      >
                        {deleting === svc._id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modalService !== undefined && (
        <ServiceModal
          service={modalService}
          onClose={() => setModalService(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
