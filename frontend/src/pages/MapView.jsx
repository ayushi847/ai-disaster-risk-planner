import { useState, useEffect } from "react";  
  
import MapContainer from "../components/map/MapContainer";  
  
import { villages as initialVillages } from "../utils/villages";  
import { hazards as initialHazards } from "../utils/hazards";  
  
import {  
  getVillages,  
  getHazardZones,  
} from "../services/api";  
  
const MapView = () => {  
  const [villages, setVillages] = useState(initialVillages);  
  const [hazards, setHazards] = useState(initialHazards);  
  
  const [selectedVillage, setSelectedVillage] = useState(null);  
  const [focusLocation, setFocusLocation] = useState(null);  
  
  // Load live data  
  useEffect(() => {  
    const loadData = async () => {  
      try {  
        const liveVillages = await getVillages();  
  
        if (liveVillages && liveVillages.length > 0) {  
          setVillages(liveVillages);  
        }  
  
        const liveHazards = await getHazardZones();  
  
        if (liveHazards && liveHazards.length > 0) {  
          setHazards(liveHazards);  
        }  
      } catch (error) {  
        console.error("Map data loading error:", error);  
      }  
    };  
  
    loadData();  
  }, []);  
  
  return (  
    <div  
      style={{  
        height: "100%",  
        display: "flex",  
        flexDirection: "column",  
        gap: "16px",  
      }}  
    >  
      {/* PAGE HEADER */}  
      <div  
        style={{  
          background: "#ffffff",  
          padding: "20px 24px",  
          borderRadius: "16px",  
          border: "1px solid #e2e8f0",  
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",  
          minHeight: "95px",  
          display: "flex",  
          alignItems: "center",  
          justifyContent: "space-between",  
        }}  
      >  
        <div>  
          <h1  
            style={{  
              margin: 0,  
              fontSize: "32px",  
              fontWeight: "800",  
              color: "#0f172a",  
            }}  
          >  
            🗺️ India Disaster GIS Map  
          </h1>  
  
          <p  
            style={{  
              marginTop: "8px",  
              color: "#64748b",  
              fontSize: "15px",  
            }}  
          >  
            Real-time hazard zones, vulnerable villages and  
            relocation monitoring across India.  
          </p>  
        </div>  
  
        <div  
          style={{  
            padding: "10px 16px",  
            background: "#eff6ff",  
            color: "#2563eb",  
            borderRadius: "10px",  
            fontWeight: "600",  
            fontSize: "14px",  
          }}  
        >  
          Villages: {villages.length}  
        </div>  
      </div>  
  
      {/* MAP SECTION */}  
      <div  
        style={{  
          flex: 1,  
          height: "calc(100vh - 230px)",  
          minHeight: "600px",  
          borderRadius: "20px",  
          overflow: "hidden",  
          border: "1px solid #e2e8f0",  
          background: "#ffffff",  
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",  
        }}  
      >  
        <MapContainer  
          villages={villages}  
          hazards={hazards}  
          selectedVillage={selectedVillage}  
          onSelectVillage={(village) => {  
            setSelectedVillage(village);  
  
            if (village?.lat && village?.lng) {  
              setFocusLocation({  
                lat: village.lat,  
                lng: village.lng,  
              });  
            }  
          }}  
          focusLocation={focusLocation}  
        />  
      </div>  
    </div>  
  );  
};  
  
export default MapView;                           