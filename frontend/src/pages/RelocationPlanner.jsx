import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getVillages,
  getRelocationSites,
} from "../services/api";
import { villages as fallbackVillages } from "../utils/villages";
import { relocationSites as fallbackSites } from "../utils/relocationSites";

const getHazardIcon = (hType) => {
  const h = String(hType || "").toLowerCase();
  if (h.includes("subsidence")) return "⛏️";
  if (h.includes("surge")) return "🌊";
  if (h.includes("cyclone")) return "🌀";
  if (h.includes("flash flood")) return "⚡";
  if (h.includes("flood")) return "🌊";
  if (h.includes("landslide")) return "⛰️";
  if (h.includes("heat")) return "☀️";
  return "⚠️";
};

const RelocationPlanner = () => {
  const [villages, setVillages] = useState(fallbackVillages);
  const [sites, setSites] = useState(fallbackSites);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("CRITICAL"); // 'CRITICAL' | 'IMMEDIATE' | 'ALL' | 'HIGH'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [villageData, siteData] = await Promise.all([
          getVillages().catch(() => fallbackVillages),
          getRelocationSites().catch(() => fallbackSites),
        ]);

        if (isMounted) {
          if (villageData && villageData.length > 0) {
            setVillages(villageData);
          }
          if (siteData && siteData.length > 0) {
            setSites(siteData);
          }
        }
      } catch (error) {
        console.error("Relocation data error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Standardized filter helpers ensuring robust data matching
  const criticalVillages = useMemo(() => {
    return villages.filter(v => {
      const rLevel = String(v.riskLevel || "").toUpperCase();
      const score = Number(v.riskScore || 0);
      return rLevel === "CRITICAL" || score >= 75;
    });
  }, [villages]);

  const immediateMove = useMemo(() => {
    return villages.filter(v => {
      const priority = String(v.priority || v.priorityLevel || "").toUpperCase();
      const rLevel = String(v.riskLevel || "").toUpperCase();
      return priority === "IMMEDIATE" || rLevel === "CRITICAL";
    });
  }, [villages]);

  const highRiskVillages = useMemo(() => {
    return villages.filter(v => {
      const rLevel = String(v.riskLevel || "").toUpperCase();
      return rLevel === "HIGH";
    });
  }, [villages]);

  // Active filtered list based on selected tab and search query
  const displayedVillages = useMemo(() => {
    let list = [];
    if (activeTab === "CRITICAL") {
      list = criticalVillages.length > 0 ? criticalVillages : immediateMove;
    } else if (activeTab === "IMMEDIATE") {
      list = immediateMove;
    } else if (activeTab === "HIGH") {
      list = highRiskVillages;
    } else {
      // ALL priority candidates (Critical + Immediate + High)
      const seen = new Set();
      list = [...criticalVillages, ...immediateMove, ...highRiskVillages].filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(v => 
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.district && v.district.toLowerCase().includes(q)) ||
      (v.state && v.state.toLowerCase().includes(q)) ||
      (v.hazardType && v.hazardType.toLowerCase().includes(q))
    );
  }, [activeTab, searchQuery, criticalVillages, immediateMove, highRiskVillages]);

  // Shelter metrics
  const totalCapacity = useMemo(() => {
    return sites.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  }, [sites]);

  const occupied = useMemo(() => {
    return sites.reduce((sum, s) => sum + (Number(s.currentOccupancy) || 0), 0);
  }, [sites]);

  const availability = totalCapacity
    ? Math.round(((totalCapacity - occupied) / totalCapacity) * 100)
    : 100;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#fff",
          padding: "20px 24px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 800,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🏠</span>
              <span>Relocation Planner</span>
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              AI-assisted evacuation planning, temporary shelter allocation, and vulnerable habitation relocation management.
            </p>
          </div>

          <Link
            to="/map-view"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#1d4ed8",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(29, 78, 216, 0.25)",
            }}
          >
            <span>📍 Plot Evacuation Corridors on Map</span>
          </Link>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <Card
          title="Critical Habitations"
          value={criticalVillages.length}
          subtitle="Severe geomorphic risk exposure"
          icon="🚨"
          color="#fee2e2"
          badgeColor="#dc2626"
        />

        <Card
          title="Immediate Relocation"
          value={immediateMove.length}
          subtitle="Direct evacuation priority"
          icon="🚚"
          color="#fef3c7"
          badgeColor="#b45309"
        />

        <Card
          title="Shelter Capacity"
          value={totalCapacity.toLocaleString()}
          subtitle="Designated safe spaces"
          icon="🏕️"
          color="#dcfce7"
          badgeColor="#15803d"
        />

        <Card
          title="Available Space"
          value={`${availability}%`}
          subtitle={`${(totalCapacity - occupied).toLocaleString()} free beds`}
          icon="✅"
          color="#dbeafe"
          badgeColor="#1d4ed8"
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "18px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* VILLAGE PRIORITY PANEL */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,.03)",
          }}
        >
          {/* Header & Controls */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🚨</span>
                <span>Relocation Priority List</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {displayedVillages.length} Habitations
                </span>
              </h2>

              {/* Search input */}
              <input
                type="text"
                placeholder="Search village or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  outline: "none",
                  width: "180px",
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "CRITICAL", label: `🚨 Critical (${criticalVillages.length})` },
                { id: "IMMEDIATE", label: `🚚 Immediate (${immediateMove.length})` },
                { id: "HIGH", label: `⚠️ Elevated Watch (${highRiskVillages.length})` },
                { id: "ALL", label: `📋 All Priority` },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: isActive ? "700" : "500",
                      background: isActive ? "#0f172a" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      border: "1px solid",
                      borderColor: isActive ? "#0f172a" : "#e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List Content */}
          <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                ⏳ Loading habitation relocation telemetry...
              </div>
            ) : displayedVillages.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                  color: "#64748b",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>🔍</div>
                <div style={{ fontWeight: "700", color: "#334155" }}>No matching habitations found</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Try clearing search or selecting another filter tab.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {displayedVillages.map((v) => {
                  const rLevel = String(v.riskLevel || "").toUpperCase();
                  const priority = String(v.priority || v.priorityLevel || "IMMEDIATE").toUpperCase();
                  const isCrit = rLevel === "CRITICAL" || priority === "IMMEDIATE";

                  return (
                    <div
                      key={v.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        background: isCrit ? "linear-gradient(135deg, #ffffff, #fff5f5)" : "#ffffff",
                        border: isCrit ? "1.5px solid #fecaca" : "1px solid #e2e8f0",
                        borderRadius: "10px",
                        boxShadow: "0 1px 4px rgba(0,0,0,.02)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "180px", paddingRight: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                            {v.name}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: isCrit ? "#fee2e2" : "#fef3c7",
                              color: isCrit ? "#b91c1c" : "#92400e",
                              border: `1px solid ${isCrit ? "#fca5a5" : "#fde68a"}`,
                            }}
                          >
                            {getHazardIcon(v.hazardType)} {v.hazardType || "Hazard"}
                          </span>
                        </div>

                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span>🏛️ {v.district ? `${v.district}, ${v.state || ""}` : "District Sector"}</span>
                          {v.population && (
                            <>
                              <span>•</span>
                              <span>👥 {Number(v.population).toLocaleString()} residents</span>
                            </>
                          )}
                          {v.riskScore != null && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: "600", color: "#0284c7" }}>Risk {Number(v.riskScore).toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right side status badge & action */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", shrink: 0 }}>
                        <span
                          style={{
                            background: isCrit ? "#dc2626" : "#d97706",
                            color: "#ffffff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.2px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {priority === "IMMEDIATE" ? "⚡ IMMEDIATE" : priority}
                        </span>

                        <Link
                          to="/map-view"
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: "600",
                            textDecoration: "none",
                            border: "1px solid #cbd5e1",
                            whiteSpace: "nowrap",
                          }}
                          title="View on Interactive Map"
                        >
                          📍 Map
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RELOCATION CENTERS (SHELTERS) */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏕️</span>
              <span>Relocation Centers & Shelters</span>
            </h2>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "#dcfce7",
                color: "#15803d",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              {sites.length} Active Centers
            </span>
          </div>

          <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sites.map((site) => {
                const cap = Number(site.capacity) || 500;
                const occ = Number(site.currentOccupancy) || 0;
                const pct = Math.min(Math.round((occ / cap) * 100), 100);
                const isHigh = pct >= 80;
                const locationText = site.district
                  ? `${site.district}, ${site.state || "India"}`
                  : (site.location || "India");

                return (
                  <div
                    key={site.id}
                    style={{
                      padding: "12px 14px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <b style={{ fontSize: "13px", color: "#0f172a", lineHeight: "1.3" }}>
                        {site.name}
                      </b>

                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                          color: isHigh ? "#dc2626" : "#16a34a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {occ} / {cap}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "5px 0 8px", fontSize: "11.5px", color: "#64748b" }}>
                      <span>📍 {locationText}</span>
                      <span style={{ fontSize: "10.5px", color: "#0284c7", fontWeight: "600" }}>
                        {cap - occ} spaces available
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: "6px",
                        background: "#e2e8f0",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isHigh ? "#dc2626" : "#2563eb",
                          borderRadius: "8px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, subtitle, icon, color, badgeColor }) => {
  return (
    <div
      style={{
        background: "#fff",
        padding: "16px 18px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 2px 6px rgba(0,0,0,.02)",
      }}
    >
      <div
        style={{
          height: "44px",
          width: "44px",
          borderRadius: "12px",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {title}
        </p>

        <h2
          style={{
            margin: "3px 0 0",
            fontSize: "22px",
            fontWeight: 800,
            color: badgeColor || "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </h2>

        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default RelocationPlanner;