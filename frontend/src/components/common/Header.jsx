const Header = () => {
  return (
    <header
      style={{
        height: "64px",
        background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* BRAND & TITLE */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            boxShadow: "0 0 12px rgba(59, 130, 246, 0.5)",
          }}
        >
          🛡️
        </div>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "800", letterSpacing: "0.5px" }}>
            AI Disaster Risk Assessment & Relocation Platform
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500" }}>
            SIH26191 • Real-Time Spatial Optimization & Multi-Hazard AI Diagnostics
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS PILLS */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11.5px",
            color: "#34d399",
            fontWeight: "600",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          ML Engine v2 (Hungarian + Groq)
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11.5px",
            color: "#60a5fa",
            fontWeight: "600",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6" }} />
          PostGIS 71 Habitations
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11.5px",
            color: "#f87171",
            fontWeight: "600",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
          17 Critical Zones
        </div>

        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#ffffff",
            fontWeight: "600",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          <span>⚖️</span>
          Authority Admin Portal ↗
        </a>
      </div>
    </header>
  );
};

export default Header;