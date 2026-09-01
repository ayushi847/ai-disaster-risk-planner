import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { relocationSites } from "../../utils/relocationSites";

// Small, clean professional shelter icon — green diamond shape, no emoji
const shelterIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border: 1.5px solid #ffffff;
      border-radius: 3px;
      transform: rotate(45deg);
      box-shadow: 0 1px 4px rgba(5, 150, 105, 0.5);
      opacity: 0.85;
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

const RelocationSites = () => {
  return (
    <>
      {relocationSites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={shelterIcon}
        >
          <Popup>
            <div style={{ minWidth: "200px", fontFamily: "system-ui, sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: "700",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Safe Relief Facility
                </span>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", fontFamily: "monospace" }}>
                  {site.id}
                </span>
              </div>

              <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a", marginBottom: "2px" }}>
                {site.name}
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748b", marginBottom: "6px" }}>
                📍 {site.district}, {site.state}
              </div>

              <div style={{ background: "#f8fafc", padding: "5px 7px", borderRadius: "5px", fontSize: "10.5px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ color: "#475569" }}>Total Capacity</span>
                  <strong style={{ color: "#0f172a" }}>{site.capacity?.toLocaleString() || "5,000"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#059669" }}>Available</span>
                  <strong style={{ color: "#059669" }}>{site.availableCapacity?.toLocaleString() || "5,000"}</strong>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default RelocationSites;