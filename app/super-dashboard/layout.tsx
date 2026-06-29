"use client";

import { useState } from "react";
import { SuperSidebar } from "@/components/dashboard/SuperSidebar";

export default function SuperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header" style={{ background: "#1e1b4b" }}>
        <div className="mobile-header-brand">
          <div className="brand-icon" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.15" />
              <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="brand-name" style={{ color: "#ffe4e6" }}>BubbleX</span>
          <span className="brand-tag" style={{ color: "#f43f5e", background: "rgba(244,63,94,0.15)", borderColor: "rgba(244,63,94,0.3)" }}>Super</span>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SuperSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
