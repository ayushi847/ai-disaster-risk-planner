import { useEffect, useRef, useCallback } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Risk level color mapping
const riskColors = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#d97706",
  LOW: "#16a34a",
};

const createIcon = (riskLevel, isAnomaly) => {
  const color = riskColors[riskLevel] || "#6c757d";
  const isCritical = riskLevel === "CRITICAL";
  const isHigh = riskLevel === "HIGH";

  // Size varies by risk
  const dotSize = isCritical ? 18 : (isHigh ? 15 : 12);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
      ">
        ${isCritical ? `
          <div style="
            position: absolute;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(220, 38, 38, 0.3);
            animation: radar-ping-red 1.8s infinite cubic-bezier(0.25, 1, 0.5, 1);
          "></div>
        ` : (isHigh ? `
          <div style="
            position: absolute;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(234, 88, 12, 0.25);
            animation: radar-ping-orange 2.2s infinite cubic-bezier(0.25, 1, 0.5, 1);
          "></div>
        ` : "")}
        <div style="
          background: ${color};
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: 800;
        ">
          ${isAnomaly ? "!" : ""}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const VillageMarkers = ({ villages, selectedVillage, onSelectVillage }) => {
  const markerRefs = useRef({});

  useEffect(() => {
    if (!selectedVillage) return;
    const marker = markerRefs.current[selectedVillage.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedVillage]);

  const handleInspectClick = useCallback((e, village) => {
    // Stop event propagation to prevent popup from interfering
    e.stopPropagation();
    e.preventDefault();

    // Close the popup first, then select the village
    const marker = markerRefs.current[village.id];
    if (marker) {
      marker.closePopup();
    }

    // Small delay to let popup close before triggering selection
    setTimeout(() => {
      if (onSelectVillage) {
        onSelectVillage(village);
      }
    }, 50);
  }, [onSelectVillage]);

  return (
    <>
      {villages.map((village) => (
        <Marker
          key={village.id}
          position={[village.lat, village.lng]}
          icon={createIcon(village.riskLevel, village.isAnomaly)}
          eventHandlers={{
            click: () => {
              if (onSelectVillage) {
                onSelectVillage(village);
              }
            },
          }}
          ref={(marker) => {
            markerRefs.current[village.id] = marker;
          }}
        >
          <Popup>
            <div style={{ minWidth: "185px", fontFamily: "'Inter', system-ui, sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: "700",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    background: village.riskLevel === "CRITICAL" ? "#fee2e2" : (village.riskLevel === "HIGH" ? "#ffedd5" : "#f1f5f9"),
                    color: riskColors[village.riskLevel] || "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {village.riskLevel}
                </span>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                  {village.id}
                </span>
              </div>

              <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a", marginBottom: "2px" }}>
                {village.name}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                📍 {village.district}, {village.state}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "3px",
                fontSize: "10.5px",
                marginBottom: "6px",
                background: "#f8fafc",
                padding: "5px 6px",
                borderRadius: "5px",
                border: "1px solid #e2e8f0",
              }}>
                <div>Score: <strong style={{ color: riskColors[village.riskLevel] }}>{village.riskScore?.toFixed(1) || "—"}</strong></div>
                <div>Priority: <strong>{village.priority}</strong></div>
                <div>Pop: <strong>{village.population?.toLocaleString()}</strong></div>
                <div>Hazard: <strong>{village.hazardType}</strong></div>
              </div>

              <button
                onClick={(e) => handleInspectClick(e, village)}
                style={{
                  width: "100%",
                  padding: "5px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "10.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                View Details & Route →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default VillageMarkers;