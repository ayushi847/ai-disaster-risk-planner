 
 
 
import { useEffect, useMemo, useState } from "react"; 
 
import { 
  getVillages, 
  getHazardZones, 
} from "../services/api"; 
 
 
const AIDiagnostics = () => { 
 
  const [villages, setVillages] = useState([]); 
  const [hazards, setHazards] = useState([]); 
 
  const [loading, setLoading] = useState(true); 
  const [lastUpdated, setLastUpdated] = useState(null); 
 
 
  // ========================================================= 
  // LIVE DATA 
  // ========================================================= 
 
  const loadData = async () => { 
 
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
        "AI Diagnostics data loading error:", 
        error 
      ); 
 
    } finally { 
 
      setLoading(false); 
 
    } 
 
  }; 
 
 
  useEffect(() => { 
 
    loadData(); 
 
    // Refresh every 30 seconds 
 
    const interval = setInterval( 
      loadData, 
      30000 
    ); 
 
    return () => clearInterval(interval); 
 
  }, []); 
 
 
 
  // ========================================================= 
  // NORMALIZATION 
  // ========================================================= 
 
  const getRisk = (v) => { 
 
    const value = 
      v?.riskLevel ?? 
      v?.risk_level ?? 
      v?.risk ?? 
      ""; 
 
    return String(value).toUpperCase(); 
 
  }; 
 
 
  const getPriority = (v) => { 
 
    const value = 
      v?.priority ?? 
      v?.relocationPriority ?? 
      v?.relocation_priority ?? 
      ""; 
 
    return String(value).toUpperCase(); 
 
  }; 
 
 
  const getScore = (v) => { 
 
    const value = 
      v?.riskScore ?? 
      v?.risk_score ?? 
      v?.score ?? 
      v?.riskPercentage ?? 
      0; 
 
    const number = 
      Number(value); 
 
    return Number.isFinite(number) 
      ? number 
      : 0; 
 
  }; 
 
 
  const getPopulation = (v) => { 
 
    const value = 
      v?.population ?? 
      v?.populationAtRisk ?? 
      v?.population_at_risk ?? 
      0; 
 
    const number = 
      Number(value); 
 
    return Number.isFinite(number) 
      ? number 
      : 0; 
 
  }; 
 
 
  const getHazard = (v) => { 
 
    const value = 
      v?.hazardType ?? 
      v?.hazard_type ?? 
      v?.hazard ?? 
      v?.hazardName ?? 
      "Unknown"; 
 
    return String(value); 
 
  }; 
 
 
  const getVillageName = (v) => { 
 
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
 
 
 
  // ========================================================= 
  // AI DIAGNOSTICS 
  // ========================================================= 
 
  const diagnostics = useMemo(() => { 
 
    const total = 
      villages.length; 
 
 
    const critical = 
      villages.filter( 
        v => getRisk(v) === "CRITICAL" 
      ).length; 
 
 
    const high = 
      villages.filter( 
        v => 
          getRisk(v) === "HIGH" || 
          getRisk(v) === "SEVERE" 
      ).length; 
 
 
    const immediate = 
      villages.filter( 
        v => 
          getPriority(v) === "IMMEDIATE" || 
          getPriority(v) === "URGENT" 
      ).length; 
 
 
    const population = 
      villages.reduce( 
        (sum, v) => 
          sum + getPopulation(v), 
        0 
      ); 
 
 
    const avgScore = 
      total > 0 
        ? villages.reduce( 
            (sum, v) => 
              sum + getScore(v), 
            0 
          ) / total 
        : 0; 
 
 
    const hazardCounts = {}; 
 
    villages.forEach(v => { 
 
      const hazard = 
        getHazard(v); 
 
      hazardCounts[hazard] = 
        (hazardCounts[hazard] || 0) + 1; 
 
    }); 
 
 
    const dominantHazard = 
      Object.entries(hazardCounts) 
        .sort((a, b) => b[1] - a[1])[0]; 
 
 
    const riskPercentage = 
      total > 0 
        ? Math.round( 
            ((critical + high) / total) * 100 
          ) 
        : 0; 
 
 
    let systemStatus = "STABLE"; 
 
    if ( 
      critical > 0 || 
      immediate > 0 
    ) { 
      systemStatus = "CRITICAL"; 
    } 
    else if (high > 0) { 
      systemStatus = "ELEVATED"; 
    } 
 
 
    return { 
 
      total, 
      critical, 
      high, 
      immediate, 
      population, 
      avgScore, 
      dominantHazard: 
        dominantHazard?.[0] || 
        "No dominant hazard", 
      dominantHazardCount: 
        dominantHazard?.[1] || 0, 
      riskPercentage, 
      systemStatus, 
 
    }; 
 
  }, [villages]); 
 
 
 
  // ========================================================= 
  // HIGHEST RISK VILLAGES 
  // ========================================================= 
 
  const highestRiskVillages = 
    useMemo(() => { 
 
      return [...villages] 
        .sort( 
          (a, b) => 
            getScore(b) - 
            getScore(a) 
        ) 
        .slice(0, 8); 
 
    }, [villages]); 
 
 
 
  // ========================================================= 
  // DIAGNOSTIC SCORE 
  // ========================================================= 
 
  const diagnosticScore = 
    useMemo(() => { 
 
      if (!villages.length) 
        return 0; 
 
 
      const avg = 
        diagnostics.avgScore; 
 
 
      const criticalPenalty = 
        diagnostics.critical * 
        4; 
 
 
      const immediatePenalty = 
        diagnostics.immediate * 
        3; 
 
 
      const raw = 
        100 - 
        avg - 
        criticalPenalty - 
        immediatePenalty; 
 
 
      return Math.max( 
        0, 
        Math.min( 
          100, 
          Math.round(raw) 
        ) 
      ); 
 
    }, [ 
      villages, 
      diagnostics 
    ]); 
 
 
 
 
  // ========================================================= 
  // UI 
  // ========================================================= 
 
  return ( 
 
    <div 
      style={{ 
        minHeight: "100%", 
        display: "flex", 
        flexDirection: "column", 
        gap: "18px", 
      }} 
    > 
 
 
      {/* ===================================================== 
          HEADER 
      ===================================================== */} 
 
      <div 
        style={{ 
          background: "#ffffff", 
          padding: "22px 26px", 
          borderRadius: "18px", 
          border: "1px solid #e2e8f0", 
          boxShadow: 
            "0 3px 14px rgba(15,23,42,0.06)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: "20px", 
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
              🧠 AI Diagnostics 
            </h1> 
 
 
            <span 
              style={{ 
                padding: "5px 10px", 
                borderRadius: "20px", 
                background: "#dcfce7", 
                color: "#15803d", 
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
            AI-powered disaster risk diagnostics, 
            anomaly detection and decision intelligence. 
          </p> 
 
 
          {lastUpdated && ( 
 
            <p 
              style={{ 
                margin: 
                  "6px 0 0", 
                color: "#94a3b8", 
                fontSize: "12px", 
              }} 
            > 
              Last updated:{" "} 
              {lastUpdated.toLocaleTimeString()} 
            </p> 
 
          )} 
 
        </div> 
 
 
 
        <button 
          onClick={loadData} 
          style={{ 
            border: "1px solid #cbd5e1", 
            background: "#f8fafc", 
            padding: "10px 16px", 
            borderRadius: "10px", 
            cursor: "pointer", 
            fontWeight: 700, 
            color: "#334155", 
          }} 
        > 
          ↻ Refresh Analysis 
        </button> 
 
      </div> 
 
 
 
 
      {/* ===================================================== 
          TOP CARDS 
      ===================================================== */} 
 
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: 
            "repeat(4, minmax(0, 1fr))", 
          gap: "16px", 
        }} 
      > 
 
 
        <MetricCard 
          title="Diagnostic Score" 
          value={`${diagnosticScore}%`} 
          icon="🧠" 
          subtitle="AI system assessment" 
          background="#eff6ff" 
        /> 
 
 
        <MetricCard 
          title="Critical Signals" 
          value={diagnostics.critical} 
          icon="🚨" 
          subtitle="Immediate attention" 
          background="#fef2f2" 
        /> 
 
 
        <MetricCard 
          title="Population Exposure" 
          value={diagnostics.population.toLocaleString()} 
          icon="👥" 
          subtitle="People potentially affected" 
          background="#fff7ed" 
        /> 
 
 
        <MetricCard 
          title="Threat Level" 
          value={diagnostics.systemStatus} 
          icon="📡" 
          subtitle="Current AI assessment" 
          background="#f0fdf4" 
        /> 
 
      </div> 
 
 
 
 
      {/* ===================================================== 
          AI OVERVIEW 
      ===================================================== */} 
 
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: 
            "1.4fr 1fr", 
          gap: "18px", 
        }} 
      > 
 
 
        {/* AI INTELLIGENCE */} 
 
        <div 
          style={{ 
            background: "#ffffff", 
            border: 
              "1px solid #e2e8f0", 
            borderRadius: "18px", 
            padding: "22px", 
            boxShadow: 
              "0 2px 10px rgba(15,23,42,0.04)", 
          }} 
        > 
 
          <div 
            style={{ 
              display: "flex", 
              justifyContent: 
                "space-between", 
              alignItems: "center", 
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
                AI Intelligence Overview 
              </h2> 
 
              <p 
                style={{ 
                  margin: 
                    "5px 0 0", 
                  color: "#64748b", 
                  fontSize: "13px", 
                }} 
              > 
                Automated interpretation of 
                current disaster signals. 
              </p> 
 
            </div> 
 
 
            <div 
              style={{ 
                width: "55px", 
                height: "55px", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                background: 
                  "conic-gradient(#2563eb " + 
                  `${diagnosticScore}%` + 
                  ", #e2e8f0 0)", 
              }} 
            > 
 
              <div 
                style={{ 
                  width: "43px", 
                  height: "43px", 
                  borderRadius: "50%", 
                  background: "#ffffff", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontWeight: 800, 
                  fontSize: "12px", 
                }} 
              > 
                {diagnosticScore} 
              </div> 
 
            </div> 
 
          </div> 
 
 
 
          <div 
            style={{ 
              marginTop: "24px", 
              display: "grid", 
              gridTemplateColumns: 
                "repeat(2,1fr)", 
              gap: "12px", 
            }} 
          > 
 
            <Insight 
              label="Dominant Hazard" 
              value={ 
                diagnostics.dominantHazard 
              } 
              icon="🌪️" 
            /> 
 
 
            <Insight 
              label="Average Risk Score" 
              value={ 
                diagnostics.avgScore 
                  .toFixed(1) 
              } 
              icon="📊" 
            /> 
 
 
            <Insight 
              label="High Risk Villages" 
              value={ 
                diagnostics.high 
              } 
              icon="⚠️" 
            /> 
 
 
            <Insight 
              label="Immediate Actions" 
              value={ 
                diagnostics.immediate 
              } 
              icon="🚚" 
            /> 
 
          </div> 
 
        </div> 
 
 
 
 
        {/* SYSTEM HEALTH */} 
 
        <div 
          style={{ 
            background: "#ffffff", 
            border: 
              "1px solid #e2e8f0", 
            borderRadius: "18px", 
            padding: "22px", 
          }} 
        > 
 
          <h2 
            style={{ 
              margin: 0, 
              fontSize: "19px", 
            }} 
          > 
            ⚙️ Diagnostic Health 
          </h2> 
 
 
          <p 
            style={{ 
              color: "#64748b", 
              fontSize: "13px", 
            }} 
          > 
            Current monitoring pipeline status 
          </p> 
 
 
 
          <HealthRow 
            name="Village Data Stream" 
            status={ 
              villages.length 
                ? "CONNECTED" 
                : "NO DATA" 
            } 
          /> 
 
 
          <HealthRow 
            name="Hazard Monitoring" 
            status={ 
              hazards.length 
                ? "CONNECTED" 
                : "NO DATA" 
            } 
          /> 
 
 
          <HealthRow 
            name="Risk Engine" 
            status={ 
              villages.length 
                ? "ACTIVE" 
                : "WAITING" 
            } 
          /> 
 
 
          <HealthRow 
            name="AI Diagnostics" 
            status={ 
              villages.length 
                ? "RUNNING" 
                : "STANDBY" 
            } 
          /> 
 
        </div> 
 
      </div> 
 
 
 
 
      {/* ===================================================== 
          RISK SIGNAL ANALYSIS 
      ===================================================== */} 
 
      <div 
        style={{ 
          background: "#ffffff", 
          border: 
            "1px solid #e2e8f0", 
          borderRadius: "18px", 
          padding: "22px", 
        }} 
      > 
 
        <h2 
          style={{ 
            margin: 
              "0 0 18px", 
            fontSize: "19px", 
          }} 
        > 
          📈 Risk Signal Analysis 
        </h2> 
 
 
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: 
              "repeat(3,1fr)", 
            gap: "16px", 
          }} 
        > 
 
 
          <SignalCard 
            title="Critical Exposure" 
            value={ 
              diagnostics.critical 
            } 
            total={ 
              diagnostics.total 
            } 
            description="Villages requiring immediate assessment." 
          /> 
 
 
          <SignalCard 
            title="High Risk Exposure" 
            value={ 
              diagnostics.high 
            } 
            total={ 
              diagnostics.total 
            } 
            description="Areas showing elevated disaster probability." 
          /> 
 
 
          <SignalCard 
            title="Relocation Pressure" 
            value={ 
              diagnostics.immediate 
            } 
            total={ 
              diagnostics.total 
            } 
            description="Locations requiring urgent relocation planning." 
          /> 
 
 
        </div> 
 
      </div> 
 
 
 
 
      {/* ===================================================== 
          HIGHEST RISK TABLE 
      ===================================================== */} 
 
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
            marginBottom: "16px", 
          }} 
        > 
 
          <div> 
 
            <h2 
              style={{ 
                margin: 0, 
                fontSize: "19px", 
              }} 
            > 
              🔍 Highest Risk Signals 
            </h2> 
 
            <p 
              style={{ 
                margin: 
                  "5px 0 0", 
                color: "#64748b", 
                fontSize: "13px", 
              }} 
            > 
              Villages ranked using current 
              risk scores. 
            </p> 
 
          </div> 
 
        </div> 
 
 
 
        {loading ? ( 
 
          <div 
            style={{ 
              padding: "30px", 
              textAlign: "center", 
              color: "#64748b", 
            }} 
          > 
            Loading diagnostic intelligence... 
          </div> 
 
        ) : highestRiskVillages.length === 0 ? ( 
 
          <div 
            style={{ 
              padding: "30px", 
              textAlign: "center", 
              color: "#64748b", 
            }} 
          > 
            No village diagnostic data available. 
          </div> 
 
        ) : ( 
 
          <div 
            style={{ 
              overflowX: "auto", 
            }} 
          > 
 
            <table 
              style={{ 
                width: "100%", 
                borderCollapse: 
                  "collapse", 
              }} 
            > 
 
              <thead> 
 
                <tr 
                  style={{ 
                    background: 
                      "#f8fafc", 
                  }} 
                > 
 
                  <th style={th}> 
                    Village 
                  </th> 
 
                  <th style={th}> 
                    District 
                  </th> 
 
                  <th style={th}> 
                    Hazard 
                  </th> 
 
                  <th style={th}> 
                    Risk Score 
                  </th> 
 
                  <th style={th}> 
                    Risk Level 
                  </th> 
 
                  <th style={th}> 
                    Priority 
                  </th> 
 
                </tr> 
 
              </thead> 
 
 
              <tbody> 
 
                {highestRiskVillages.map( 
                  (village, index) => ( 
 
                    <tr 
                      key={ 
                        village.id ?? 
                        index 
                      } 
                      style={{ 
                        borderBottom: 
                          "1px solid #f1f5f9", 
                      }} 
                    > 
 
                      <td style={td}> 
 
                        <strong> 
                          { 
                            getVillageName( 
                              village 
                            ) 
                          } 
                        </strong> 
 
                      </td> 
 
 
                      <td style={td}> 
                        { 
                          getDistrict( 
                            village 
                          ) 
                        } 
                      </td> 
 
 
                      <td style={td}> 
 
                        <span 
                          style={{ 
                            padding: 
                              "5px 9px", 
                            borderRadius: 
                              "8px", 
                            background: 
                              "#f1f5f9", 
                            fontSize: 
                              "12px", 
                            fontWeight: 
                              600, 
                          }} 
                        > 
                          { 
                            getHazard( 
                              village 
                            ) 
                          } 
                        </span> 
 
                      </td> 
 
 
                      <td style={td}> 
 
                        <strong> 
                          { 
                            getScore( 
                              village 
                            ).toFixed(1) 
                          } 
                        </strong> 
 
                      </td> 
 
 
                      <td style={td}> 
 
                        <RiskBadge 
                          risk={ 
                            getRisk( 
                              village 
                            ) 
                          } 
                        /> 
 
                      </td> 
 
 
                      <td style={td}> 
 
                        <PriorityBadge 
                          priority={ 
                            getPriority( 
                              village 
                            ) 
                          } 
                        /> 
 
                      </td> 
 
                    </tr> 
 
                  ) 
                )} 
 
              </tbody> 
 
            </table> 
 
          </div> 
 
        )} 
 
      </div> 
 
 
 
 
      {/* ===================================================== 
          AI RECOMMENDATION 
      ===================================================== */} 
 
      <div 
        style={{ 
          background: 
            "linear-gradient(135deg,#0f172a,#1e293b)", 
          color: "#ffffff", 
          borderRadius: "18px", 
          padding: "24px", 
          marginBottom: "5px", 
        }} 
      > 
 
        <h2 
          style={{ 
            margin: 
              "0 0 8px", 
            fontSize: "20px", 
          }} 
        > 
          🤖 AI Decision Recommendation 
        </h2> 
 
 
        <p 
          style={{ 
            margin: 0, 
            color: "#cbd5e1", 
            lineHeight: 1.7, 
            fontSize: "14px", 
          }} 
        > 
 
          {diagnostics.critical > 0 
 
            ? `Critical risk signals detected across ${diagnostics.critical} village(s). Immediate field verification and evacuation readiness should be prioritized.` 
 
            : diagnostics.high > 0 
 
            ? `Elevated risk conditions detected across ${diagnostics.high} village(s). Increase monitoring frequency and prepare contingency relocation plans.` 
 
            : diagnostics.total > 0 
 
            ? "Current village risk signals remain within monitored thresholds. Continue real-time monitoring and maintain emergency preparedness." 
 
            : "Waiting for live village data before generating an AI diagnostic recommendation." 
 
          } 
 
        </p> 
 
      </div> 
 
 
    </div> 
 
  ); 
 
}; 
 
 
 
 
// ========================================================= 
// COMPONENTS 
// ========================================================= 
 
 
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  background, 
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
          fontSize: "12px", 
          color: "#64748b", 
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
 
 
      <div 
        style={{ 
          marginTop: "2px", 
          fontSize: "11px", 
          color: "#94a3b8", 
        }} 
      > 
        {subtitle} 
      </div> 
 
    </div> 
 
  </div> 
 
); 
 
 
 
 
const Insight = ({ 
  label, 
  value, 
  icon, 
}) => ( 
 
  <div 
    style={{ 
      padding: "14px", 
      borderRadius: "12px", 
      background: "#f8fafc", 
      border: 
        "1px solid #e2e8f0", 
    }} 
  > 
 
    <div 
      style={{ 
        fontSize: "12px", 
        color: "#64748b", 
      }} 
    > 
      {icon} {label} 
    </div> 
 
 
    <div 
      style={{ 
        marginTop: "6px", 
        fontWeight: 800, 
        fontSize: "18px", 
        color: "#0f172a", 
      }} 
    > 
      {value} 
    </div> 
 
  </div> 
 
); 
 
 
 
 
const HealthRow = ({ 
  name, 
  status, 
}) => { 
 
  const healthy = 
    status === "CONNECTED" || 
    status === "ACTIVE" || 
    status === "RUNNING"; 
 
 
  return ( 
 
    <div 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: 
          "space-between", 
        padding: 
          "12px 0", 
        borderBottom: 
          "1px solid #f1f5f9", 
      }} 
    > 
 
      <span 
        style={{ 
          fontSize: "13px", 
          color: "#334155", 
        }} 
      > 
        {name} 
      </span> 
 
 
      <span 
        style={{ 
          fontSize: "11px", 
          fontWeight: 800, 
          padding: 
            "5px 9px", 
          borderRadius: 
            "20px", 
          background: 
            healthy 
              ? "#dcfce7" 
              : "#fef3c7", 
          color: 
            healthy 
              ? "#15803d" 
              : "#b45309", 
        }} 
      > 
        ● {status} 
      </span> 
 
    </div> 
 
  ); 
 
}; 
 
 
 
 
const SignalCard = ({ 
  title, 
  value, 
  total, 
  description, 
}) => { 
 
  const percentage = 
    total > 0 
      ? Math.round( 
          (value / total) * 100 
        ) 
      : 0; 
 
 
  return ( 
 
    <div 
      style={{ 
        border: 
          "1px solid #e2e8f0", 
        borderRadius: "14px", 
        padding: "18px", 
      }} 
    > 
 
      <div 
        style={{ 
          display: "flex", 
          justifyContent: 
            "space-between", 
        }} 
      > 
 
        <strong 
          style={{ 
            color: "#334155", 
            fontSize: "14px", 
          }} 
        > 
          {title} 
        </strong> 
 
 
        <strong 
          style={{ 
            color: "#0f172a", 
          }} 
        > 
          {value} 
        </strong> 
 
      </div> 
 
 
      <div 
        style={{ 
          height: "8px", 
          background: 
            "#e2e8f0", 
          borderRadius: "20px", 
          marginTop: "14px", 
          overflow: "hidden", 
        }} 
      > 
 
        <div 
          style={{ 
            width: 
              `${Math.min( 
                percentage, 
                100 
              )}%`, 
            height: "100%", 
            background: 
              "#2563eb", 
            borderRadius: 
              "20px", 
          }} 
        /> 
 
      </div> 
 
 
      <p 
        style={{ 
          margin: 
            "10px 0 0", 
          fontSize: "12px", 
          color: "#64748b", 
          lineHeight: 1.5, 
        }} 
      > 
        {description} 
      </p> 
 
    </div> 
 
  ); 
 
}; 
 
 
 
 
const RiskBadge = ({ 
  risk, 
}) => { 
 
  let background = 
    "#f1f5f9"; 
 
  let color = 
    "#475569"; 
 
 
  if ( 
    risk === "CRITICAL" 
  ) { 
    background = 
      "#fee2e2"; 
    color = 
      "#b91c1c"; 
  } 
  else if ( 
    risk === "HIGH" || 
    risk === "SEVERE" 
  ) { 
    background = 
      "#ffedd5"; 
    color = 
      "#c2410c"; 
  } 
  else if ( 
    risk === "MEDIUM" || 
    risk === "MODERATE" 
  ) { 
    background = 
      "#fef3c7"; 
    color = 
      "#a16207"; 
  } 
  else if ( 
    risk === "LOW" 
  ) { 
    background = 
      "#dcfce7"; 
    color = 
      "#15803d"; 
  } 
 
 
  return ( 
 
    <span 
      style={{ 
        padding: 
          "5px 10px", 
        borderRadius: 
          "20px", 
        background, 
        color, 
        fontSize: 
          "11px", 
        fontWeight: 
          800, 
      }} 
    > 
      {risk || "UNKNOWN"} 
    </span> 
 
  ); 
 
}; 
 
 
 
 
const PriorityBadge = ({ 
  priority, 
}) => { 
 
  let background = 
    "#f1f5f9"; 
 
  let color = 
    "#475569"; 
 
 
  if ( 
    priority === "IMMEDIATE" || 
    priority === "URGENT" 
  ) { 
    background = 
      "#fee2e2"; 
    color = 
      "#b91c1c"; 
  } 
  else if ( 
    priority === "HIGH" 
  ) { 
    background = 
      "#ffedd5"; 
    color = 
      "#c2410c"; 
  } 
  else if ( 
    priority === "MEDIUM" 
  ) { 
    background = 
      "#fef3c7"; 
    color = 
      "#a16207"; 
  } 
  else if ( 
    priority === "LOW" 
  ) { 
    background = 
      "#dcfce7"; 
    color = 
      "#15803d"; 
  } 
 
 
  return ( 
 
    <span 
      style={{ 
        padding: 
          "5px 10px", 
        borderRadius: 
          "20px", 
        background, 
        color, 
        fontSize: 
          "11px", 
        fontWeight: 
          800, 
      }} 
    > 
      {priority || "—"} 
    </span> 
 
  ); 
 
}; 
 
 
 
 
// ========================================================= 
// TABLE STYLES 
// ========================================================= 
 
const th = { 
  textAlign: "left", 
  padding: "12px", 
  fontSize: "11px", 
  color: "#64748b", 
  textTransform: "uppercase", 
  letterSpacing: "0.05em", 
}; 
 
 
const td = { 
  padding: "14px 12px", 
  fontSize: "13px", 
  color: "#334155", 
}; 
 
 
 
export default AIDiagnostics;    