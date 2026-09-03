




import { useEffect, useMemo, useState } from "react";

import {
  getVillages,
  getHazardZones,
} from "../services/api";


const Alerts = () => {

  const [villages, setVillages] = useState([]);
  const [hazards, setHazards] = useState([]);

  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);


  // =====================================================
  // LIVE DATA
  // =====================================================

  const loadAlerts = async () => {

    try {

      setLoading(true);

      const [villageData, hazardData] =
        await Promise.all([
          getVillages(),
          getHazardZones(),
        ]);


      if (Array.isArray(villageData)) {
        setVillages(villageData);
      }


      if (Array.isArray(hazardData)) {
        setHazards(hazardData);
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

      const risk = getRisk(village);
      const priority = getPriority(village);
      const score = getScore(village);
      const population = getPopulation(village);

      const villageName =
        getName(village);

      const district =
        getDistrict(village);

      const hazard =
        getHazard(village);


      // CRITICAL ALERT

      if (
        risk === "CRITICAL" ||
        score >= 80
      ) {

        generated.push({

          id:
            `critical-${village.id ?? index}`,

          type: "CRITICAL",

          title:
            "Critical Disaster Risk",

          message:
            `${villageName} in ${district} is showing critical risk conditions.`,

          village:
            villageName,

          district,

          hazard,

          score,

          population,

          action:
            "Immediate assessment and evacuation readiness required.",

          time:
            new Date(),

        });

      }


      // IMMEDIATE RELOCATION

      else if (
        priority === "IMMEDIATE" ||
        priority === "URGENT"
      ) {

        generated.push({

          id:
            `relocation-${village.id ?? index}`,

          type: "URGENT",

          title:
            "Immediate Relocation Required",

          message:
            `${villageName} has been marked for immediate relocation planning.`,

          village:
            villageName,

          district,

          hazard,

          score,

          population,

          action:
            "Activate relocation plan and verify nearby shelter capacity.",

          time:
            new Date(),

        });

      }


      // HIGH RISK

      else if (
        risk === "HIGH" ||
        risk === "SEVERE" ||
        score >= 60
      ) {

        generated.push({

          id:
            `high-${village.id ?? index}`,

          type: "HIGH",

          title:
            "High Risk Detected",

          message:
            `${villageName} is currently under elevated disaster risk.`,

          village:
            villageName,

          district,

          hazard,

          score,

          population,

          action:
            "Increase monitoring frequency and prepare contingency response.",

          time:
            new Date(),

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

  }, [villages, hazards]);



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


            <span
              style={{
                background: "#dcfce7",
                color: "#15803d",
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              ● LIVE
            </span>

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
                text={`🌪️ ${alert.hazard}`}
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
            whiteSpace:
              "nowrap",
            color:
              "#94a3b8",
            fontSize:
              "11px",
          }}
        >
          LIVE
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