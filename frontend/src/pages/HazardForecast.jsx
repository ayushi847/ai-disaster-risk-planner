


import { useEffect, useMemo, useState } from "react";

import { villages as initialVillages } from "../utils/villages";
import { hazards as initialHazards } from "../utils/hazards";

import {
  getVillages,
  getHazardZones,
} from "../services/api";

const HazardForecast = () => {
  const [villages, setVillages] = useState(initialVillages || []);
  const [hazards, setHazards] = useState(initialHazards || []);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [hazardFilter, setHazardFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // =========================================================
  // LIVE DATA
  // =========================================================

  const loadLiveData = async () => {
    try {
      setLoading(true);

      const [liveVillages, liveHazards] =
        await Promise.all([
          getVillages(),
          getHazardZones(),
        ]);

      if (
        Array.isArray(liveVillages) &&
        liveVillages.length > 0
      ) {
        setVillages(liveVillages);
      }

      if (
        Array.isArray(liveHazards) &&
        liveHazards.length > 0
      ) {
        setHazards(liveHazards);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Hazard forecast loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadLiveData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getHazardName = (item) => {
    return (
      item?.hazardType ||
      item?.hazard_type ||
      item?.hazard ||
      item?.type ||
      item?.name ||
      "Unknown"
    );
  };

  const getSeverity = (item) => {
    const value =
      item?.severity ||
      item?.riskLevel ||
      item?.risk_level ||
      item?.level ||
      "";

    return String(value).toUpperCase();
  };

  const getDistrict = (item) => {
    return (
      item?.district ||
      item?.districtName ||
      item?.district_name ||
      "Unknown"
    );
  };

  const getVillageName = (item) => {
    return (
      item?.name ||
      item?.villageName ||
      item?.village_name ||
      "Unknown Village"
    );
  };

  const getRiskScore = (item) => {
    const value =
      item?.riskScore ??
      item?.risk_score ??
      item?.score ??
      0;

    const score = Number(value);

    if (Number.isNaN(score)) return 0;

    if (score > 0 && score <= 1) {
      return score * 100;
    }

    return score;
  };

  const getPopulation = (item) => {
    const value =
      item?.population ??
      item?.populationAtRisk ??
      item?.population_at_risk ??
      0;

    const population = Number(value);

    return Number.isNaN(population)
      ? 0
      : population;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(
      Math.round(value || 0)
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
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

  const getSeverityBackground = (severity) => {
    switch (severity) {
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

  const getHazardIcon = (hazard) => {
    const value = String(hazard).toLowerCase();

    if (value.includes("flood")) return "🌊";
    if (value.includes("landslide")) return "⛰️";
    if (value.includes("cyclone")) return "🌀";
    if (value.includes("earthquake")) return "🌍";
    if (value.includes("fire")) return "🔥";
    if (value.includes("storm")) return "⛈️";
    if (value.includes("heat")) return "🌡️";
    if (value.includes("drought")) return "☀️";

    return "⚠️";
  };

  // =========================================================
  // HAZARD TYPES
  // =========================================================

  const hazardTypes = useMemo(() => {
    const combined = [
      ...villages,
      ...hazards,
    ];

    return [
      "ALL",
      ...new Set(
        combined
          .map(getHazardName)
          .filter(
            (item) =>
              item &&
              item !== "Unknown"
          )
      ),
    ];
  }, [villages, hazards]);

  // =========================================================
  // HAZARD RECORDS
  // =========================================================

  const hazardRecords = useMemo(() => {
    const records = [];

    villages.forEach((village) => {
      records.push({
        ...village,
        source: "village",
      });
    });

    hazards.forEach((hazard) => {
      records.push({
        ...hazard,
        source: "hazard",
      });
    });

    return records;
  }, [villages, hazards]);

  // =========================================================
  // FILTERED RECORDS
  // =========================================================

  const filteredRecords = useMemo(() => {
    return hazardRecords.filter((item) => {
      const hazard = getHazardName(item);
      const severity = getSeverity(item);

      const hazardMatch =
        hazardFilter === "ALL" ||
        hazard === hazardFilter;

      const severityMatch =
        severityFilter === "ALL" ||
        severity === severityFilter;

      return (
        hazardMatch &&
        severityMatch
      );
    });
  }, [
    hazardRecords,
    hazardFilter,
    severityFilter,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const stats = useMemo(() => {
    const critical = filteredRecords.filter(
      (item) =>
        getSeverity(item) === "CRITICAL"
    ).length;

    const high = filteredRecords.filter(
      (item) =>
        getSeverity(item) === "HIGH"
    ).length;

    const medium = filteredRecords.filter(
      (item) =>
        getSeverity(item) === "MEDIUM"
    ).length;

    const population = filteredRecords.reduce(
      (sum, item) =>
        sum + getPopulation(item),
      0
    );

    const averageRisk =
      filteredRecords.length > 0
        ? filteredRecords.reduce(
            (sum, item) =>
              sum + getRiskScore(item),
            0
          ) / filteredRecords.length
        : 0;

    return {
      total: filteredRecords.length,
      critical,
      high,
      medium,
      population,
      averageRisk,
    };
  }, [filteredRecords]);

  // =========================================================
  // HAZARD DISTRIBUTION
  // =========================================================

  const hazardDistribution = useMemo(() => {
    const map = {};

    filteredRecords.forEach((item) => {
      const hazard = getHazardName(item);

      if (!map[hazard]) {
        map[hazard] = 0;
      }

      map[hazard]++;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1]);
  }, [filteredRecords]);

  // =========================================================
  // TOP THREATS
  // =========================================================

  const topThreats = useMemo(() => {
    return [...filteredRecords]
      .sort(
        (a, b) =>
          getRiskScore(b) -
          getRiskScore(a)
      )
      .slice(0, 8);
  }, [filteredRecords]);

  // =========================================================
  // MAX HAZARD
  // =========================================================

  const dominantHazard =
    hazardDistribution.length > 0
      ? hazardDistribution[0][0]
      : "No active hazard";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100%",
        paddingBottom: "30px",
        color: "#0f172a",
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "22px 26px",
          marginBottom: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow:
            "0 4px 18px rgba(15,23,42,0.05)",
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
              }}
            >
              Hazard Forecast
            </h1>

            <span
              style={{
                background: "#dcfce7",
                color: "#15803d",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "800",
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
              margin:
                "7px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Real-time hazard monitoring,
            exposure analysis and threat
            intelligence across monitored regions.
          </p>
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <div
            style={{
              fontWeight: "800",
              color: "#334155",
            }}
          >
            Data stream
          </div>

          <div>
            {loading
              ? "Updating..."
              : "Connected"}
          </div>

          <div
            style={{
              marginTop: "3px",
            }}
          >
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border:
            "1px solid #e2e8f0",
          borderRadius: "15px",
          padding: "14px",
          marginBottom: "18px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          boxShadow:
            "0 2px 12px rgba(15,23,42,0.04)",
        }}
      >

        <div
          style={{
            fontSize: "12px",
            fontWeight: "800",
            color: "#475569",
            marginRight: "5px",
          }}
        >
          FILTERS
        </div>

        <select
          value={hazardFilter}
          onChange={(e) =>
            setHazardFilter(
              e.target.value
            )
          }
          style={selectStyle}
        >
          {hazardTypes.map(
            (hazard) => (
              <option
                key={hazard}
                value={hazard}
              >
                Hazard: {hazard}
              </option>
            )
          )}
        </select>

        <select
          value={severityFilter}
          onChange={(e) =>
            setSeverityFilter(
              e.target.value
            )
          }
          style={selectStyle}
        >
          <option value="ALL">
            Severity: All
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

        <button
          onClick={() => {
            setHazardFilter("ALL");
            setSeverityFilter("ALL");
          }}
          style={{
            height: "40px",
            padding: "0 16px",
            border:
              "1px solid #cbd5e1",
            borderRadius: "9px",
            background: "#f8fafc",
            fontWeight: "700",
            color: "#475569",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          Auto refresh:{" "}
          <strong>30 sec</strong>
        </div>

      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0,1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >

        <MetricCard
          icon="🌪️"
          title="Active Threats"
          value={stats.total}
          subtitle="Current monitored signals"
          accent="#2563eb"
        />

        <MetricCard
          icon="🚨"
          title="Critical"
          value={stats.critical}
          subtitle="Requires immediate attention"
          accent="#dc2626"
        />

        <MetricCard
          icon="⚠️"
          title="High Severity"
          value={stats.high}
          subtitle="Elevated threat level"
          accent="#ea580c"
        />

        <MetricCard
          icon="👥"
          title="Population Exposure"
          value={formatNumber(
            stats.population
          )}
          subtitle="Associated population"
          accent="#7c3aed"
        />

        <MetricCard
          icon="📡"
          title="Avg Threat Score"
          value={`${Math.round(
            stats.averageRisk
          )}%`}
          subtitle="Current risk intensity"
          accent="#0891b2"
        />

      </div>

      {/* =====================================================
          MAIN ANALYTICS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.15fr 0.85fr",
          gap: "18px",
          marginBottom: "18px",
        }}
      >

        {/* THREAT OVERVIEW */}

        <Panel
          title="Threat Overview"
          subtitle="Distribution of currently monitored hazard activity"
        >

          {hazardDistribution.length ===
          0 ? (
            <EmptyState />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "18px",
              }}
            >
              {hazardDistribution.map(
                ([hazard, count]) => {
                  const max =
                    hazardDistribution[0][1];

                  const percentage =
                    max > 0
                      ? (count / max) *
                        100
                      : 0;

                  return (
                    <div
                      key={hazard}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "7px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "9px",
                            fontSize:
                              "13px",
                            fontWeight:
                              "800",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "19px",
                            }}
                          >
                            {getHazardIcon(
                              hazard
                            )}
                          </span>

                          {hazard}
                        </div>

                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                            fontWeight:
                              "700",
                          }}
                        >
                          {count} signals
                        </span>
                      </div>

                      <div
                        style={{
                          height:
                            "10px",
                          background:
                            "#e2e8f0",
                          borderRadius:
                            "999px",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height:
                              "100%",
                            background:
                              "linear-gradient(90deg,#2563eb,#7c3aed)",
                            borderRadius:
                              "999px",
                            transition:
                              "width .4s ease",
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

        {/* FORECAST INTELLIGENCE */}

        <Panel
          title="Forecast Intelligence"
          subtitle="Current system interpretation"
        >

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: "12px",
            }}
          >

            <ForecastRow
              label="Dominant Hazard"
              value={
                `${getHazardIcon(
                  dominantHazard
                )} ${dominantHazard}`
              }
            />

            <ForecastRow
              label="Current Severity"
              value={
                stats.critical > 0
                  ? "CRITICAL"
                  : stats.high > 0
                  ? "HIGH"
                  : stats.medium > 0
                  ? "MEDIUM"
                  : "LOW"
              }
              highlight
            />

            <ForecastRow
              label="Monitored Signals"
              value={stats.total}
            />

            <ForecastRow
              label="Population Exposure"
              value={formatNumber(
                stats.population
              )}
            />

            <ForecastRow
              label="Average Threat"
              value={`${Math.round(
                stats.averageRisk
              )}%`}
            />

          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius:
                "12px",
              background:
                "#f8fafc",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize:
                  "12px",
                fontWeight:
                  "800",
                marginBottom:
                  "5px",
              }}
            >
              🧠 Monitoring Insight
            </div>

            <p
              style={{
                margin: 0,
                fontSize:
                  "12px",
                lineHeight:
                  "1.5",
                color:
                  "#64748b",
              }}
            >
              {stats.critical >
              0
                ? "Critical hazard activity is currently detected. Emergency response teams should review affected locations."
                : stats.high > 0
                ? "Elevated hazard activity is being observed. Continue close monitoring of high-risk locations."
                : "No critical threat signal is currently visible in the monitored dataset."}
            </p>
          </div>

        </Panel>

      </div>

      {/* =====================================================
          SEVERITY MATRIX
      ====================================================== */}

      <Panel
        title="Severity Matrix"
        subtitle="Current hazard intensity across monitored signals"
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "14px",
          }}
        >

          <SeverityBox
            title="Critical"
            count={stats.critical}
            color="#dc2626"
            background="#fee2e2"
          />

          <SeverityBox
            title="High"
            count={stats.high}
            color="#ea580c"
            background="#ffedd5"
          />

          <SeverityBox
            title="Medium"
            count={stats.medium}
            color="#d97706"
            background="#fef3c7"
          />

          <SeverityBox
            title="Low"
            count={
              Math.max(
                0,
                stats.total -
                  stats.critical -
                  stats.high -
                  stats.medium
              )
            }
            color="#16a34a"
            background="#dcfce7"
          />

        </div>

      </Panel>

      {/* =====================================================
          TOP THREATS TABLE
      ====================================================== */}

      <div
        style={{
          marginTop: "18px",
        }}
      >

        <Panel
          title="Highest Priority Threats"
          subtitle="Locations ranked using the latest available risk information"
        >

          <div
            style={{
              overflowX:
                "auto",
            }}
          >

            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "800px",
              }}
            >

              <thead>
                <tr>
                  <th
                    style={
                      tableHeader
                    }
                  >
                    Rank
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    Location
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    District
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    Hazard
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    Score
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    Severity
                  </th>

                  <th
                    style={
                      tableHeader
                    }
                  >
                    Exposure
                  </th>
                </tr>
              </thead>

              <tbody>

                {topThreats.map(
                  (
                    item,
                    index
                  ) => {
                    const severity =
                      getSeverity(
                        item
                      );

                    const score =
                      getRiskScore(
                        item
                      );

                    return (
                      <tr
                        key={
                          item.id ||
                          item._id ||
                          `${index}-${getVillageName(
                            item
                          )}`
                        }
                        style={{
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >

                        <td
                          style={
                            tableCell
                          }
                        >
                          <span
                            style={{
                              width:
                                "28px",
                              height:
                                "28px",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius:
                                "8px",
                              background:
                                index <
                                3
                                  ? "#fef2f2"
                                  : "#f8fafc",
                              fontWeight:
                                "800",
                            }}
                          >
                            {index +
                              1}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            fontWeight:
                              "800",
                          }}
                        >
                          {getVillageName(
                            item
                          )}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {getDistrict(
                            item
                          )}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          <span
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "6px",
                            }}
                          >
                            {getHazardIcon(
                              getHazardName(
                                item
                              )
                            )}

                            {getHazardName(
                              item
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            fontWeight:
                              "800",
                          }}
                        >
                          {Math.round(
                            score
                          )}
                          %
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          <span
                            style={{
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              fontSize:
                                "10px",
                              fontWeight:
                                "800",
                              color:
                                getSeverityColor(
                                  severity
                                ),
                              background:
                                getSeverityBackground(
                                  severity
                                ),
                            }}
                          >
                            {severity ||
                              "MONITORING"}
                          </span>
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {formatNumber(
                            getPopulation(
                              item
                            )
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

            {topThreats.length ===
              0 && (
              <EmptyState />
            )}

          </div>

        </Panel>

      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          marginTop:
            "15px",
          fontSize:
            "11px",
          color:
            "#94a3b8",
        }}
      >
        <span>
          Monitoring{" "}
          {filteredRecords.length}{" "}
          live records
        </span>

        <span>
          Last sync:{" "}
          {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

    </div>
  );
};

// ============================================================
// COMPONENTS
// ============================================================

const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
  accent,
}) => {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #e2e8f0",
        borderRadius:
          "15px",
        padding:
          "17px",
        boxShadow:
          "0 3px 12px rgba(15,23,42,0.04)",
      }}
    >

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
        }}
      >

        <div>
          <div
            style={{
              fontSize:
                "11px",
              color:
                "#64748b",
              fontWeight:
                "700",
              marginBottom:
                "7px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize:
                "24px",
              fontWeight:
                "850",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width:
              "38px",
            height:
              "38px",
            borderRadius:
              "11px",
            background:
              `${accent}15`,
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize:
              "18px",
          }}
        >
          {icon}
        </div>

      </div>

      <div
        style={{
          marginTop:
            "9px",
          color:
            "#94a3b8",
          fontSize:
            "10px",
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
        background:
          "#ffffff",
        border:
          "1px solid #e2e8f0",
        borderRadius:
          "17px",
        padding:
          "20px",
        boxShadow:
          "0 3px 15px rgba(15,23,42,0.04)",
      }}
    >

      <div
        style={{
          marginBottom:
            "18px",
        }}
      >

        <h2
          style={{
            margin:
              0,
            fontSize:
              "17px",
            fontWeight:
              "800",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin:
              "5px 0 0",
            fontSize:
              "12px",
            color:
              "#94a3b8",
          }}
        >
          {subtitle}
        </p>

      </div>

      {children}

    </div>
  );
};

const ForecastRow = ({
  label,
  value,
  highlight,
}) => {
  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
        padding:
          "11px 0",
        borderBottom:
          "1px solid #f1f5f9",
      }}
    >

      <span
        style={{
          fontSize:
            "12px",
          color:
            "#64748b",
          fontWeight:
            "600",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize:
            "12px",
          color:
            highlight
              ? "#dc2626"
              : "#0f172a",
        }}
      >
        {value}
      </strong>

    </div>
  );
};

const SeverityBox = ({
  title,
  count,
  color,
  background,
}) => {
  return (
    <div
      style={{
        background,
        borderRadius:
          "13px",
        padding:
          "16px",
        border:
          `1px solid ${color}25`,
      }}
    >

      <div
        style={{
          fontSize:
            "11px",
          color,
          fontWeight:
            "800",
          marginBottom:
            "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize:
            "25px",
          fontWeight:
            "850",
          color,
        }}
      >
        {count}
      </div>

      <div
        style={{
          marginTop:
            "3px",
          fontSize:
            "10px",
          color:
            "#64748b",
        }}
      >
        monitored signals
      </div>

    </div>
  );
};

const EmptyState = () => {
  return (
    <div
      style={{
        minHeight:
          "130px",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        color:
          "#94a3b8",
        fontSize:
          "13px",
      }}
    >
      No live hazard data available.
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const selectStyle = {
  height: "40px",
  border:
    "1px solid #cbd5e1",
  borderRadius:
    "9px",
  padding:
    "0 11px",
  background:
    "#ffffff",
  color:
    "#334155",
  fontSize:
    "12px",
  fontWeight:
    "600",
  outline:
    "none",
};

const tableHeader = {
  textAlign:
    "left",
  padding:
    "11px 10px",
  background:
    "#f8fafc",
  color:
    "#64748b",
  fontSize:
    "10px",
  fontWeight:
    "800",
  textTransform:
    "uppercase",
};

const tableCell = {
  padding:
    "13px 10px",
  fontSize:
    "12px",
  color:
    "#334155",
};

export default HazardForecast;