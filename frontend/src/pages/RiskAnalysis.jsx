import { useEffect, useMemo, useState } from "react";
import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";
import { getVillages, getHazardZones } from "../services/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const RISK_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const HAZARD_PALETTE = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid #334155",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#f8fafc",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          fontSize: "12px",
        }}
      >
        <p style={{ fontWeight: "700", marginBottom: "4px", color: "#94a3b8" }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px", margin: "3px 0" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color || entry.fill,
                display: "inline-block",
              }}
            />
            <span style={{ color: "#cbd5e1" }}>{entry.name}:</span>
            <strong style={{ color: "#ffffff" }}>{entry.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid #334155",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#f8fafc",
          fontSize: "12px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#38bdf8" }}>{data.name}</div>
        <div style={{ color: "#94a3b8", marginBottom: "6px" }}>District: {data.district}</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Risk Score:</span>
          <strong style={{ color: RISK_COLORS[data.riskLevel] || "#cbd5e1" }}>{data.riskScore}% ({data.riskLevel})</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Population:</span>
          <strong style={{ color: "#f8fafc" }}>{data.population?.toLocaleString()}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Hazard:</span>
          <span style={{ color: "#fbbf24" }}>{data.hazard}</span>
        </div>
      </div>
    );
  }
  return null;
};

const RiskAnalysis = () => {
  const [villages, setVillages] = useState(initialVillages || []);
  const [hazards, setHazards] = useState(initialHazards || []);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [hazardFilter, setHazardFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [liveVillages, liveHazards] = await Promise.all([getVillages(), getHazardZones()]);
      if (Array.isArray(liveVillages) && liveVillages.length > 0) setVillages(liveVillages);
      if (Array.isArray(liveHazards) && liveHazards.length > 0) setHazards(liveHazards);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Risk analysis data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRiskLevel = (v) => String(v?.riskLevel || v?.risk_level || v?.risk || "LOW").toUpperCase();
  const getDistrict = (v) => v?.district || v?.districtName || v?.district_name || "Unknown";
  const getHazard = (v) => v?.hazardType || v?.hazard_type || v?.hazard || v?.hazardName || "Unknown";
  const getRiskScore = (v) => {
    const s = Number(v?.riskScore ?? v?.risk_score ?? v?.score ?? 0);
    return s > 0 && s <= 1 ? Math.round(s * 100) : Math.round(s);
  };
  const getPopulation = (v) => Number(v?.population ?? v?.totalPopulation ?? 0);
  const getName = (v) => v?.name || v?.villageName || v?.village_name || "Village";

  const districts = useMemo(() => {
    const set = new Set(villages.map(getDistrict).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [villages]);

  const hazardTypes = useMemo(() => {
    const set = new Set(villages.map(getHazard).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [villages]);

  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      if (districtFilter !== "ALL" && getDistrict(v) !== districtFilter) return false;
      if (riskFilter !== "ALL" && getRiskLevel(v) !== riskFilter) return false;
      if (hazardFilter !== "ALL" && getHazard(v) !== hazardFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return getName(v).toLowerCase().includes(query) || getDistrict(v).toLowerCase().includes(query);
      }
      return true;
    });
  }, [villages, districtFilter, riskFilter, hazardFilter, searchTerm]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = filteredVillages.length;
    let critical = 0, high = 0, medium = 0, low = 0, totalScore = 0, totalPop = 0;

    filteredVillages.forEach((v) => {
      const r = getRiskLevel(v);
      if (r === "CRITICAL") critical++;
      else if (r === "HIGH") high++;
      else if (r === "MEDIUM") medium++;
      else low++;
      totalScore += getRiskScore(v);
      totalPop += getPopulation(v);
    });

    const avgRisk = total > 0 ? Math.round(totalScore / total) : 0;
    return { total, critical, high, medium, low, avgRisk, totalPop };
  }, [filteredVillages]);

  // 1. Donut Chart Data: Risk Level Distribution
  const riskDonutData = useMemo(() => [
    { name: "Critical", value: stats.critical, color: RISK_COLORS.CRITICAL },
    { name: "High", value: stats.high, color: RISK_COLORS.HIGH },
    { name: "Medium", value: stats.medium, color: RISK_COLORS.MEDIUM },
    { name: "Low", value: stats.low, color: RISK_COLORS.LOW },
  ].filter(d => d.value > 0), [stats]);

  // 2. Bar Chart Data: District Breakdown by Severity
  const districtBarData = useMemo(() => {
    const map = {};
    filteredVillages.forEach((v) => {
      const d = getDistrict(v);
      if (!map[d]) map[d] = { district: d, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 };
      const r = getRiskLevel(v);
      if (map[d][r] !== undefined) map[d][r]++;
      map[d].total++;
    });
    return Object.values(map).sort((a, b) => b.CRITICAL - a.CRITICAL || b.HIGH - a.HIGH).slice(0, 8);
  }, [filteredVillages]);

  // 3. Radar Chart Data: Multi-Hazard Vulnerability Spectrum
  const radarData = useMemo(() => {
    const map = {};
    filteredVillages.forEach((v) => {
      const h = getHazard(v);
      if (!map[h]) map[h] = { hazard: h, count: 0, avgScore: 0, totalScore: 0 };
      map[h].count++;
      map[h].totalScore += getRiskScore(v);
    });
    return Object.values(map).map((item) => ({
      hazard: item.hazard,
      exposure: item.count,
      intensity: Math.round(item.totalScore / (item.count || 1)),
    }));
  }, [filteredVillages]);

  // 4. Scatter Plot: Risk Classification Matrix (Population vs Risk Score)
  const scatterData = useMemo(() => {
    return filteredVillages.map((v) => ({
      name: getName(v),
      district: getDistrict(v),
      hazard: getHazard(v),
      riskScore: getRiskScore(v),
      population: getPopulation(v),
      riskLevel: getRiskLevel(v),
      color: RISK_COLORS[getRiskLevel(v)] || "#94a3b8",
    }));
  }, [filteredVillages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "#0f172a" }}>
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🧭</span>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Risk Analysis & Spatial Classification
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#dbeafe",
                color: "#1e40af",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              ML Calibrated
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Multidimensional vulnerability assessment, hazard classification matrices, and exposure modeling.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={loadData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            🔄 Refresh Analysis
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search village or district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "13px",
            outline: "none",
          }}
        />

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#f8fafc",
            cursor: "pointer",
          }}
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              District: {d}
            </option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#f8fafc",
            cursor: "pointer",
          }}
        >
          <option value="ALL">Risk: All Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={hazardFilter}
          onChange={(e) => setHazardFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#f8fafc",
            cursor: "pointer",
          }}
        >
          {hazardTypes.map((h) => (
            <option key={h} value={h}>
              Hazard: {h}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setDistrictFilter("ALL");
            setRiskFilter("ALL");
            setHazardFilter("ALL");
            setSearchTerm("");
          }}
          style={{
            padding: "8px 14px",
            background: "#f1f5f9",
            color: "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={{ background: "#ffffff", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TOTAL ANALYSED</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{stats.total}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Covering {stats.totalPop.toLocaleString()} residents</div>
        </div>

        <div style={{ background: "#fff1f2", padding: "14px 18px", borderRadius: "10px", border: "1px solid #fecdd3" }}>
          <div style={{ fontSize: "12px", color: "#be123c", fontWeight: "600" }}>CRITICAL SEVERITY</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{stats.critical}</div>
          <div style={{ fontSize: "11px", color: "#9f1239", marginTop: "2px" }}>Immediate emergency tier</div>
        </div>

        <div style={{ background: "#fff7ed", padding: "14px 18px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "12px", color: "#c2410c", fontWeight: "600" }}>HIGH RISK</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#ea580c", marginTop: "4px" }}>{stats.high}</div>
          <div style={{ fontSize: "11px", color: "#9a3412", marginTop: "2px" }}>Active pre-emptive monitoring</div>
        </div>

        <div style={{ background: "#eff6ff", padding: "14px 18px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "600" }}>AVG REGIONAL RISK</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{stats.avgRisk}%</div>
          <div style={{ fontSize: "11px", color: "#1e40af", marginTop: "2px" }}>Composite vulnerability index</div>
        </div>
      </div>

      {/* ROW 1: RECHARTS DONUT & RECHARTS STACKED BAR CHART */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "16px" }}>
        {/* DONUT PIE CHART */}
        <div
          style={{
            background: "#ffffff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              Risk Level Distribution
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Interactive classification breakdown
            </p>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: "#334155", fontSize: "12px", fontWeight: "600" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRICT-WISE STACKED BAR CHART */}
        <div
          style={{
            background: "#ffffff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              District-wise Risk Severity Breakdown
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Multi-tier hazard concentration across top administrative zones
            </p>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" height={28} />
                <Bar dataKey="CRITICAL" stackId="a" fill={RISK_COLORS.CRITICAL} name="Critical" />
                <Bar dataKey="HIGH" stackId="a" fill={RISK_COLORS.HIGH} name="High" />
                <Bar dataKey="MEDIUM" stackId="a" fill={RISK_COLORS.MEDIUM} name="Medium" />
                <Bar dataKey="LOW" stackId="a" fill={RISK_COLORS.LOW} name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: RADAR CHART (MULTI-HAZARD) & SCATTER CLASSIFICATION MAP */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.5fr", gap: "16px" }}>
        {/* RADAR CHART */}
        <div
          style={{
            background: "#ffffff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              Multi-Hazard Vulnerability Spectrum
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Exposure count vs average risk intensity
            </p>
          </div>

          <div style={{ width: "100%", height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="hazard" tick={{ fontSize: 11, fill: "#334155", fontWeight: "600" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Radar name="Exposure Density" dataKey="exposure" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                <Radar name="Risk Intensity (%)" dataKey="intensity" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Legend verticalAlign="bottom" height={28} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SCATTER CLASSIFICATION MAP: Population vs Risk Score */}
        <div
          style={{
            background: "#ffffff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
                Spatial Classification Matrix
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                Risk Score vs Population Exposed (Each dot is a village)
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_COLORS.CRITICAL }} /> Critical
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_COLORS.HIGH }} /> High
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="population"
                  name="Population"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  label={{ value: "Population Exposed", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  type="number"
                  dataKey="riskScore"
                  name="Risk Score"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  label={{ value: "Risk Score (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
                />
                <ZAxis range={[50, 180]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`scatter-${index}`} fill={entry.color} fillOpacity={0.75} stroke="#ffffff" strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DETAILED VILLAGE CLASSIFICATION TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              High Vulnerability Settlement Registry
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Filtered entries ordered by risk severity
            </p>
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Showing {Math.min(filteredVillages.length, 10)} of {filteredVillages.length} locations
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Location</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>District</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Primary Hazard</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Population</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Risk Score</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Classification Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredVillages
                .slice()
                .sort((a, b) => getRiskScore(b) - getRiskScore(a))
                .slice(0, 10)
                .map((v, i) => {
                  const score = getRiskScore(v);
                  const lvl = getRiskLevel(v);
                  const color = RISK_COLORS[lvl] || "#64748b";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>
                        {getName(v)}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{getDistrict(v)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>
                          {getHazard(v)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {getPopulation(v).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", minWidth: "60px" }}>
                            <div style={{ width: `${score}%`, height: "100%", background: color }} />
                          </div>
                          <strong style={{ fontSize: "12px", color }}>{score}%</strong>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: `${color}18`,
                            color: color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {lvl}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;