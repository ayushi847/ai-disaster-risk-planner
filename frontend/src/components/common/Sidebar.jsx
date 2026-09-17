


import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ADMIN_URL } from "../../services/api";

// ---- Simple inline icons (no external icon lib dependency) ----
const Icon = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const icons = {
  dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  map: <path d="M9 20l-5.5 2V6L9 4m0 16l6 2m-6-2V4m6 18l5.5-2V4L15 6m0 16V4m0 0L9 4" />,
  risk: <path d="M3 3v18h18M7 15l3-3 3 3 5-6" />,
  forecast: <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.3-2A5 5 0 0 0 6 18h11.5z" />,
  relocation: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  diagnostics: <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />,
  reports: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />,
  alerts: <path d="M12 9v4m0 4h.01M10.3 3.86 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0z" />,
  tasks: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
};

// ---- Config-driven nav. `path` is the actual route each item opens. ----
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard" }],
  },
  {
    label: "ANALYTICS",
    items: [
      { id: "map", label: "Map View", icon: "map", path: "/map-view" },
      { id: "risk", label: "Risk Analysis", icon: "risk", path: "/risk-analysis" },
      { id: "forecast", label: "Hazard Forecast", icon: "forecast", path: "/hazard-forecast" },
      { id: "relocation", label: "Relocation Planner", icon: "relocation", path: "/relocation-planner" },
      { id: "diagnostics", label: "AI Diagnostics", icon: "diagnostics", path: "/ai-diagnostics" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { id: "reports", label: "Reports", icon: "reports", path: "/reports" },
      { id: "alerts", label: "Alerts", icon: "alerts", path: "/alerts" },
      { id: "tasks", label: "Task Management", icon: "tasks", path: "/tasks" },
    ],
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? "72px" : "250px",
        transition: "width 0.2s ease",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Collapse toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px" }}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
          aria-label="Toggle sidebar"
        >
          <Icon path={<path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />} />
        </button>
      </div>

      {/* SOS Button */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 16px" }}>
        <a
          href="tel:112"
          title="Call 112 — Emergency Services"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: collapsed ? "52px" : "110px",
            height: collapsed ? "52px" : "110px",
            borderRadius: "50%",
            backgroundColor: "#dc2626",
            border: "3px solid #991b1b",
            color: "#ffffff",
            textDecoration: "none",
            cursor: "pointer",
            transition: "transform 0.15s, background-color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#b91c1c"; e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#dc2626"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: collapsed ? "14px" : "24px", fontWeight: "800", letterSpacing: "0.05em", lineHeight: 1 }}>SOS</span>
          {!collapsed && (
            <span style={{ fontSize: "13px", fontWeight: "600", marginTop: "4px", opacity: 0.85 }}>112</span>
          )}
        </a>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "0 12px", overflowY: "auto", flex: 1 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "18px" }}>
            {section.label && !collapsed && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  letterSpacing: "0.05em",
                  padding: "0 12px",
                  marginBottom: "6px",
                }}
              >
                {section.label}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "2px",
                  border: "none",
                  borderRadius: "8px",
                  background: isActive ? "#e0edff" : "transparent",
                  color: isActive ? "#2563eb" : "#475569",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  textDecoration: "none",
                  boxSizing: "border-box",
                })}
              >
                <Icon path={icons[item.icon]} />
                {!collapsed && item.label}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Authority Portal Link */}
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", paddingBottom: "16px" }}>
          {!collapsed && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                padding: "0 12px",
                marginBottom: "6px",
              }}
            >
              ADMINISTRATION
            </div>
          )}
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noreferrer"
            title={collapsed ? "Authority Portal" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
              textDecoration: "none",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dbeafe";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#eff6ff";
              e.currentTarget.style.borderColor = "#bfdbfe";
            }}
          >
            <span style={{ fontSize: "16px" }}>🏛️</span>
            {!collapsed && (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>Authority Portal</span>
                <span style={{ fontSize: "11px", color: "#60a5fa" }}>↗</span>
              </span>
            )}
          </a>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;