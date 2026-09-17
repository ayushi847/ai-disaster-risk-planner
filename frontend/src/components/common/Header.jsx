import { useEffect, useState } from "react";
import { villages as fallbackVillages } from "../../utils/villages";
import { getVillages, ADMIN_URL } from "../../services/api";

const Header = () => {
  const [totalHabitations, setTotalHabitations] = useState(fallbackVillages.length);
  const [criticalZones, setCriticalZones] = useState(() =>
    fallbackVillages.filter(v => String(v.riskLevel || "").toUpperCase() === "CRITICAL").length
  );

  useEffect(() => {
    getVillages().then(list => {
      if (Array.isArray(list) && list.length > 0) {
        setTotalHabitations(list.length);
        const crit = list.filter(v => String(v?.riskLevel || "").toUpperCase() === "CRITICAL").length;
        setCriticalZones(crit);
      }
    }).catch(() => {});
  }, []);

  return (
    <header
      style={{
        height: "56px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        color: "#1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* LEFT: identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 24px",
          height: "56px",
          borderRight: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "#b91c1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#fff", letterSpacing: "0.04em" }}>IN</span>
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", lineHeight: "1.3", letterSpacing: "0.01em" }}>
            AI Disaster Risk &amp; Relocation Platform
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.3", marginTop: "1px" }}>
            SIH26191 · NDMA · Hazard Assessment &amp; Relocation Planning
          </div>
        </div>
      </div>

      {/* RIGHT: status indicators + admin link */}
      <div style={{ display: "flex", alignItems: "center", height: "56px" }}>

        {/* AI Engine */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "0 20px", height: "56px",
            borderLeft: "1px solid #e2e8f0",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>AI Engine</span>
        </div>

        {/* PostGIS */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "0 20px", height: "56px",
            borderLeft: "1px solid #e2e8f0",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>PostGIS · {totalHabitations} Habitations</span>
        </div>

        {/* Critical Zones */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "0 20px", height: "56px",
            borderLeft: "1px solid #e2e8f0",
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>{criticalZones} Critical Zones</span>
        </div>

        {/* Authority Portal */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: "56px", borderLeft: "1px solid #e2e8f0" }}>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 16px",
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "0.01em",
              border: "1px solid #1d4ed8",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#2563eb"; e.currentTarget.style.borderColor = "#2563eb"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#1d4ed8"; e.currentTarget.style.borderColor = "#1d4ed8"; }}
          >
            Authority Portal
          </a>
        </div>

      </div>
    </header>
  );
};

export default Header;
