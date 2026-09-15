import { useEffect, useMemo, useState } from "react";
import { getVillages, getHazardZones } from "../services/api";
import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const RISK_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid #334155",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#f8fafc",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          fontSize: "12px",
        }}
      >
        <p style={{ fontWeight: "700", marginBottom: "4px", color: "#38bdf8" }}>{label}</p>
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
            <strong style={{ color: "#ffffff" }}>
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [villages, setVillages] = useState(initialVillages || []);
  const [hazards, setHazards] = useState(initialHazards || []);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [reportType, setReportType] = useState("overview");

  const getRisk = (v) => String(v?.riskLevel ?? v?.risk_level ?? v?.risk ?? "LOW").toUpperCase();
  const getHazard = (v) => String(v?.hazardType ?? v?.hazard_type ?? v?.hazard ?? "Flood");
  const getPopulation = (v) => Number(v?.population ?? v?.populationAtRisk ?? 0) || 0;
  const getScore = (v) => Number(v?.riskScore ?? v?.risk_score ?? v?.score ?? 0) || 0;
  const getName = (v) => v?.name ?? v?.villageName ?? "Village";
  const getDistrict = (v) => v?.district ?? v?.districtName ?? "District";

  const loadReports = async () => {
    try {
      setLoading(true);
      const [vData, hData] = await Promise.all([getVillages(), getHazardZones()]);
      if (Array.isArray(vData) && vData.length > 0) setVillages(vData);
      if (Array.isArray(hData) && hData.length > 0) setHazards(hData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Reports loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalVillages = villages.length;
    let criticalPop = 0;
    let highPop = 0;
    let totalPop = 0;
    let criticalCount = 0;
    let highCount = 0;

    villages.forEach((v) => {
      const pop = getPopulation(v);
      const risk = getRisk(v);
      totalPop += pop;
      if (risk === "CRITICAL") {
        criticalPop += pop;
        criticalCount++;
      } else if (risk === "HIGH") {
        highPop += pop;
        highCount++;
      }
    });

    return { totalVillages, totalPop, criticalPop, highPop, criticalCount, highCount };
  }, [villages]);

  // District Population Bar Chart Data
  const districtPopData = useMemo(() => {
    const map = {};
    villages.forEach((v) => {
      const d = getDistrict(v);
      if (!map[d]) map[d] = { district: d, criticalPop: 0, highPop: 0, totalPop: 0 };
      const pop = getPopulation(v);
      const risk = getRisk(v);
      if (risk === "CRITICAL") map[d].criticalPop += pop;
      else if (risk === "HIGH") map[d].highPop += pop;
      map[d].totalPop += pop;
    });
    return Object.values(map).sort((a, b) => b.criticalPop - a.criticalPop).slice(0, 8);
  }, [villages]);

  // Hazard Breakdown Pie Chart Data
  const hazardBreakdownData = useMemo(() => {
    const map = {};
    villages.forEach((v) => {
      const h = getHazard(v);
      if (!map[h]) map[h] = 0;
      map[h]++;
    });
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [villages]);

  // Evacuation Readiness Progression Curve
  const evacuationProgressData = [
    { phase: "Hour 0 (Alert)", identified: summary.criticalPop, sheltered: 0, inTransit: 0 },
    { phase: "Hour 6", identified: summary.criticalPop, sheltered: Math.round(summary.criticalPop * 0.25), inTransit: Math.round(summary.criticalPop * 0.4) },
    { phase: "Hour 12", identified: summary.criticalPop, sheltered: Math.round(summary.criticalPop * 0.65), inTransit: Math.round(summary.criticalPop * 0.3) },
    { phase: "Hour 24", identified: summary.criticalPop, sheltered: Math.round(summary.criticalPop * 0.92), inTransit: Math.round(summary.criticalPop * 0.08) },
    { phase: "Hour 48 (Target)", identified: summary.criticalPop, sheltered: summary.criticalPop, inTransit: 0 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "#0f172a" }}>
      {/* HEADER */}
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
            <span style={{ fontSize: "20px" }}>📑</span>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Official Disaster Risk & Relief Action Report
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#f1f5f9",
                color: "#334155",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              NDRF / SDMA Standard
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Synthesized operational briefings, demographic exposure assessments, and logistics manifests.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🖨️ Export PDF / Print
          </button>
          <button
            onClick={loadReports}
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
            }}
          >
            🔄 Sync Report
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#ffffff", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TOTAL POPULATION ASSESSED</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {summary.totalPop.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Across {summary.totalVillages} documented habitations</div>
        </div>

        <div style={{ background: "#fff1f2", padding: "14px 18px", borderRadius: "10px", border: "1px solid #fecdd3" }}>
          <div style={{ fontSize: "12px", color: "#be123c", fontWeight: "600" }}>CRITICAL POPULATION EXPOSURE</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>
            {summary.criticalPop.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "#9f1239", marginTop: "2px" }}>In {summary.criticalCount} red-alert settlements</div>
        </div>

        <div style={{ background: "#fff7ed", padding: "14px 18px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "12px", color: "#c2410c", fontWeight: "600" }}>HIGH RISK POPULATION</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#ea580c", marginTop: "4px" }}>
            {summary.highPop.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "#9a3412", marginTop: "2px" }}>In {summary.highCount} orange-alert settlements</div>
        </div>

        <div style={{ background: "#eff6ff", padding: "14px 18px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "600" }}>SHELTER READINESS STATUS</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>Active (92%)</div>
          <div style={{ fontSize: "11px", color: "#1e40af", marginTop: "2px" }}>Relocation corridors validated</div>
        </div>
      </div>

      {/* ROW 1: DISTRICT POPULATION EXPOSURE (BAR) & HAZARD SHARE (DONUT) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
        {/* DISTRICT POPULATION AT RISK BAR CHART */}
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
              District-wise Population Exposure at Critical Tiers
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Estimated citizen headcount requiring immediate vs staged relocation
            </p>
          </div>

          <div style={{ width: "100%", height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtPopData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" height={28} />
                <Bar dataKey="criticalPop" fill={RISK_COLORS.CRITICAL} name="Critical Tier Population" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highPop" fill={RISK_COLORS.HIGH} name="High Tier Population" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HAZARD EXPOSURE DONUT */}
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
              Hazard Threat Distribution
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Settlement proportion by primary hazard type
            </p>
          </div>

          <div style={{ width: "100%", height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {hazardBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: EVACUATION DISPATCH TIMELINE (AREA CHART) */}
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
              Relocation Logistics & Evacuation Progression Curve
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Simulated 48-hour emergency evacuation staging for critical tier habitations
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
            <span style={{ color: "#10b981", fontWeight: "600" }}>● Sheltered at Relocation Sites</span>
            <span style={{ color: "#f59e0b", fontWeight: "600" }}>● In Transit</span>
          </div>
        </div>

        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evacuationProgressData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="shelterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="phase" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sheltered" name="Citizens Sheltered" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#shelterGrad)" />
              <Area type="monotone" dataKey="inTransit" name="In Transit" stroke="#f59e0b" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED EXECUTIVE REGISTRY TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
            Priority Habitational Risk Inventory
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
            Classified registry of settlements requiring immediate relief intervention
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Settlement</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>District</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Primary Hazard</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Population</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Risk Score</th>
                <th style={{ padding: "10px 16px", fontWeight: "600" }}>Recommended Intervention</th>
              </tr>
            </thead>
            <tbody>
              {villages
                .slice()
                .sort((a, b) => getScore(b) - getScore(a))
                .slice(0, 10)
                .map((v, i) => {
                  const r = getRisk(v);
                  const color = RISK_COLORS[r] || "#64748b";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>{getName(v)}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{getDistrict(v)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {getHazard(v)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {getPopulation(v).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color }}>{getScore(v)}%</strong>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {r === "CRITICAL"
                          ? "🚨 Immediate Evacuation to Primary Relief Camp"
                          : r === "HIGH"
                          ? "⚠️ Stage Pre-emptive Transport & Medical Kits"
                          : "ℹ️ Continuous Meteorological Monitoring"}
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

export default Reports;