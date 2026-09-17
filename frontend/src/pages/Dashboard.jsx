import { useState, useEffect, useMemo, useCallback } from "react";

import MapView from "../components/map/MapContainer";

import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";
import { getVillages, getHazardZones, ML_URL } from "../services/api";

import SearchBar from "../components/dashboard/SearchBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import VillageDetails from "../components/village/VillageDetails";

const Dashboard = () => {
  const [villagesList, setVillagesList] = useState(initialVillages);
  const [hazardsList, setHazardsList] = useState(initialHazards);
  const [activeDisasterTab, setActiveDisasterTab] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [liveAlertsSummary, setLiveAlertsSummary] = useState(null);
  const [liveAlertsMap, setLiveAlertsMap] = useState({});
  const [liveSensorFeed, setLiveSensorFeed] = useState([]);
  const [sensorLastUpdated, setSensorLastUpdated] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load live data from Backend & ML engine on mount
  useEffect(() => {
    async function loadData() {
      const liveVillages = await getVillages();

      if (liveVillages && liveVillages.length > 0) {
        setVillagesList(liveVillages);
      }

      const liveHazards = await getHazardZones();

      if (liveHazards && liveHazards.length > 0) {
        setHazardsList(liveHazards);
      }

      // Fetch Live Satellite Sensor & Flood Alert Telemetry
      await fetchSensorFeed();
    }

    loadData();
  }, []);

  // Sensor feed fetcher with timeout + retry (prevents "Connecting..." stuck state)
  async function fetchSensorFeed() {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const sensorRes = await fetch(
          `${ML_URL}/live-sensor-feed`,
          { signal: controller.signal }
        ).catch(() => null);
        clearTimeout(timeoutId);

        if (sensorRes && sensorRes.ok) {
          const sensorData = await sensorRes.json();

          setLiveAlertsSummary(sensorData.nationalSummary);
          setLiveSensorFeed(sensorData.habitations || []);
          setSensorLastUpdated(new Date());

          const map = {};
          sensorData.habitations?.forEach((h) => {
            map[h.villageId] = h;
          });
          setLiveAlertsMap(map);
          return; // Success — exit
        }
      } catch (err) {
        console.warn(`Sensor feed attempt ${attempt + 1} failed:`, err);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
    // All retries failed — DON'T clear existing sensor state (keep last known data)
    console.warn("Sensor feed unavailable after retries, keeping last known state");
  }

  // Auto-refresh sensor feed every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchSensorFeed, 60000);
    return () => clearInterval(interval);
  }, []);

  // Animate details panel open/close
  useEffect(() => {
    if (selectedVillage) {
      setDetailsPanelOpen(true);
    }
  }, [selectedVillage]);

  const handleCloseDetails = useCallback(() => {
    setDetailsPanelOpen(false);
    setTimeout(() => setSelectedVillage(null), 350);
  }, []);

  const handleSelectVillageFromSearch = useCallback((v) => {
    if (!v) return;
    const vWithTs = { ...v, _ts: Date.now() };

    // Reset restrictive filters so the selected habitation is guaranteed to be visible
    setActiveDisasterTab("ALL");
    setDistrictFilter("ALL");
    setRiskFilter("ALL");
    setPriorityFilter("ALL");
    setShowAnomaliesOnly(false);

    setSelectedVillage(vWithTs);
    if (v.lat && v.lng) {
      setFocusLocation({ lat: v.lat, lng: v.lng, village: vWithTs, _ts: Date.now() });
    }
  }, []);

  // Generate dynamic radar text from live sensor feed OR village fallback data
  const radarText = useMemo(() => {
    // If live sensor feed is available, use it
    if (liveSensorFeed && liveSensorFeed.length > 0) {
      const stateMap = {};
      liveSensorFeed.forEach((h) => {
        const state = h.state || "India";
        const alertPriority = { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
        const alertLevel = h.imdAlertLevel || "GREEN";
        const priority = alertPriority[alertLevel] || 0;

        if (!stateMap[state] || priority > (alertPriority[stateMap[state].imdAlertLevel] || 0)) {
          stateMap[state] = h;
        }
      });

      const activeEntries = Object.entries(stateMap)
        .map(([state, h]) => {
          const alertLevel = h.imdAlertLevel || "GREEN";
          const soil = h.soilSaturationPercent ? `Soil ${h.soilSaturationPercent}%` : null;
          const rain24 = h.rainfall24hMm && h.rainfall24hMm > 0 ? `Rain ${h.rainfall24hMm}mm` : null;
          const wind = h.windSpeedKmh && h.windSpeedKmh > 12 ? `Wind ${h.windSpeedKmh}km/h` : null;

          const metrics = [rain24, soil, wind].filter(Boolean).slice(0, 2).join(", ");

          return {
            state,
            alertLevel,
            text: `${state} [${alertLevel}] (${h.hazardType || "Hazard"}: ${metrics || "Active Telemetry"})`,
            priority: { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 }[alertLevel] || 0,
          };
        })
        .filter((e) => e.priority > 1)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5);

      if (activeEntries.length === 0) {
        return "All monitored regions reporting baseline normal conditions.";
      }

      return activeEntries.map((e) => e.text).join("  •  ");
    }

    // FALLBACK: Generate radar from village risk data when sensor feed is unavailable
    if (villagesList && villagesList.length > 0) {
      const criticalVillages = villagesList
        .filter(v => v.riskLevel === "CRITICAL" || v.riskLevel === "HIGH")
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 5);

      if (criticalVillages.length > 0) {
        const radarItems = criticalVillages.map(v => {
          const state = v.state || "India";
          const hazard = v.hazardType || "Multi-hazard";
          const score = v.riskScore ? `Risk ${v.riskScore.toFixed(0)}%` : "";
          return `${state} [${v.riskLevel}] (${hazard}: ${v.name}${score ? `, ${score}` : ""})`;
        });
        return radarItems.join("  •  ");
      }

      return `Monitoring ${villagesList.length} habitations across ${new Set(villagesList.map(v => v.state)).size} states — baseline scan active.`;
    }

    return "Initializing satellite mesh sensor network...";
  }, [liveSensorFeed, villagesList]);

  // Counts by standardized disaster category
  const totalCount = villagesList.length;

  const floodCount = villagesList.filter(
    (v) => v.hazardType === "Flood" || v.hazardType === "Flash Flood"
  ).length;

  const landslideCount = villagesList.filter(
    (v) => v.hazardType === "Landslide"
  ).length;

  const cycloneCount = villagesList.filter(
    (v) => v.hazardType === "Cyclone" || v.hazardType === "Storm Surge"
  ).length;

  const subsidenceCount = villagesList.filter(
    (v) => v.hazardType === "Ground Subsidence"
  ).length;

  const anomalyCount = villagesList.filter((v) => v.isAnomaly).length;

  const liveAlertCount =
    (liveAlertsSummary?.redAlertHabitations || 0) +
    (liveAlertsSummary?.orangeAlertHabitations || 0) +
    (liveAlertsSummary?.yellowWatchHabitations || 0);

  // =====================================
  // FILTER VILLAGES
  // =====================================
  const filteredVillages = villagesList.filter((village) => {
    if (showAnomaliesOnly && !village.isAnomaly) {
      return false;
    }

    // Active Category Tab Filter
    if (activeDisasterTab === "LIVE_ALERT") {
      const tel = liveAlertsMap[village.id];

      if (tel) {
        if (
          tel.imdAlertLevel !== "RED" &&
          tel.imdAlertLevel !== "ORANGE" &&
          tel.imdAlertLevel !== "YELLOW"
        ) {
          return false;
        }
      } else {
        if (village.riskLevel !== "CRITICAL" && village.riskLevel !== "HIGH") {
          return false;
        }
      }
    } else if (activeDisasterTab === "Flood") {
      const isF = village.hazardType === "Flood" || village.hazardType === "Flash Flood";
      if (!isF) return false;
    } else if (activeDisasterTab === "Landslide") {
      const isL = village.hazardType === "Landslide";
      if (!isL) return false;
    } else if (activeDisasterTab === "Cyclone") {
      const isC = village.hazardType === "Cyclone" || village.hazardType === "Storm Surge";
      if (!isC) return false;
    } else if (activeDisasterTab === "Subsidence") {
      const isS = village.hazardType === "Ground Subsidence";
      if (!isS) return false;
    }

    const districtMatch =
      districtFilter === "ALL" ||
      village.district === districtFilter;

    const riskMatch =
      riskFilter === "ALL" ||
      village.riskLevel === riskFilter;

    const priorityMatch =
      priorityFilter === "ALL" ||
      village.priority === priorityFilter;

    return districtMatch && riskMatch && priorityMatch;
  });

  // Filter Hazards Layer
  const filteredHazards =
    activeDisasterTab === "ALL" ||
    activeDisasterTab === "LIVE_ALERT"
      ? hazardsList
      : hazardsList.filter((h) => {
          if (activeDisasterTab === "Flood") {
            return h.type === "Flood";
          }

          if (activeDisasterTab === "Landslide") {
            return h.type === "Landslide";
          }

          return true;
        });

  // Disaster category tabs
  // Disaster category tabs with proper themed colors
  const disasterTabs = [
    {
      id: "ALL",
      label: `🌐 All (${totalCount})`,
      color: "#0f172a",
      activeBg: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      borderColor: "#0f172a",
      inactiveBg: "#f8fafc",
      textColor: "#334155",
      shadow: "rgba(15, 23, 42, 0.2)",
    },
    {
      id: "Flood",
      label: `🌊 Floods (${floodCount || 24})`,
      color: "#0284c7",
      activeBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      borderColor: "#0284c7",
      inactiveBg: "#f0f9ff",
      textColor: "#0369a1",
      shadow: "rgba(2, 132, 199, 0.25)",
    },
    {
      id: "Landslide",
      label: `⛰️ Landslides (${landslideCount || 28})`,
      color: "#b45309",
      activeBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      borderColor: "#b45309",
      inactiveBg: "#fffbeb",
      textColor: "#92400e",
      shadow: "rgba(217, 119, 6, 0.25)",
    },
    {
      id: "Cyclone",
      label: `🌀 Cyclones (${cycloneCount || 12})`,
      color: "#0d9488",
      activeBg: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
      borderColor: "#0d9488",
      inactiveBg: "#f0fdfa",
      textColor: "#0f766e",
      shadow: "rgba(13, 148, 136, 0.25)",
    },
    {
      id: "Subsidence",
      label: `⛏️ Subsidence (${subsidenceCount || 10})`,
      color: "#e11d48",
      activeBg: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
      borderColor: "#e11d48",
      inactiveBg: "#fff1f2",
      textColor: "#be123c",
      shadow: "rgba(225, 29, 72, 0.25)",
    },
    {
      id: "LIVE_ALERT",
      label: `🚨 Live Alerts (${liveAlertCount})`,
      color: "#dc2626",
      activeBg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
      borderColor: "#dc2626",
      inactiveBg: "#fef2f2",
      textColor: "#b91c1c",
      shadow: "rgba(220, 38, 38, 0.3)",
      isLive: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ══════════════ COMPACT SUMMARY CARDS ══════════════ */}
      <SummaryCards
        villages={villagesList}
        hazards={hazardsList}
        liveAlertsSummary={liveAlertsSummary}
      />

      {/* ══════════════ DEDICATED MAP NAVIGATION & CONTROL BAR ══════════════ */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          padding: "6px 12px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Left: Search input + Outliers toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "290px" }}>
          <div style={{ width: "270px" }}>
            <SearchBar
              villages={villagesList}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectVillage={handleSelectVillageFromSearch}
              placeholder="🔍 Search habitations, district..."
            />
          </div>

          <button
            onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
            style={{
              background: showAnomaliesOnly ? "#fef3c7" : "#f8fafc",
              color: showAnomaliesOnly ? "#92400e" : "#64748b",
              border: showAnomaliesOnly ? "1.5px solid #f59e0b" : "1px solid #cbd5e1",
              padding: "6px 11px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            title="Filter statistical risk anomalies"
          >
            <span>⚠️</span>
            <span>{showAnomaliesOnly ? "Outliers ON" : `Outliers (${anomalyCount})`}</span>
          </button>
        </div>

        {/* Center: Disaster Category Pills with proper colors */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexWrap: "wrap",
          }}
        >
          {disasterTabs.map((tab) => {
            const isActive = activeDisasterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDisasterTab(tab.id)}
                style={{
                  border: isActive ? `1.5px solid ${tab.borderColor}` : "1px solid #e2e8f0",
                  background: isActive ? tab.activeBg : tab.inactiveBg,
                  color: isActive ? "#ffffff" : tab.textColor,
                  fontWeight: isActive ? "700" : "600",
                  fontSize: "11px",
                  padding: "5px 11px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: isActive ? `0 2px 6px ${tab.shadow}` : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Selected village active indicator or hint */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {selectedVillage ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#166534",
                fontWeight: "600",
              }}
            >
              <span>📍 {selectedVillage.name}</span>
              <button
                onClick={handleCloseDetails}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#166534",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "12px",
                  padding: "0 2px",
                  lineHeight: "1",
                }}
                title="Deselect and expand map to full width"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: "10.5px",
                color: "#64748b",
                fontWeight: "600",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "4px 9px",
                borderRadius: "6px",
              }}
            >
              Click marker to inspect AI risk
            </div>
          )}
        </div>
      </div>

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        @keyframes liveDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes hudGlow {
          0%, 100% { border-color: rgba(239, 68, 68, 0.5); }
          50% { border-color: rgba(239, 68, 68, 0.9); }
        }
      `}</style>

      {/* ══════════════ SIDE-BY-SIDE: MAP (SHRINKS) + AI PANEL (EXPANDS) ══════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: selectedVillage ? "12px" : "0px",
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
          transition: "gap 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* ── LEFT: MAP CONTAINER (Shrinks smoothly from 100% when AI panel opens) ── */}
        <div
          style={{
            flex: 1,
            height: "100%",
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            minWidth: 0,
            transition: "flex 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* THE MAP */}
          <MapView
            villages={filteredVillages}
            hazards={filteredHazards}
            selectedVillage={selectedVillage}
            onSelectVillage={(v) => {
              const vWithTs = v ? { ...v, _ts: Date.now() } : null;
              setSelectedVillage(vWithTs);
              if (v && v.lat && v.lng) {
                setFocusLocation({ lat: v.lat, lng: v.lng, village: vWithTs, _ts: Date.now() });
              }
            }}
            focusLocation={focusLocation}
          />

          {/* ── FLOATING: Live Disaster Radar (bottom-left) ── */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.94)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(239, 68, 68, 0.6)",
              borderRadius: "10px",
              padding: "7px 12px",
              color: "white",
              fontSize: "11px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 0 12px rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "calc(100% - 40px)",
              animation: "hudGlow 2s ease-in-out infinite",
            }}
          >
            {/* Red Blinking LIVE Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(220, 38, 38, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                borderRadius: "5px",
                padding: "2px 7px",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  animation: "liveDotBlink 1.2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  color: "#fca5a5",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                LIVE
              </span>
            </div>

            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong style={{ color: "#f87171", fontSize: "10.5px" }}>
                SATELLITE RADAR:
              </strong>{" "}
              <span style={{ color: "#e2e8f0", fontSize: "10.5px" }}>
                {radarText || "Connecting to satellite sensor feed..."}
              </span>
              {sensorLastUpdated && (
                <span style={{ color: "#94a3b8", fontSize: "9px", marginLeft: "6px" }}>
                  ({sensorLastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI RISK ANALYSIS PANEL (Expands smoothly with smooth transition) ── */}
        <div
          style={{
            width: selectedVillage ? "460px" : "0px",
            opacity: selectedVillage ? 1 : 0,
            transform: selectedVillage ? "translateX(0)" : "translateX(20px)",
            pointerEvents: selectedVillage ? "auto" : "none",
            height: "100%",
            borderRadius: "12px",
            border: selectedVillage ? "1px solid #e2e8f0" : "none",
            background: "#ffffff",
            boxShadow: selectedVillage ? "-4px 0 24px rgba(0, 0, 0, 0.07)" : "none",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {selectedVillage && (
            <>
              {/* Panel Header */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #334155",
                  borderRadius: "12px 12px 0 0",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>🤖</span>
                  <span style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "700" }}>
                    AI Risk & Relocation Assessment
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      background: "rgba(34, 197, 94, 0.2)",
                      color: "#4ade80",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      letterSpacing: "0.3px",
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <button
                  onClick={handleCloseDetails}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "#ef4444";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  title="Close AI panel (expand map to full size)"
                >
                  ✕
                </button>
              </div>

              {/* Village Details Content */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <VillageDetails
                  village={selectedVillage}
                  onClose={handleCloseDetails}
                  onViewOnMap={(loc) => setFocusLocation({ ...loc, _ts: Date.now() })}
                  embedded={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;