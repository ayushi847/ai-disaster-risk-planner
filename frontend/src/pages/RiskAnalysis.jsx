import { useEffect, useMemo, useState } from "react";

import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";

import {
  getVillages,
  getHazardZones,
} from "../services/api";

const RiskAnalysis = () => {
  const [villages, setVillages] = useState(initialVillages || []);
  const [hazards, setHazards] = useState(initialHazards || []);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [hazardFilter, setHazardFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // --------------------------------------------------
  // LOAD LIVE DATA
  // --------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);

      const [liveVillages, liveHazards] = await Promise.all([
        getVillages(),
        getHazardZones(),
      ]);

      if (Array.isArray(liveVillages) && liveVillages.length > 0) {
        setVillages(liveVillages);
      }

      if (Array.isArray(liveHazards) && liveHazards.length > 0) {
        setHazards(liveHazards);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Risk analysis data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Refresh live data every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------
  // NORMALIZE DATA
  // --------------------------------------------------

  const getRiskLevel = (village) => {
    const level =
      village?.riskLevel ||
      village?.risk_level ||
      village?.risk ||
      "";

    return String(level).toUpperCase();
  };

  const getPriority = (village) => {
    const priority =
      village?.priority ||
      village?.relocationPriority ||
      village?.relocation_priority ||
      "";

    return String(priority).toUpperCase();
  };

  const getDistrict = (village) => {
    return (
      village?.district ||
      village?.districtName ||
      village?.district_name ||
      "Unknown"
    );
  };

  const getHazard = (village) => {
    return (
      village?.hazardType ||
      village?.hazard_type ||
      village?.hazard ||
      village?.hazardName ||
      "Unknown"
    );
  };

  const getRiskScore = (village) => {
    const score =
      village?.riskScore ??
      village?.risk_score ??
      village?.score ??
      village?.riskPercentage ??
      0;

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) return 0;

    // If backend sends 0-1 confidence/risk
    if (numericScore > 0 && numericScore <= 1) {
      return numericScore * 100;
    }

    return numericScore;
  };

  const getPopulation = (village) => {
    const population =
      village?.population ??
      village?.populationAtRisk ??
      village?.population_at_risk ??
      0;

    const value = Number(population);

    return Number.isNaN(value) ? 0 : value;
  };

  // --------------------------------------------------
  // FILTER OPTIONS
  // --------------------------------------------------

  const districts = useMemo(() => {
    return [
      "ALL",
      ...new Set(
        villages
          .map(getDistrict)
          .filter((district) => district !== "Unknown")
      ),
    ];
  }, [villages]);

  const hazardTypes = useMemo(() => {
    return [
      "ALL",
      ...new Set(
        villages
          .map(getHazard)
          .filter((hazard) => hazard !== "Unknown")
      ),
    ];
  }, [villages]);

  // --------------------------------------------------
  // FILTERED VILLAGES
  // --------------------------------------------------

  const filteredVillages = useMemo(() => {
    return villages.filter((village) => {
      const district = getDistrict(village);
      const risk = getRiskLevel(village);
      const hazard = getHazard(village);
      const priority = getPriority(village);

      const districtMatch =
        districtFilter === "ALL" ||
        district === districtFilter;

      const riskMatch =
        riskFilter === "ALL" ||
        risk === riskFilter;

      const hazardMatch =
        hazardFilter === "ALL" ||
        hazard === hazardFilter;

      const priorityMatch =
        priorityFilter === "ALL" ||
        priority === priorityFilter;

      return (
        districtMatch &&
        riskMatch &&
        hazardMatch &&
        priorityMatch
      );
    });
  }, [
    villages,
    districtFilter,
    riskFilter,
    hazardFilter,
    priorityFilter,
  ]);

  // --------------------------------------------------
  // RISK COUNTS
  // --------------------------------------------------

  const riskStats = useMemo(() => {
    const total = filteredVillages.length;

    const critical = filteredVillages.filter(
      (v) => getRiskLevel(v) === "CRITICAL"
    ).length;

    const high = filteredVillages.filter(
      (v) => getRiskLevel(v) === "HIGH"
    ).length;

    const medium = filteredVillages.filter(
      (v) => getRiskLevel(v) === "MEDIUM"
    ).length;

    const low = filteredVillages.filter(
      (v) => getRiskLevel(v) === "LOW"
    ).length;

    const averageRisk =
      total > 0
        ? filteredVillages.reduce(
            (sum, village) => sum + getRiskScore(village),
            0
          ) / total
        : 0;

    return {
      total,
      critical,
      high,
      medium,
      low,
      averageRisk,
    };
  }, [filteredVillages]);

  // --------------------------------------------------
  // POPULATION / PRIORITY
  // --------------------------------------------------

  const populationAtRisk = useMemo(() => {
    return filteredVillages
      .filter((village) => {
        const risk = getRiskLevel(village);

        return (
          risk === "CRITICAL" ||
          risk === "HIGH"
        );
      })
      .reduce(
        (sum, village) => sum + getPopulation(village),
        0
      );
  }, [filteredVillages]);

  const immediateRelocation = useMemo(() => {
    return filteredVillages.filter(
      (village) =>
        getPriority(village) === "IMMEDIATE"
    ).length;
  }, [filteredVillages]);

  // --------------------------------------------------
  // HAZARD DISTRIBUTION
  // --------------------------------------------------

  const hazardDistribution = useMemo(() => {
    const map = {};

    filteredVillages.forEach((village) => {
      const hazard = getHazard(village);

      if (!map[hazard]) {
        map[hazard] = 0;
      }

      map[hazard]++;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredVillages]);

  // --------------------------------------------------
  // TOP RISK VILLAGES
  // --------------------------------------------------

  const topRiskVillages = useMemo(() => {
    return [...filteredVillages]
      .sort(
        (a, b) =>
          getRiskScore(b) - getRiskScore(a)
      )
      .slice(0, 10);
  }, [filteredVillages]);

  // --------------------------------------------------
  // RISK %
  // --------------------------------------------------

  const getPercentage = (value) => {
    if (!riskStats.total) return 0;

    return Math.round(
      (value / riskStats.total) * 100
    );
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("en-IN").format(
      Math.round(number)
    );
  };

  const riskColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "#dc2626";

      case "HIGH":
        return "#ea580c";

      case "MEDIUM":
        return "#d97706";

      case "LOW":
        return "#16a34a";

      default:
        return "#64748b";
    }
  };

  const riskBackground = (level) => {
    switch (level) {
      case "CRITICAL":
        return "#fee2e2";

      case "HIGH":
        return "#ffedd5";

      case "MEDIUM":
        return "#fef3c7";

      case "LOW":
        return "#dcfce7";

      default:
        return "#f1f5f9";
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100%",
        paddingBottom: "30px",
        color: "#0f172a",
      }}
    >

      {/* ================= HEADER ================= */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "22px 26px",
          marginBottom: "18px",
          boxShadow:
            "0 4px 18px rgba(15,23,42,0.05)",
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
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
              }}
            >
              Risk Analysis
            </h1>

            <span
              style={{
                background: "#dcfce7",
                color: "#15803d",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />
              LIVE
            </span>
          </div>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Real-time disaster vulnerability and
            population risk intelligence
          </p>
        </div>

        <div
          style={{
            textAlign: "right",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          <div style={{ fontWeight: "700" }}>
            Last updated
          </div>

          <div>
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "18px",
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(160px, 1fr)) auto",
          gap: "12px",
          boxShadow:
            "0 2px 12px rgba(15,23,42,0.04)",
        }}
      >

        <select
          value={districtFilter}
          onChange={(e) =>
            setDistrictFilter(e.target.value)
          }
          style={selectStyle}
        >
          {districts.map((district) => (
            <option
              key={district}
              value={district}
            >
              District: {district}
            </option>
          ))}
        </select>

        <select
          value={hazardFilter}
          onChange={(e) =>
            setHazardFilter(e.target.value)
          }
          style={selectStyle}
        >
          {hazardTypes.map((hazard) => (
            <option
              key={hazard}
              value={hazard}
            >
              Hazard: {hazard}
            </option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) =>
            setRiskFilter(e.target.value)
          }
          style={selectStyle}
        >
          <option value="ALL">
            Risk Level: All
          </option>

          <option value="CRITICAL">
            Critical
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="LOW">
            Low
          </option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value)
          }
          style={selectStyle}
        >
          <option value="ALL">
            Priority: All
          </option>

          <option value="IMMEDIATE">
            Immediate
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="LOW">
            Low
          </option>
        </select>

        <button
          onClick={() => {
            setDistrictFilter("ALL");
            setRiskFilter("ALL");
            setHazardFilter("ALL");
            setPriorityFilter("ALL");
          }}
          style={{
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#334155",
            borderRadius: "10px",
            padding: "0 16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >

        <SummaryCard
          title="Villages Analysed"
          value={riskStats.total}
          subtitle="Current dataset"
          icon="🏘️"
        />

        <SummaryCard
          title="Critical Zones"
          value={riskStats.critical}
          subtitle={`${getPercentage(
            riskStats.critical
          )}% of villages`}
          icon="🚨"
          accent="#dc2626"
        />

        <SummaryCard
          title="High Risk"
          value={riskStats.high}
          subtitle={`${getPercentage(
            riskStats.high
          )}% of villages`}
          icon="⚠️"
          accent="#ea580c"
        />

        <SummaryCard
          title="Population at Risk"
          value={formatNumber(
            populationAtRisk
          )}
          subtitle="High + critical"
          icon="👥"
          accent="#7c3aed"
        />

        <SummaryCard
          title="Immediate Relocation"
          value={immediateRelocation}
          subtitle="Priority villages"
          icon="🚑"
          accent="#be123c"
        />

      </div>

      {/* ================= ANALYTICS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.15fr 0.85fr",
          gap: "18px",
          marginBottom: "18px",
        }}
      >

        {/* RISK DISTRIBUTION */}

        <Panel
          title="Risk Distribution"
          subtitle="Current village-level risk classification"
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
              minHeight: "220px",
            }}
          >

            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: `conic-gradient(
                  #dc2626 0 ${getPercentage(
                    riskStats.critical
                  )}%,
                  #ea580c ${getPercentage(
                    riskStats.critical
                  )}% ${getPercentage(
                    riskStats.critical +
                      riskStats.high
                  )}%,
                  #d97706 ${getPercentage(
                    riskStats.critical +
                      riskStats.high
                  )}% ${getPercentage(
                    riskStats.critical +
                      riskStats.high +
                      riskStats.medium
                  )}%,
                  #16a34a ${getPercentage(
                    riskStats.critical +
                      riskStats.high +
                      riskStats.medium
                  )}% 100%
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "112px",
                  height: "112px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <strong
                  style={{
                    fontSize: "25px",
                  }}
                >
                  {Math.round(
                    riskStats.averageRisk
                  )}
                </strong>

                <span
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                  }}
                >
                  Avg Risk Score
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <RiskBar
                label="Critical"
                value={riskStats.critical}
                total={riskStats.total}
                color="#dc2626"
              />

              <RiskBar
                label="High"
                value={riskStats.high}
                total={riskStats.total}
                color="#ea580c"
              />

              <RiskBar
                label="Medium"
                value={riskStats.medium}
                total={riskStats.total}
                color="#d97706"
              />

              <RiskBar
                label="Low"
                value={riskStats.low}
                total={riskStats.total}
                color="#16a34a"
              />
            </div>

          </div>
        </Panel>

        {/* HAZARD DISTRIBUTION */}

        <Panel
          title="Hazard Distribution"
          subtitle="Hazard exposure across analysed villages"
        >

          {hazardDistribution.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                paddingTop: "8px",
              }}
            >
              {hazardDistribution.map(
                ([hazard, count]) => {
                  const max =
                    hazardDistribution[0][1];

                  const width =
                    max > 0
                      ? (count / max) * 100
                      : 0;

                  return (
                    <div key={hazard}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: "7px",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        <span>{hazard}</span>

                        <span
                          style={{
                            color: "#64748b",
                          }}
                        >
                          {count} villages
                        </span>
                      </div>

                      <div
                        style={{
                          height: "9px",
                          background: "#e2e8f0",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${width}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg,#2563eb,#7c3aed)",
                            borderRadius:
                              "999px",
                            transition:
                              "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

        </Panel>
      </div>

      {/* ================= INTELLIGENCE CARDS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "18px",
        }}
      >

        <InsightCard
          icon="📊"
          title="Average Risk Score"
          value={`${Math.round(
            riskStats.averageRisk
          )}%`}
          text={
            riskStats.averageRisk >= 70
              ? "Overall vulnerability is significantly elevated."
              : riskStats.averageRisk >= 40
              ? "Moderate vulnerability detected across the analysed region."
              : "Current overall risk remains comparatively controlled."
          }
        />

        <InsightCard
          icon="🚨"
          title="Critical Exposure"
          value={`${getPercentage(
            riskStats.critical
          )}%`}
          text={
            riskStats.critical > 0
              ? `${riskStats.critical} villages require immediate risk attention.`
              : "No critical villages detected in the current filtered dataset."
          }
        />

        <InsightCard
          icon="🧠"
          title="Risk Intelligence"
          value={
            loading
              ? "Updating..."
              : "ACTIVE"
          }
          text="Analysis is continuously recalculated from the latest village and hazard data."
        />

      </div>

      {/* ================= TOP RISK TABLE ================= */}

      <Panel
        title="Highest Risk Villages"
        subtitle="Villages ranked by current calculated risk score"
      >

        <div
          style={{
            overflowX: "auto",
          }}
        >

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "800px",
            }}
          >
            <thead>
              <tr>
                {[
                  "Rank",
                  "Village",
                  "District",
                  "Hazard",
                  "Risk Score",
                  "Risk Level",
                  "Priority",
                  "Population",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={tableHeaderStyle}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {topRiskVillages.map(
                (village, index) => {
                  const risk =
                    getRiskLevel(village);

                  const priority =
                    getPriority(village);

                  return (
                    <tr
                      key={
                        village.id ||
                        village._id ||
                        `${index}-${getDistrict(
                          village
                        )}`
                      }
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background:
                              index < 3
                                ? "#fef2f2"
                                : "#f8fafc",
                            display: "inline-flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontWeight: "800",
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          fontWeight: "800",
                        }}
                      >
                        {village.name ||
                          village.villageName ||
                          village.village_name ||
                          "Unknown Village"}
                      </td>

                      <td style={tableCellStyle}>
                        {getDistrict(village)}
                      </td>

                      <td style={tableCellStyle}>
                        {getHazard(village)}
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          fontWeight: "800",
                        }}
                      >
                        {Math.round(
                          getRiskScore(village)
                        )}
                        %
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            padding:
                              "5px 9px",
                            borderRadius:
                              "999px",
                            fontSize: "11px",
                            fontWeight: "800",
                            color:
                              riskColor(risk),
                            background:
                              riskBackground(
                                risk
                              ),
                          }}
                        >
                          {risk || "UNKNOWN"}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            color:
                              priority ===
                              "IMMEDIATE"
                                ? "#be123c"
                                : "#475569",
                          }}
                        >
                          {priority ||
                            "NOT SET"}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        {formatNumber(
                          getPopulation(village)
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {topRiskVillages.length === 0 && (
            <EmptyState />
          )}

        </div>
      </Panel>

      {/* ================= FOOTER STATUS ================= */}

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        <span>
          Showing {filteredVillages.length} of{" "}
          {villages.length} villages
        </span>

        <span>
          Auto-refresh: 30 seconds
        </span>
      </div>

    </div>
  );
};

// ==================================================
// COMPONENTS
// ==================================================

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  accent = "#2563eb",
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "15px",
        padding: "17px",
        boxShadow:
          "0 3px 12px rgba(15,23,42,0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "7px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: "25px",
              fontWeight: "850",
              color: "#0f172a",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "11px",
            background: `${accent}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: "10px",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

const Panel = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "17px",
        padding: "20px",
        boxShadow:
          "0 3px 15px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: "800",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: "5px 0 0",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
};

const RiskBar = ({
  label,
  value,
  total,
  color,
}) => {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginBottom: "7px",
          fontSize: "13px",
        }}
      >
        <span
          style={{
            fontWeight: "700",
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: "#64748b",
            fontWeight: "700",
          }}
        >
          {value} · {percentage}%
        </span>
      </div>

      <div
        style={{
          height: "9px",
          background: "#f1f5f9",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
            transition:
              "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
};

const InsightCard = ({
  icon,
  title,
  value,
  text,
}) => {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,#ffffff,#f8fafc)",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "19px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "11px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "21px" }}>
          {icon}
        </span>

        <span
          style={{
            fontSize: "13px",
            fontWeight: "800",
            color: "#475569",
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: "850",
          marginBottom: "6px",
        }}
      >
        {value}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div
      style={{
        minHeight: "150px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      No risk data available for the selected filters.
    </div>
  );
};

// ==================================================
// STYLES
// ==================================================

const selectStyle = {
  width: "100%",
  height: "42px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#334155",
  padding: "0 11px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
};

const tableHeaderStyle = {
  textAlign: "left",
  padding: "11px 10px",
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  background: "#f8fafc",
};

const tableCellStyle = {
  padding: "13px 10px",
  fontSize: "12px",
  color: "#334155",
};

export default RiskAnalysis;