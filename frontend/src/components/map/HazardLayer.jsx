import { useMemo } from "react";
import { Polygon, Tooltip, Popup } from "react-leaflet";

/**
 * Chaikin's Corner-Cutting Curve Smoothing Algorithm
 * Converts straight polygonal vertices into organic, curved river basin boundaries.
 */
function smoothPolygonCoordinates(coords, iterations = 3) {
  if (!coords || coords.length < 3) return coords;
  let current = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const smoothed = [];
    const n = current.length;
    for (let i = 0; i < n; i++) {
      const p0 = current[i];
      const p1 = current[(i + 1) % n];
      smoothed.push(
        [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]],
        [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]]
      );
    }
    current = smoothed;
  }
  return current;
}

/**
 * Pre-compute all smoothed polygons in one pass (outside the loop).
 */
function useSmoothedHazards(hazards) {
  return useMemo(() => {
    return hazards.map((hazard) => ({
      ...hazard,
      smoothedCoords: smoothPolygonCoordinates(hazard.coordinates, 3),
    }));
  }, [hazards]);
}

const HazardLayer = ({ hazards }) => {
  const smoothedHazards = useSmoothedHazards(hazards);

  return (
    <>
      {smoothedHazards.map((hazard) => {
        const isExtreme = hazard.severity === "Extreme";
        const strokeColor = hazard.color || (hazard.type === "Flood" ? "#dc2626" : "#b45309");
        const fillColor = hazard.fillColor || (hazard.type === "Flood" ? "#ef4444" : "#f59e0b");

        return (
          <Polygon
            key={hazard.id}
            positions={hazard.smoothedCoords}
            pathOptions={{
              color: strokeColor,
              fillColor: fillColor,
              fillOpacity: isExtreme ? 0.28 : 0.2,
              weight: isExtreme ? 2 : 1.5,
              dashArray: isExtreme ? "8, 6" : undefined,
              lineCap: "round",
              lineJoin: "round",
            }}
          >
            <Tooltip sticky direction="top" opacity={0.95}>
              <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#0f172a" }}>
                {hazard.name}
              </div>
              <div style={{ fontSize: "10px", color: isExtreme ? "#dc2626" : "#ea580c", fontWeight: "700" }}>
                ● {hazard.severity || "Active"} Hazard Corridor
              </div>
            </Tooltip>

            <Popup>
              <div style={{ minWidth: "210px", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      background: isExtreme ? "#fef2f2" : "#fff7ed",
                      color: isExtreme ? "#dc2626" : "#ea580c",
                      border: `1px solid ${isExtreme ? "#fecaca" : "#fed7aa"}`,
                    }}
                  >
                    {hazard.severity ? `${hazard.severity.toUpperCase()} SEVERITY` : "MONITORED BASIN"}
                  </span>
                  <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "600" }}>
                    {hazard.id}
                  </span>
                </div>

                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#0f172a", marginBottom: "4px" }}>
                  {hazard.name}
                </div>

                <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 8px 0", lineHeight: "1.4" }}>
                  {hazard.description || "Active river basin / catchment inundation zone monitored by CWC & NDMA telemetry."}
                </p>

                <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", fontSize: "11px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", border: "1px solid #e2e8f0" }}>
                  <div>Hazard: <strong style={{ color: strokeColor }}>{hazard.type}</strong></div>
                  <div>Exposure: <strong>{hazard.affectedPopulation ? `${(hazard.affectedPopulation / 100000).toFixed(1)} Lakh` : "High"}</strong></div>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export default HazardLayer;