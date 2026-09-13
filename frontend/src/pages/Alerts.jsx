




import { useEffect, useMemo, useState } from "react";

import {
  getVillages,
  getHazardZones,
  ML_URL,
} from "../services/api";


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


const Alerts = () => {

  // CSS keyframes for red blinking LIVE indicator
  const liveAnimationStyles = `
    @keyframes alertLivePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.7); }
    }
    @keyframes alertBadgeGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
      50% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
    }
  `;

  const [villages, setVillages] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [liveSensorMap, setLiveSensorMap] = useState({});

  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);


  // =====================================================
  // LIVE DATA
  // =====================================================

  const loadAlerts = async () => {

    try {

      setLoading(true);

      const [villageData, hazardData, sensorFeedRes] =
        await Promise.all([
          getVillages(),
          getHazardZones(),
          fetch(`${ML_URL}/live-sensor-feed`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);


      if (Array.isArray(villageData)) {
        setVillages(villageData);
      }

      if (Array.isArray(hazardData)) {
        setHazards(hazardData);
      }

      if (sensorFeedRes && Array.isArray(sensorFeedRes.habitations)) {
        const sMap = {};
        sensorFeedRes.habitations.forEach((h) => {
          sMap[h.villageId] = h;
        });
        setLiveSensorMap(sMap);
      }

      setLastUpdated(new Date());

    } catch (error) {

      console.error(
        "Alerts loading error:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadAlerts();

    const interval = setInterval(
      loadAlerts,
      30000
    );

    return () => clearInterval(interval);

  }, []);



  // =====================================================
  // HELPERS
  // =====================================================

  const getRisk = (v) => {

    return String(
      v?.riskLevel ??
      v?.risk_level ??
      v?.risk ??
      ""
    ).toUpperCase();

  };


  const getPriority = (v) => {

    return String(
      v?.priority ??
      v?.relocationPriority ??
      v?.relocation_priority ??
      ""
    ).toUpperCase();

  };


  const getScore = (v) => {

    const value =
      Number(
        v?.riskScore ??
        v?.risk_score ??
        v?.score ??
        v?.riskPercentage ??
        0
      );

    return Number.isFinite(value)
      ? value
      : 0;

  };


  const getPopulation = (v) => {

    const value =
      Number(
        v?.population ??
        v?.populationAtRisk ??
        v?.population_at_risk ??
        0
      );

    return Number.isFinite(value)
      ? value
      : 0;

  };


  const getName = (v) => {

    return (
      v?.name ??
      v?.villageName ??
      v?.village_name ??
      "Unknown Village"
    );

  };


  const getDistrict = (v) => {

    return (
      v?.district ??
      v?.districtName ??
      v?.district_name ??
      "Unknown District"
    );

  };


  const getHazard = (v) => {

    return (
      v?.hazardType ??
      v?.hazard_type ??
      v?.hazard ??
      v?.hazardName ??
      "Unknown Hazard"
    );

  };



  // =====================================================
  // GENERATE LIVE ALERTS
  // =====================================================

  const alerts = useMemo(() => {

    const generated = [];

    villages.forEach((village, index) => {

      const tel = liveSensorMap[village.id];
      const priority = getPriority(village);
      const population = getPopulation(village);
      const villageName = getName(village);
      const district = getDistrict(village);

      // Standardized hazard type from sensor feed or validated village data
      const hazard = tel?.hazardType || getHazard(village);

      // Authentic dynamic score & meteorological alert level
      const dynamicScore = tel ? tel.dynamicRiskScore : getScore(village);
      const dynamicRiskLevel = tel?.dynamicRiskLevel || getRisk(village);
      const imdLevel = tel?.imdAlertLevel || "GREEN";
      const hasTrigger = tel?.hasActiveMetAlert ?? false;
      const alertReason = tel?.alertReason;
      const rawBadge = tel?.alertBadge || "";
      // Only use sensor alertBadge if it's NOT "NORMAL" — avoids contradictory titles on URGENT/CRITICAL alerts
      const alertBadge = rawBadge.toUpperCase().includes("NORMAL") || rawBadge.toUpperCase().includes("MONITORED") ? null : rawBadge;

      // 1. CRITICAL DISASTER ALERT (Strict Trigger Gating)
      // Must be backed by IMD RED Alert OR (score >= 75 with active verified meteorological trigger)
      if (
        imdLevel === "RED" ||
        (dynamicScore >= 75 && hasTrigger)
      ) {

        generated.push({
          id: `critical-${village.id ?? index}`,
          type: "CRITICAL",
          title: alertBadge || `🔴 RED ALERT: ${hazard} Warning`,
          message: alertReason
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} is under critical disaster threat backed by live sensor thresholds.`,
          village: villageName,
          district,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          action: "Immediate tactical evacuation and shelter readiness required. Active threshold breached.",
          time: new Date(),
        });

      }

      // 2. URGENT / HIGH WATCH (Orange Alert or elevated dynamic trigger)
      // Requires IMD ORANGE level OR verified active trigger with dynamicScore >= 55
      else if (
        imdLevel === "ORANGE" ||
        (dynamicScore >= 55 && hasTrigger)
      ) {

        generated.push({
          id: `urgent-${village.id ?? index}`,
          type: "URGENT",
          title: alertBadge || `🟠 ${hazard} Risk — Elevated Watch`,
          message: alertReason
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} has elevated vulnerability and active environmental watch.`,
          village: villageName,
          district,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          action: "Activate relocation contingency and verify nearby shelter capacity.",
          time: new Date(),
        });

      }

      // 3. ACTIVE ENVIRONMENTAL WATCH (Yellow Alert or Critical Physical Telemetry)
      // Strictly requires IMD YELLOW alert OR extreme physical telemetry (rainfall >= 20mm or soil saturation >= 85%)
      else if (
        imdLevel === "YELLOW" ||
        (tel && (tel.soilSaturationPercent >= 85 || tel.rainfall24hMm >= 20))
      ) {

        generated.push({
          id: `high-${village.id ?? index}`,
          type: "HIGH",
          title: alertBadge || `🟡 ${hazard} — Active Monitoring`,
          message: alertReason && !alertReason.includes("safe baseline")
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} is under satellite mesh monitoring (Soil: ${tel?.soilSaturationPercent || 0}%, Rain: ${tel?.rainfall24hMm || 0}mm).`,
          village: villageName,
          district,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          action: "Maintain continuous sensor mesh observation and review drainage/slope telemetry.",
          time: new Date(),
        });

      }

    });



    // =================================================
    // HAZARD ZONE ALERTS
    // =================================================

    hazards.forEach((hazard, index) => {

      const severity =
        String(
          hazard?.severity ??
          hazard?.riskLevel ??
          hazard?.risk_level ??
          ""
        ).toUpperCase();


      const hazardName =
        hazard?.hazardType ??
        hazard?.hazard_type ??
        hazard?.hazard ??
        hazard?.name ??
        "Hazard Zone";


      if (
        severity === "CRITICAL" ||
        severity === "SEVERE"
      ) {

        generated.push({

          id:
            `hazard-${hazard.id ?? index}`,

          type: "CRITICAL",

          title:
            "Hazard Zone Escalation",

          message:
            `${hazardName} hazard zone has reached a severe monitoring level.`,

          village:
            hazard?.village ??
            hazard?.villageName ??
            "Multiple Locations",

          district:
            hazard?.district ??
            hazard?.districtName ??
            "Regional",

          hazard:
            hazardName,

          score:
            Number(
              hazard?.riskScore ??
              hazard?.score ??
              0
            ),

          population:
            Number(
              hazard?.populationAtRisk ??
              hazard?.population ??
              0
            ),

          action:
            "Verify field conditions and review emergency response readiness.",

          time:
            new Date(),

        });

      }

    });


    return generated.sort(
      (a, b) =>
        b.score - a.score
    );

  }, [villages, hazards, liveSensorMap]);



  // =====================================================
  // COUNTS
  // =====================================================

  const critical =
    alerts.filter(
      a => a.type === "CRITICAL"
    ).length;


  const urgent =
    alerts.filter(
      a => a.type === "URGENT"
    ).length;


  const high =
    alerts.filter(
      a => a.type === "HIGH"
    ).length;


  const populationAtRisk =
    alerts.reduce(
      (sum, alert) =>
        sum + (alert.population || 0),
      0
    );



  // =====================================================
  // FILTER
  // =====================================================

  const visibleAlerts =
    filter === "ALL"
      ? alerts
      : alerts.filter(
          alert =>
            alert.type === filter
        );



  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "22px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          boxShadow:
            "0 3px 14px rgba(15,23,42,0.06)",
        }}
      >

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              🚨 Emergency Alerts
            </h1>


            <style>{liveAnimationStyles}</style>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg, #991b1b, #dc2626)",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 800,
                animation: "alertBadgeGlow 1.8s ease-in-out infinite",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  animation: "alertLivePulse 1.2s ease-in-out infinite",
                }}
              />
              <span style={{ color: "#ffffff", letterSpacing: "0.5px" }}>
                LIVE ALERT
              </span>
            </div>

          </div>


          <p
            style={{
              margin:
                "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Real-time disaster alerts,
            critical risk notifications and
            emergency response signals.
          </p>


          {lastUpdated && (

            <div
              style={{
                marginTop: "6px",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Last synchronized:{" "}
              {lastUpdated.toLocaleTimeString()}
            </div>

          )}

        </div>



        <button
          onClick={loadAlerts}
          style={{
            border:
              "1px solid #cbd5e1",
            background: "#f8fafc",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
            color: "#334155",
          }}
        >
          ↻ Refresh
        </button>

      </div>




      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,minmax(0,1fr))",
          gap: "16px",
        }}
      >

        <AlertCard
          title="Critical Alerts"
          value={critical}
          icon="🚨"
          background="#fee2e2"
          color="#b91c1c"
        />


        <AlertCard
          title="Urgent Alerts"
          value={urgent}
          icon="⚠️"
          background="#ffedd5"
          color="#c2410c"
        />


        <AlertCard
          title="High Risk Alerts"
          value={high}
          icon="📡"
          background="#fef3c7"
          color="#a16207"
        />


        <AlertCard
          title="Population Exposure"
          value={
            populationAtRisk.toLocaleString()
          }
          icon="👥"
          background="#dbeafe"
          color="#1d4ed8"
        />

      </div>




      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div
        style={{
          background: "#ffffff",
          border:
            "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
        }}
      >

        <div>

          <strong
            style={{
              fontSize: "14px",
              color: "#334155",
            }}
          >
            Alert Monitoring
          </strong>

          <span
            style={{
              marginLeft: "10px",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            {alerts.length} active signals
          </span>

        </div>



        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >

          {[
            ["ALL", "All Alerts"],
            ["CRITICAL", "Critical"],
            ["URGENT", "Urgent"],
            ["HIGH", "High"],
          ].map(([value, label]) => (

            <button
              key={value}
              onClick={() =>
                setFilter(value)
              }
              style={{
                border:
                  filter === value
                    ? "1px solid #2563eb"
                    : "1px solid #e2e8f0",

                background:
                  filter === value
                    ? "#eff6ff"
                    : "#ffffff",

                color:
                  filter === value
                    ? "#2563eb"
                    : "#64748b",

                padding:
                  "8px 13px",

                borderRadius:
                  "9px",

                cursor:
                  "pointer",

                fontSize:
                  "12px",

                fontWeight:
                  700,
              }}
            >
              {label}
            </button>

          ))}

        </div>

      </div>




      {/* =================================================
          ALERT LIST
      ================================================= */}

      <div
        style={{
          background: "#ffffff",
          border:
            "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "22px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#0f172a",
              }}
            >
              Active Alert Feed
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Automatically generated from
              current village and hazard signals.
            </p>

          </div>


          <span
            style={{
              background:
                "#f1f5f9",
              color:
                "#475569",
              padding:
                "7px 11px",
              borderRadius:
                "8px",
              fontSize:
                "12px",
              fontWeight:
                700,
            }}
          >
            Auto refresh: 30s
          </span>

        </div>



        {loading ? (

          <div
            style={{
              padding: "45px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Loading live emergency signals...
          </div>

        ) : visibleAlerts.length === 0 ? (

          <div
            style={{
              padding: "45px",
              textAlign: "center",
            }}
          >

            <div
              style={{
                fontSize: "38px",
              }}
            >
              ✅
            </div>

            <h3
              style={{
                margin:
                  "10px 0 5px",
                color:
                  "#15803d",
              }}
            >
              No Active Alerts
            </h3>

            <p
              style={{
                margin: 0,
                color:
                  "#64748b",
                fontSize:
                  "13px",
              }}
            >
              No alert signals match the
              current monitoring filter.
            </p>

          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >

            {visibleAlerts.map(
              (alert) => (

                <AlertItem
                  key={alert.id}
                  alert={alert}
                />

              )
            )}

          </div>

        )}

      </div>




      {/* =================================================
          RESPONSE STATUS
      ================================================= */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#0f172a,#1e293b)",
          borderRadius: "18px",
          padding: "22px 24px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "5px",
        }}
      >

        <div>

          <h2
            style={{
              margin:
                "0 0 7px",
              fontSize: "19px",
            }}
          >
            🛡️ Emergency Response Readiness
          </h2>

          <p
            style={{
              margin: 0,
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {critical > 0
              ? "Critical alerts are active. Emergency teams should prioritize field verification and evacuation readiness."
              : urgent > 0
              ? "Urgent relocation signals are active. Review shelter availability and response plans."
              : high > 0
              ? "Elevated risk detected. Continue enhanced monitoring and maintain contingency readiness."
              : "Monitoring system is stable. Continue routine disaster surveillance."
            }
          </p>

        </div>


        <div
          style={{
            minWidth: "110px",
            textAlign: "center",
          }}
        >

          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            {critical > 0
              ? "HIGH"
              : urgent > 0
              ? "ELEVATED"
              : high > 0
              ? "WATCH"
              : "STABLE"}
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
            }}
          >
            Response Status
          </div>

        </div>

      </div>


    </div>

  );

};



// =====================================================
// ALERT CARD
// =====================================================

const AlertCard = ({
  title,
  value,
  icon,
  background,
  color,
}) => (

  <div
    style={{
      background: "#ffffff",
      border:
        "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "18px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
    }}
  >

    <div
      style={{
        width: "46px",
        height: "46px",
        borderRadius: "12px",
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "21px",
      }}
    >
      {icon}
    </div>


    <div>

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {title}
      </div>


      <div
        style={{
          marginTop: "3px",
          fontSize: "23px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value}
      </div>

    </div>

  </div>

);



// =====================================================
// ALERT ITEM
// =====================================================

const AlertItem = ({
  alert,
}) => {

  const styles = {

    CRITICAL: {
      background: "#fef2f2",
      border: "#fecaca",
      color: "#b91c1c",
      icon: "🚨",
    },

    URGENT: {
      background: "#fff7ed",
      border: "#fed7aa",
      color: "#c2410c",
      icon: "⚠️",
    },

    HIGH: {
      background: "#fffbeb",
      border: "#fde68a",
      color: "#a16207",
      icon: "📡",
    },

  };


  const style =
    styles[alert.type] ??
    styles.HIGH;


  return (

    <div
      style={{
        background:
          style.background,
        border:
          `1px solid ${style.border}`,
        borderRadius:
          "14px",
        padding:
          "17px",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: "20px",
        }}
      >


        <div
          style={{
            display: "flex",
            gap: "13px",
          }}
        >

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "11px",
              background:
                "#ffffff",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize:
                "20px",
            }}
          >
            {style.icon}
          </div>


          <div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "8px",
                flexWrap:
                  "wrap",
              }}
            >

              <strong
                style={{
                  color:
                    "#0f172a",
                  fontSize:
                    "15px",
                }}
              >
                {alert.title}
              </strong>


              <span
                style={{
                  background:
                    style.color,
                  color:
                    "#ffffff",
                  padding:
                    "4px 8px",
                  borderRadius:
                    "20px",
                  fontSize:
                    "10px",
                  fontWeight:
                    800,
                }}
              >
                {alert.type}
              </span>

            </div>


            <p
              style={{
                margin:
                  "6px 0",
                color:
                  "#475569",
                fontSize:
                  "13px",
              }}
            >
              {alert.message}
            </p>


            <div
              style={{
                display:
                  "flex",
                flexWrap:
                  "wrap",
                gap:
                  "8px",
                marginTop:
                  "8px",
              }}
            >

              <InfoChip
                text={`📍 ${alert.village}`}
              />

              <InfoChip
                text={`🏛️ ${alert.district}`}
              />

              <InfoChip
                text={`${getHazardIcon(alert.hazard)} ${alert.hazard}`}
              />

              {alert.score > 0 && (
                <InfoChip
                  text={`Risk ${alert.score.toFixed(1)}`}
                />
              )}

              {alert.population > 0 && (
                <InfoChip
                  text={`👥 ${alert.population.toLocaleString()}`}
                />
              )}

              {alert.telemetry?.rainfall24hMm != null && alert.telemetry.rainfall24hMm > 0 && (
                <InfoChip
                  text={`🌧️ ${alert.telemetry.rainfall24hMm}mm/24h`}
                />
              )}

              {alert.telemetry?.soilSaturationPercent != null && (
                <InfoChip
                  text={`💧 ${alert.telemetry.soilSaturationPercent}% Soil`}
                />
              )}

              {alert.telemetry?.windSpeedKmh != null && alert.telemetry.windSpeedKmh > 12 && (
                <InfoChip
                  text={`💨 ${alert.telemetry.windSpeedKmh}km/h`}
                />
              )}

              {alert.telemetry?.elevationM != null && (
                <InfoChip
                  text={`🏔️ ${Math.round(alert.telemetry.elevationM)}m Elev`}
                />
              )}

            </div>


            <div
              style={{
                marginTop:
                  "10px",
                fontSize:
                  "12px",
                color:
                  style.color,
                fontWeight:
                  700,
              }}
            >
              Recommended Action:{" "}
              <span
                style={{
                  color:
                    "#475569",
                  fontWeight:
                    500,
                }}
              >
                {alert.action}
              </span>
            </div>

          </div>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ef4444",
              animation: "alertLivePulse 1.2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              color: "#ef4444",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.3px",
            }}
          >
            LIVE
          </span>
        </div>

      </div>

    </div>

  );

};



// =====================================================
// INFO CHIP
// =====================================================

const InfoChip = ({
  text,
}) => (

  <span
    style={{
      background:
        "#ffffff",
      border:
        "1px solid #e2e8f0",
      padding:
        "5px 8px",
      borderRadius:
        "7px",
      color:
        "#475569",
      fontSize:
        "11px",
    }}
  >
    {text}
  </span>

);


export default Alerts;