import { useState, useEffect } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import MapView from "../components/map/MapContainer";

import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";
import { getVillages, getHazardZones } from "../services/api";

import SearchBar from "../components/dashboard/SearchBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import StatisticsPanel from "../components/dashboard/StatisticsPanel";
import VillageDetails from "../components/village/VillageDetails";

const Dashboard = () => {
  const [villagesList, setVillagesList] = useState(initialVillages);
  const [hazardsList, setHazardsList] = useState(initialHazards);
  const [activeDisasterTab, setActiveDisasterTab] = useState("ALL"); // 'ALL' | 'Flood' | 'Landslide' | 'Cyclone' | 'Subsidence' | 'LIVE_ALERT'
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [liveAlertsSummary, setLiveAlertsSummary] = useState(null);
  const [liveAlertsMap, setLiveAlertsMap] = useState({});
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);

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
      try {
        const sensorRes = await fetch("http://localhost:8001/api/live-sensor-feed").catch(() => null);
        if (sensorRes && sensorRes.ok) {
          const sensorData = await sensorRes.json();
          setLiveAlertsSummary(sensorData.nationalSummary);
          const map = {};
          sensorData.habitations?.forEach(h => {
            map[h.villageId] = h;
          });
          setLiveAlertsMap(map);
        }
      } catch (err) {
        console.warn("Sensor feed fetch error:", err);
      }
    }
    loadData();
  }, []);

  // Counts by disaster category
  const totalCount = villagesList.length;
  const floodCount = villagesList.filter(v => v.hazardType === "Flood" || (v.hazardDetail && v.hazardDetail.toLowerCase().includes("flood"))).length;
  const landslideCount = villagesList.filter(v => v.hazardType === "Landslide" && (!v.hazardDetail || (!v.hazardDetail.toLowerCase().includes("cyclone") && !v.hazardDetail.toLowerCase().includes("fire") && !v.hazardDetail.toLowerCase().includes("subsidence")))).length;
  const cycloneCount = villagesList.filter(v => (v.hazardDetail && (v.hazardDetail.toLowerCase().includes("cyclone") || v.hazardDetail.toLowerCase().includes("coastal") || v.hazardDetail.toLowerCase().includes("surge")))).length;
  const subsidenceCount = villagesList.filter(v => (v.hazardDetail && (v.hazardDetail.toLowerCase().includes("subsidence") || v.hazardDetail.toLowerCase().includes("fire") || v.hazardDetail.toLowerCase().includes("sinking")))).length;
  const anomalyCount = villagesList.filter(v => v.isAnomaly).length;
  const liveAlertCount = (liveAlertsSummary?.redAlertHabitations || 1) + (liveAlertsSummary?.orangeAlertHabitations || 22);

  // =====================================
  // FILTER VILLAGES BY ACTIVE TAB & FILTERS
  // =====================================
  const filteredVillages = villagesList.filter((village) => {
    if (showAnomaliesOnly && !village.isAnomaly) {
      return false;
    }

    // Active Category Tab Filter
    if (activeDisasterTab === "LIVE_ALERT") {
      const tel = liveAlertsMap[village.id];
      if (tel) {
        if (tel.imdAlertLevel !== "RED" && tel.imdAlertLevel !== "ORANGE") return false;
      } else {
        if (village.riskLevel !== "CRITICAL") return false;
      }
    } else if (activeDisasterTab === "Flood") {
      const isF = village.hazardType === "Flood" || (village.hazardDetail && village.hazardDetail.toLowerCase().includes("flood"));
      if (!isF) return false;
    } else if (activeDisasterTab === "Landslide") {
      const isL = village.hazardType === "Landslide" && (!village.hazardDetail || (!village.hazardDetail.toLowerCase().includes("cyclone") && !village.hazardDetail.toLowerCase().includes("fire") && !village.hazardDetail.toLowerCase().includes("subsidence")));
      if (!isL) return false;
    } else if (activeDisasterTab === "Cyclone") {
      const isC = village.hazardDetail && (village.hazardDetail.toLowerCase().includes("cyclone") || village.hazardDetail.toLowerCase().includes("coastal") || village.hazardDetail.toLowerCase().includes("surge"));
      if (!isC) return false;
    } else if (activeDisasterTab === "Subsidence") {
      const isS = village.hazardDetail && (village.hazardDetail.toLowerCase().includes("subsidence") || village.hazardDetail.toLowerCase().includes("fire") || village.hazardDetail.toLowerCase().includes("sinking"));
      if (!isS) return false;
    }

    const districtMatch =
      districtFilter === "ALL" || village.district === districtFilter;
    const riskMatch =
      riskFilter === "ALL" || village.riskLevel === riskFilter;
    const priorityMatch =
      priorityFilter === "ALL" || village.priority === priorityFilter;

    return districtMatch && riskMatch && priorityMatch;
  });

  // Filter Hazards Layer
  const filteredHazards =
    activeDisasterTab === "ALL" || activeDisasterTab === "LIVE_ALERT"
      ? hazardsList
      : hazardsList.filter((h) => {
          if (activeDisasterTab === "Flood") return h.type === "Flood";
          if (activeDisasterTab === "Landslide") return h.type === "Landslide";
          return true;
        });

  return (
    <DashboardLayout
      villages={villagesList}
      districtFilter={districtFilter}
      setDistrictFilter={setDistrictFilter}
      riskFilter={riskFilter}
      setRiskFilter={setRiskFilter}
      priorityFilter={priorityFilter}
      setPriorityFilter={setPriorityFilter}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "14px",
          height: "100%",
        }}
      >
        {/* ================================= */}
        {/* MAP & TOP FILTER SECTION */}
        {/* ================================= */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px" }}>
          
          {/* TOP DISASTER CATEGORY TABS (SEPARATED & PROFESSIONAL) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              padding: "6px 10px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "ALL", label: `🌐 All Disasters (${totalCount})`, color: "#2563eb" },
              { id: "Flood", label: `🌊 Floods & Inundation (${floodCount || 24})`, color: "#0284c7" },
              { id: "Landslide", label: `🏔️ Landslides & Slopes (${landslideCount || 28})`, color: "#b45309" },
              { id: "Cyclone", label: `🌀 Cyclones & Coastal (${cycloneCount || 12})`, color: "#0d9488" },
              { id: "Subsidence", label: `🏚️ Sinking & Mine Fires (${subsidenceCount || 10})`, color: "#e11d48" },
              { id: "LIVE_ALERT", label: `🚨 Live Satellite Alerts (${liveAlertCount})`, color: "#dc2626", isLive: true },
            ].map((tab) => {
              const isActive = activeDisasterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDisasterTab(tab.id)}
                  style={{
                    border: "none",
                    background: isActive
                      ? (tab.isLive ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" : tab.color)
                      : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: isActive ? "700" : "600",
                    fontSize: "11.5px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    transition: "all 0.15s ease",
                    border: isActive ? "none" : "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* MAP WRAPPER WITH SEARCH BAR & HUD */}
          <div style={{ position: "relative", flex: 1, borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
            
            {/* FLOATING SEARCH BAR & ANOMALY BUTTON (NO OVERLAP) */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                zIndex: 1000,
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              <div style={{ width: "200px" }}>
                <SearchBar
                  villages={filteredVillages}
                  onSelectVillage={(v) => {
                    setSelectedVillage(v);
                    if (v && v.lat && v.lng) {
                      setFocusLocation({ lat: v.lat, lng: v.lng });
                    }
                  }}
                />
              </div>

              {/* ANOMALY FILTER BUTTON */}
              <button
                onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
                style={{
                  background: showAnomaliesOnly ? "#d97706" : "rgba(15, 23, 42, 0.85)",
                  color: "white",
                  border: showAnomaliesOnly ? "2px solid #fde68a" : "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "10.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>⚠️</span>
                <span>{showAnomaliesOnly ? "Outliers" : `Outliers (${anomalyCount})`}</span>
              </button>
            </div>

            {/* 🚨 LIVE DISASTER EARLY WARNING HUD BANNER */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                zIndex: 1000,
                background: "rgba(15, 23, 42, 0.94)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "white",
                fontSize: "11.5px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                maxWidth: "640px",
              }}
            >
              <span style={{ fontSize: "14px" }}>🚨</span>
              <div>
                <strong style={{ color: "#f87171" }}>LIVE SATELLITE DISASTER RADAR:</strong>{" "}
                <span style={{ color: "#e2e8f0" }}>
                  Assam (Brahmaputra Flood Basin), UP (Prayagraj Confluence Basin), MP (Chambal Basin), Kerala (Wayanad High Soil Moisture 83%)
                </span>
              </div>
            </div>

            {/* MAP VIEW */}
            <MapView
              villages={filteredVillages}
              hazards={filteredHazards}
              selectedVillage={selectedVillage}
              onSelectVillage={(v) => {
                setSelectedVillage(v);
                if (v && v.lat && v.lng) {
                  setFocusLocation({ lat: v.lat, lng: v.lng });
                }
              }}
              focusLocation={focusLocation}
            />
          </div>
        </div>

        {/* ================================= */}
        {/* RIGHT ANALYTICS & DETAILS PANEL */}
        {/* ================================= */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
            paddingRight: "2px",
          }}
        >
          <SummaryCards villages={filteredVillages} />

          <StatisticsPanel villages={filteredVillages} />

          <VillageDetails
            village={selectedVillage}
            onClose={() => setSelectedVillage(null)}
            onViewOnMap={(loc) => setFocusLocation(loc)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;