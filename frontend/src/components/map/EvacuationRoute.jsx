import { useEffect, useState } from "react";
import { Polyline, Tooltip, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { relocationSites } from "../../utils/relocationSites";
import { calculateDistance } from "../../utils/mapHelpers";

// ──────────────────────────────────────────────
// START PIN (Red — Risk Habitation Origin)
// ──────────────────────────────────────────────
const startPinIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        background: #dc2626;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(220,38,38,0.4);
        white-space: nowrap;
        margin-bottom: 2px;
        letter-spacing: 0.3px;
      ">RISK ZONE</div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid #dc2626;
      "></div>
    </div>
  `,
  iconSize: [70, 28],
  iconAnchor: [35, 28],
});

// ──────────────────────────────────────────────
// END PIN (Green — Safe Shelter Destination)
// ──────────────────────────────────────────────
const endPinIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        background: #059669;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(5,150,105,0.4);
        white-space: nowrap;
        margin-bottom: 2px;
        letter-spacing: 0.3px;
      ">SAFE SHELTER</div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid #059669;
      "></div>
    </div>
  `,
  iconSize: [80, 28],
  iconAnchor: [40, 28],
});

/**
 * Fetch real road-based route geometry from OSRM (Open Source Routing Machine).
 * Falls back to straight line if OSRM is unreachable.
 */
async function fetchOSRMRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns [lng, lat] — Leaflet needs [lat, lng]
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceKm = route.distance / 1000;
      const durationMin = Math.round(route.duration / 60);
      return { coords, distanceKm, durationMin };
    }
  } catch (err) {
    console.warn("OSRM route fetch failed, falling back to straight line:", err);
  }
  return null;
}

export default function EvacuationRoute({ selectedVillage }) {
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0 });
  const [loading, setLoading] = useState(false);

  // Match optimal site (from Hungarian algorithm — nearest available with sufficient capacity)
  const matchingSite = (() => {
    if (!selectedVillage) return null;
    const candidates = relocationSites
      .filter(s => s.status === "AVAILABLE" && s.availableCapacity >= (selectedVillage.population || 0))
      .map(s => ({
        ...s,
        dist: calculateDistance(selectedVillage.lat, selectedVillage.lng, s.lat, s.lng),
      }))
      .sort((a, b) => a.dist - b.dist);
    return candidates.length > 0 ? candidates[0] : relocationSites[0];
  })();

  // Fetch real road route whenever selected village changes
  useEffect(() => {
    if (!selectedVillage || !selectedVillage.lat || !selectedVillage.lng || !matchingSite || !matchingSite.lat) {
      setRouteCoords(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchOSRMRoute(selectedVillage.lat, selectedVillage.lng, matchingSite.lat, matchingSite.lng)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setRouteCoords(result.coords);
          setRouteInfo({ distanceKm: result.distanceKm, durationMin: result.durationMin });
        } else {
          // Fallback: straight line
          setRouteCoords([
            [selectedVillage.lat, selectedVillage.lng],
            [matchingSite.lat, matchingSite.lng],
          ]);
          const d = calculateDistance(selectedVillage.lat, selectedVillage.lng, matchingSite.lat, matchingSite.lng);
          setRouteInfo({ distanceKm: d, durationMin: Math.round(d * 1.5) });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedVillage?.id]);

  if (!selectedVillage || !routeCoords || routeCoords.length === 0) {
    return null;
  }

  // Midpoint for the distance label
  const midIdx = Math.floor(routeCoords.length / 2);
  const midPoint = routeCoords[midIdx] || routeCoords[0];

  const startPoint = routeCoords[0];
  const endPoint = routeCoords[routeCoords.length - 1];

  return (
    <>
      {/* ─── OUTER GLOW (white border effect like Google Maps) ─── */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: "#ffffff",
          weight: 8,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* ─── MAIN ROUTE LINE (solid blue — Google Maps style) ─── */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: "#4285F4",
          weight: 5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
      >
        <Tooltip permanent direction="top" position={midPoint} className="route-tooltip">
          <div style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#1e293b",
            background: "#ffffff",
            padding: "3px 8px",
            borderRadius: "4px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{ color: "#4285F4" }}>●</span>
            {routeInfo.distanceKm.toFixed(1)} km · ~{routeInfo.durationMin} min
          </div>
        </Tooltip>
      </Polyline>

      {/* ─── START POINT: Red circle + label ─── */}
      <CircleMarker
        center={startPoint}
        radius={7}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#dc2626",
          fillOpacity: 1,
          weight: 2.5,
        }}
      />
      <Marker position={startPoint} icon={startPinIcon} />

      {/* ─── END POINT: Green circle + label ─── */}
      <CircleMarker
        center={endPoint}
        radius={7}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#059669",
          fillOpacity: 1,
          weight: 2.5,
        }}
      />
      <Marker position={endPoint} icon={endPinIcon} />
    </>
  );
}
