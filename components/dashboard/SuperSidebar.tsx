"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function SuperSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    logout();
    router.push("/login");
    router.refresh();
    if (onClose) onClose();
  }

  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand" style={{ background: "#1e1b4b", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="brand-icon" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" />
            <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="brand-name" style={{ color: "#ffe4e6" }}>BubbleX</span>
        <span className="brand-tag" style={{ color: "#f43f5e", background: "rgba(244,63,94,0.15)", borderColor: "rgba(244,63,94,0.3)" }}>Super</span>
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar-nav" style={{ background: "#0f172a" }}>
        <div className="nav-label" style={{ color: "rgba(255,255,255,0.3)" }}>Admin Controls</div>
        <Link
          href="/super-dashboard"
          className={`nav-item ${pathname === "/super-dashboard" ? "nav-item-active" : ""}`}
          style={pathname === "/super-dashboard" ? { background: "rgba(244,63,94,0.2)" } : {}}
          onClick={() => { if (onClose) onClose(); }}
        >
          <span className="nav-icon" style={pathname === "/super-dashboard" ? { color: "#f43f5e" } : {}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </span>
          <span className="nav-label-text">Overview</span>
          {pathname === "/super-dashboard" && <span className="nav-indicator" style={{ background: "#f43f5e" }} />}
        </Link>

        <Link
          href="/super-dashboard/stations"
          className={`nav-item ${pathname.startsWith("/super-dashboard/stations") ? "nav-item-active" : ""}`}
          style={pathname.startsWith("/super-dashboard/stations") ? { background: "rgba(244,63,94,0.2)" } : {}}
          onClick={() => { if (onClose) onClose(); }}
        >
          <span className="nav-icon" style={pathname.startsWith("/super-dashboard/stations") ? { color: "#f43f5e" } : {}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="nav-label-text">Service Stations</span>
          {pathname.startsWith("/super-dashboard/stations") && <span className="nav-indicator" style={{ background: "#f43f5e" }} />}
        </Link>

        <Link
          href="/super-dashboard/orders"
          className={`nav-item ${pathname.startsWith("/super-dashboard/orders") ? "nav-item-active" : ""}`}
          style={pathname.startsWith("/super-dashboard/orders") ? { background: "rgba(244,63,94,0.2)" } : {}}
          onClick={() => { if (onClose) onClose(); }}
        >
          <span className="nav-icon" style={pathname.startsWith("/super-dashboard/orders") ? { color: "#f43f5e" } : {}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <span className="nav-label-text">All Orders</span>
          {pathname.startsWith("/super-dashboard/orders") && <span className="nav-indicator" style={{ background: "#f43f5e" }} />}
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="user-info">
          <div className="user-avatar" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username}</span>
            <span className="user-role" style={{ color: "#f43f5e", fontWeight: 600, textTransform: "capitalize" }}>
              {user?.role ? user.role.replace("-", " ") : "Super Admin"}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
