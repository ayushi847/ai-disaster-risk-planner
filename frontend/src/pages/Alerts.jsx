




import { useEffect, useMemo, useState } from "react";
import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";
import AuthorityHelplinePanel from "../components/common/AuthorityHelplinePanel";
import {
  getNearestAuthorities,
  generateEmergencySmsTemplate,
  getSmsUri,
  getCallUri
} from "../utils/authorityHelplines";

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

  const [villages, setVillages] = useState(initialVillages || []);
  const [hazards, setHazards] = useState(initialHazards || []);
  const [liveSensorMap, setLiveSensorMap] = useState({});

  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());


  // =====================================================
  // LIVE DATA
  // =====================================================

  const loadAlerts = async () => {

    try {

      setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const [villageData, hazardData, sensorFeedRes] =
        await Promise.all([
          getVillages(),
          getHazardZones(),
          fetch(`${ML_URL}/live-sensor-feed`, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
      clearTimeout(timeoutId);

      if (Array.isArray(villageData) && villageData.length > 0) {
        setVillages(villageData);
      } else if (!villages || villages.length === 0) {
        setVillages(initialVillages);
      }

      if (Array.isArray(hazardData) && hazardData.length > 0) {
        setHazards(hazardData);
      } else if (!hazards || hazards.length === 0) {
        setHazards(initialHazards);
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



  // Helper to resolve physical Estimated Time-to-Impact
  const resolveETI = (tel, village, hazard, score, type) => {
    if (tel?.estimatedTimeToImpact) {
      return tel.estimatedTimeToImpact;
    }
    if (village?.estimatedTimeToImpact) {
      return village.estimatedTimeToImpact;
    }
    const h = String(hazard || "").toLowerCase();
    if (type === "CRITICAL" || score >= 75) {
      if (h.includes("flash")) {
        return {
          hoursMin: 2,
          hoursMax: 4,
          timeWindowFormatted: "2 – 4 Hours",
          urgencyLevel: "IMMINENT_CRITICAL",
          leadTimeCategory: "CRITICAL_WINDOW (<4h)",
          circumstanceCondition: "Torrential downpour exceeding flash drainage run-off capacity.",
          impactSummary: "Severe flash inundation impact expected within 2–4 hours if torrential rainfall persists.",
          recommendedEvacuationAction: "Execute immediate tactical evacuation to high ground."
        };
      }
      if (h.includes("landslide")) {
        return {
          hoursMin: 3,
          hoursMax: 6,
          timeWindowFormatted: "3 – 6 Hours",
          urgencyLevel: "IMMINENT_CRITICAL",
          leadTimeCategory: "CRITICAL_WINDOW (<6h)",
          circumstanceCondition: "Critical pore water saturation breaching slope shear stability.",
          impactSummary: "Catastrophic slope failure impact expected within 3–6 hours if saturation persists.",
          recommendedEvacuationAction: "Clear all homes in hillside runout zones immediately."
        };
      }
      if (h.includes("cyclone") || h.includes("surge")) {
        return {
          hoursMin: 3,
          hoursMax: 6,
          timeWindowFormatted: "3 – 6 Hours",
          urgencyLevel: "IMMINENT_CRITICAL",
          leadTimeCategory: "CRITICAL_WINDOW (<6h)",
          circumstanceCondition: "Gale-force onshore winds converging with astronomical tidal surge.",
          impactSummary: "Coastal surge inundation impact expected within 3–6 hours on current trajectory.",
          recommendedEvacuationAction: "Evacuate coastal belt to cyclone multi-purpose shelters."
        };
      }
      return {
        hoursMin: 6,
        hoursMax: 12,
        timeWindowFormatted: "6 – 12 Hours",
        urgencyLevel: "IMMINENT_CRITICAL",
        leadTimeCategory: "CRITICAL_WINDOW (<12h)",
        circumstanceCondition: "Severe catchment rainfall pushing river stage to danger embankment breach.",
        impactSummary: "Embankment breach and habitation inundation expected within 6–12 hours if inflow persists.",
        recommendedEvacuationAction: "Execute priority shelter transit along designated corridors."
      };
    } else if (type === "URGENT" || score >= 55) {
      return {
        hoursMin: 12,
        hoursMax: 18,
        timeWindowFormatted: "12 – 18 Hours",
        urgencyLevel: "HIGH_CONVERGENCE",
        leadTimeCategory: "ELEVATED_WINDOW (12-18h)",
        circumstanceCondition: "Elevated environmental saturation and upstream flood wave transit.",
        impactSummary: "Disaster impact escalation anticipated within 12–18 hours under prevailing conditions.",
        recommendedEvacuationAction: "Mobilize evacuation transport and verify shelter readiness."
      };
    } else {
      return {
        hoursMin: 24,
        hoursMax: 48,
        timeWindowFormatted: "24 – 48 Hours",
        urgencyLevel: "MODERATE_WATCH",
        leadTimeCategory: "EXTENDED_WATCH (24-48h)",
        circumstanceCondition: "Persistent seasonal weather pressure with elevated vulnerability.",
        impactSummary: "Disaster impact window estimated in 24–48 hours if circumstances escalate.",
        recommendedEvacuationAction: "Maintain continuous sensor mesh observation."
      };
    }
  };

  // =====================================================
  // GENERATE LIVE ALERTS
  // =====================================================

  const alerts = useMemo(() => {

    const generated = [];
    const alreadyAlerted = new Set();

    villages.forEach((village, index) => {

      const tel = liveSensorMap[village.id];
      const priority = getPriority(village);
      const population = getPopulation(village);
      const villageName = getName(village);
      const district = getDistrict(village);
      const state = village.state || village.location?.state || "";
      const lat = village.lat ?? village.latitude ?? (village.coordinates ? village.coordinates[0] : null);
      const lng = village.lng ?? village.longitude ?? (village.coordinates ? village.coordinates[1] : null);

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

        const eti = resolveETI(tel, village, hazard, dynamicScore, "CRITICAL");
        generated.push({
          id: `critical-${village.id ?? index}`,
          type: "CRITICAL",
          title: alertBadge || `🔴 RED ALERT: ${hazard} Warning`,
          message: alertReason
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} is under critical disaster threat backed by live sensor thresholds.`,
          village: villageName,
          district,
          state,
          lat,
          lng,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          estimatedTimeToImpact: eti,
          action: eti.recommendedEvacuationAction || "Immediate tactical evacuation and shelter readiness required. Active threshold breached.",
          time: new Date(),
        });
        alreadyAlerted.add(village.id);

      }

      // 2. URGENT / HIGH WATCH (Orange Alert or elevated dynamic trigger)
      // Requires IMD ORANGE level OR verified active trigger with dynamicScore >= 55
      else if (
        imdLevel === "ORANGE" ||
        (dynamicScore >= 55 && hasTrigger)
      ) {

        const eti = resolveETI(tel, village, hazard, dynamicScore, "URGENT");
        generated.push({
          id: `urgent-${village.id ?? index}`,
          type: "URGENT",
          title: alertBadge || `🟠 ${hazard} Risk — Elevated Watch`,
          message: alertReason
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} has elevated vulnerability and active environmental watch.`,
          village: villageName,
          district,
          state,
          lat,
          lng,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          estimatedTimeToImpact: eti,
          action: eti.recommendedEvacuationAction || "Activate relocation contingency and verify nearby shelter capacity.",
          time: new Date(),
        });
        alreadyAlerted.add(village.id);

      }

      // 3. ACTIVE ENVIRONMENTAL WATCH (Yellow Alert or Critical Physical Telemetry)
      // Strictly requires IMD YELLOW alert OR extreme physical telemetry (rainfall >= 20mm or soil saturation >= 85%)
      else if (
        imdLevel === "YELLOW" ||
        (tel && (tel.soilSaturationPercent >= 85 || tel.rainfall24hMm >= 20))
      ) {

        const eti = resolveETI(tel, village, hazard, dynamicScore, "HIGH");
        generated.push({
          id: `high-${village.id ?? index}`,
          type: "HIGH",
          title: alertBadge || `🟡 ${hazard} — Active Monitoring`,
          message: alertReason && !alertReason.includes("safe baseline")
            ? `${villageName} in ${district}: ${alertReason}`
            : `${villageName} in ${district} is under satellite mesh monitoring (Soil: ${tel?.soilSaturationPercent || 0}%, Rain: ${tel?.rainfall24hMm || 0}mm).`,
          village: villageName,
          district,
          state,
          lat,
          lng,
          hazard,
          score: dynamicScore,
          population,
          telemetry: tel,
          estimatedTimeToImpact: eti,
          action: eti.recommendedEvacuationAction || "Maintain continuous sensor mesh observation and review drainage/slope telemetry.",
          time: new Date(),
        });
        alreadyAlerted.add(village.id);

      }

      // 4. STRUCTURAL/HISTORICAL RISK WATCH (No weather trigger needed)
      // Villages with CRITICAL or HIGH static ML risk level that didn't trigger above weather conditions
      else if (
        (getRisk(village) === "CRITICAL" || getRisk(village) === "HIGH") &&
        !alreadyAlerted.has(village.id)
      ) {
        const staticScore = getScore(village);
        const riskLvl = getRisk(village);
        const alertType = riskLvl === "CRITICAL" ? "URGENT" : "HIGH";
        const icon = riskLvl === "CRITICAL" ? "🔶" : "🟡";
        const eti = resolveETI(tel, village, hazard, staticScore, alertType);

        generated.push({
          id: `structural-${village.id ?? index}`,
          type: alertType,
          title: `${icon} ${hazard} — Structural Risk Alert`,
          message: `${villageName} in ${district} has a ${riskLvl} baseline risk (score: ${staticScore.toFixed(1)}) based on geomorphic assessment, historical disaster patterns, and population vulnerability.`,
          village: villageName,
          district,
          state,
          lat,
          lng,
          hazard,
          score: staticScore,
          population,
          telemetry: tel,
          estimatedTimeToImpact: eti,
          action: eti.recommendedEvacuationAction || (riskLvl === "CRITICAL" 
            ? "Priority relocation assessment required. Verify structural safety and maintain evacuation readiness."
            : "Enhanced monitoring recommended. Review drainage infrastructure and slope stability reports."),
          time: new Date(),
        });
        alreadyAlerted.add(village.id);
      }

      // 5. ANOMALY DETECTION ALERTS
      // IsolationForest-flagged villages that haven't been alerted yet
      if (
        village.isAnomaly &&
        !alreadyAlerted.has(village.id)
      ) {
        const eti = resolveETI(tel, village, hazard, getScore(village), "HIGH");
        generated.push({
          id: `anomaly-${village.id ?? index}`,
          type: "HIGH",
          title: `⚠️ Statistical Anomaly — ${hazard}`,
          message: village.anomalyReason
            ? `${villageName} in ${district}: ${village.anomalyReason}`
            : `${villageName} in ${district} flagged by IsolationForest anomaly detection. Risk pattern deviates from expected baseline.`,
          village: villageName,
          district,
          state,
          lat,
          lng,
          hazard,
          score: getScore(village),
          population,
          telemetry: tel,
          estimatedTimeToImpact: eti,
          action: "Investigate data anomaly. Cross-reference with field conditions and verify sensor accuracy.",
          time: new Date(),
        });
        alreadyAlerted.add(village.id);
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


    // =================================================
    // MINIMUM ALERTS GUARANTEE
    // If no weather/structural alerts exist, show top
    // risk villages as "WATCH" monitoring entries so the 
    // page never appears empty.
    // =================================================
    if (generated.length === 0 && villages.length > 0) {
      const topRiskVillages = [...villages]
        .sort((a, b) => getScore(b) - getScore(a))
        .slice(0, 15);

      topRiskVillages.forEach((village, index) => {
        const villageName = getName(village);
        const district = getDistrict(village);
        const hazard = getHazard(village);
        const score = getScore(village);
        const population = getPopulation(village);
        const riskLvl = getRisk(village);

        generated.push({
          id: `watch-${village.id ?? index}`,
          type: "HIGH",
          title: `📡 ${hazard} — Continuous Surveillance`,
          message: `${villageName} in ${district} is under active risk monitoring. Current ML risk assessment: ${riskLvl} (${score.toFixed(1)}). Population at risk: ${population.toLocaleString()}.`,
          village: villageName,
          district,
          hazard,
          score,
          population,
          telemetry: liveSensorMap[village.id] || null,
          action: "Continue routine disaster preparedness monitoring. Review quarterly risk assessment updates.",
          time: new Date(),
        });
      });
    }

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
  const [showAllAuthorities, setShowAllAuthorities] = useState(false);

  const locationItem = useMemo(() => ({
    name: alert.village,
    villageName: alert.village,
    district: alert.district,
    state: alert.state || "",
    lat: alert.lat,
    lng: alert.lng,
    hazardType: alert.hazard,
    severity: alert.type,
    population: alert.population,
    estimatedTimeToImpact: alert.estimatedTimeToImpact,
    title: alert.title,
    message: alert.message,
  }), [alert]);

  const nearestAuthorities = useMemo(() => getNearestAuthorities(locationItem), [locationItem]);
  const primaryAuth = nearestAuthorities[0] || null;
  const primarySms = primaryAuth ? generateEmergencySmsTemplate(primaryAuth, locationItem) : "";
  const primarySmsHref = primaryAuth ? getSmsUri(primaryAuth.phone, primarySms) : "#";
  const primaryCallHref = primaryAuth ? getCallUri(primaryAuth.phone) : "#";

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


            {/* ESTIMATED TIME-TO-IMPACT (ETI) CARD */}
            {alert.estimatedTimeToImpact && (
              <div
                style={{
                  marginTop: "12px",
                  background: alert.type === "CRITICAL"
                    ? "linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(254, 226, 226, 0.6))"
                    : alert.type === "URGENT"
                    ? "linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(254, 215, 170, 0.6))"
                    : "linear-gradient(135deg, rgba(254, 252, 232, 0.95), rgba(254, 240, 138, 0.6))",
                  border: `1.5px solid ${alert.type === "CRITICAL" ? "#fca5a5" : alert.type === "URGENT" ? "#fdba74" : "#fde047"}`,
                  borderRadius: "10px",
                  padding: "10px 14px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ fontSize: "16px" }}>⏱️</span>
                    <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Estimated Time-to-Impact:
                    </span>
                    <span
                      style={{
                        background: alert.type === "CRITICAL" ? "#dc2626" : alert.type === "URGENT" ? "#ea580c" : "#ca8a04",
                        color: "#ffffff",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "800",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Within {alert.estimatedTimeToImpact.timeWindowFormatted}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: alert.type === "CRITICAL" ? "#991b1b" : alert.type === "URGENT" ? "#c2410c" : "#854d0e",
                      background: "rgba(255,255,255,0.7)",
                      padding: "2px 7px",
                      borderRadius: "6px",
                    }}
                  >
                    {alert.estimatedTimeToImpact.leadTimeCategory || "LEAD-TIME WINDOW"}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#1e293b", lineHeight: "1.45" }}>
                  <strong style={{ color: "#0f172a" }}>If circumstances persist: </strong>
                  {alert.estimatedTimeToImpact.circumstanceCondition}
                </div>

                {alert.estimatedTimeToImpact.impactSummary && (
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#475569",
                      fontStyle: "italic",
                      marginTop: "3px",
                      paddingTop: "3px",
                      borderTop: "1px dashed rgba(0,0,0,0.1)",
                    }}
                  >
                    📢 <strong>Forecast:</strong> {alert.estimatedTimeToImpact.impactSummary}
                  </div>
                )}
              </div>
            )}

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

            {/* NEAREST AUTHORITY HELPLINES & 1-CLICK CALL / SMS DISPATCH */}
            <div
              style={{
                marginTop: "12px",
                background: "#0f172a",
                borderRadius: "10px",
                padding: "10px 12px",
                border: "1px solid #1e293b",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                  <span style={{ fontSize: "16px" }}>🚨</span>
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Nearest Authority:</span>
                      <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{primaryAuth?.name || "District Disaster Authority (DDMA)"}</span>
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                      <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: "600" }}>📞 {primaryAuth?.displayPhone || primaryAuth?.phone || "112"}</span>
                      <span>•</span>
                      <span>{primaryAuth?.jurisdiction || `${alert.district} Sector`}</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                        24x7
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons: CALL and SMS side-by-side */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {/* CALL BUTTON */}
                  <a
                    href={primaryCallHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "#059669",
                      color: "#ffffff",
                      padding: "5px 11px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(5, 150, 105, 0.4)",
                      transition: "transform 0.1s ease",
                    }}
                    title={`Direct Call to ${primaryAuth?.name || 'Emergency Authority'}`}
                  >
                    <span>📞</span>
                    <span>Call Now</span>
                  </a>

                  {/* PRE-DRAFTED SMS SOS BUTTON */}
                  <a
                    href={primarySmsHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "linear-gradient(135deg, #0284c7, #2563eb)",
                      color: "#ffffff",
                      padding: "5px 11px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(2, 132, 199, 0.4)",
                      transition: "transform 0.1s ease",
                    }}
                    title="Opens SMS app with complete pre-drafted SOS template including location, GPS, hazard & severity"
                  >
                    <span>💬</span>
                    <span>Send SOS SMS</span>
                  </a>

                  {/* TOGGLE ALL AUTHORITIES */}
                  <button
                    type="button"
                    onClick={() => setShowAllAuthorities(!showAllAuthorities)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "6px",
                      background: showAllAuthorities ? "#334155" : "#1e293b",
                      border: "1px solid #475569",
                      color: "#cbd5e1",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span>{showAllAuthorities ? "Hide Helplines ▲" : "All Authorities (NDRF, SDMA) ▼"}</span>
                  </button>
                </div>
              </div>

              {/* EXPANDED FULL HELPLINES PANEL */}
              {showAllAuthorities && (
                <div style={{ marginTop: "10px", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>
                  <AuthorityHelplinePanel
                    locationItem={locationItem}
                    compact={true}
                    showHeading={false}
                    maxItems={5}
                  />
                </div>
              )}
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