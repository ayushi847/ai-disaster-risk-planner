


import { useEffect, useMemo, useState } from "react";
import { getVillages, getHazardZones } from "../services/api";

const Reports = () => {
  const [villages, setVillages] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reportType, setReportType] = useState("overview");

  // -----------------------------
  // NORMALIZATION HELPERS
  // -----------------------------

  const getRisk = (v) =>
    String(
      v?.riskLevel ??
        v?.risk_level ??
        v?.risk ??
        v?.riskCategory ??
        "LOW"
    ).toUpperCase();

  const getPriority = (v) =>
    String(
      v?.priority ??
        v?.relocationPriority ??
        v?.relocation_priority ??
        "NORMAL"
    ).toUpperCase();

  const getHazard = (item) =>
    String(
      item?.hazardType ??
        item?.hazard_type ??
        item?.hazard ??
        item?.hazardName ??
        item?.type ??
        "UNKNOWN"
    );

  const getPopulation = (v) =>
    Number(
      v?.population ??
        v?.populationAtRisk ??
        v?.population_at_risk ??
        0
    ) || 0;

  const getScore = (v) =>
    Number(
      v?.riskScore ??
        v?.risk_score ??
        v?.score ??
        v?.riskPercentage ??
        0
    ) || 0;

  const getName = (v) =>
    v?.name ??
    v?.villageName ??
    v?.village_name ??
    v?.village ??
    "Unknown Village";

  const getDistrict = (v) =>
    v?.district ??
    v?.districtName ??
    v?.district_name ??
    "Unknown District";

  // -----------------------------
  // LOAD LIVE DATA
  // -----------------------------

  const loadReports = async () => {
    try {
      setLoading(true);

      const [villageData, hazardData] = await Promise.all([
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
      console.error("Reports loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();

    const interval = setInterval(loadReports, 30000);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // REPORT STATISTICS
  // -----------------------------

  const stats = useMemo(() => {
    const critical = villages.filter(
      (v) => getRisk(v) === "CRITICAL"
    );

    const high = villages.filter(
      (v) => getRisk(v) === "HIGH"
    );

    const medium = villages.filter(
      (v) => getRisk(v) === "MEDIUM"
    );

    const immediate = villages.filter(
      (v) => getPriority(v) === "IMMEDIATE"
    );

    const highPriority = villages.filter(
      (v) =>
        getPriority(v) === "HIGH" ||
        getPriority(v) === "URGENT"
    );

    const populationAtRisk = villages.reduce(
      (sum, v) => sum + getPopulation(v),
      0
    );

    const avgScore =
      villages.length > 0
        ? villages.reduce((sum, v) => sum + getScore(v), 0) /
          villages.length
        : 0;

    return {
      total: villages.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      immediate: immediate.length,
      highPriority: highPriority.length,
      populationAtRisk,
      avgScore,
    };
  }, [villages]);

  // -----------------------------
  // HAZARD DISTRIBUTION
  // -----------------------------

  const hazardDistribution = useMemo(() => {
    const map = {};

    hazards.forEach((hazard) => {
      const name = getHazard(hazard);

      map[name] = (map[name] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [hazards]);

  // -----------------------------
  // DISTRICT DISTRIBUTION
  // -----------------------------

  const districtDistribution = useMemo(() => {
    const map = {};

    villages.forEach((village) => {
      const district = getDistrict(village);

      map[district] = (map[district] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [villages]);

  // -----------------------------
  // TOP HIGH-RISK VILLAGES
  // -----------------------------

  const highestRiskVillages = useMemo(() => {
    return [...villages]
      .sort((a, b) => getScore(b) - getScore(a))
      .slice(0, 8);
  }, [villages]);

  const riskPercentage = (count) =>
    stats.total > 0
      ? Math.round((count / stats.total) * 100)
      : 0;

  const formatPopulation = (number) => {
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }

    return number.toLocaleString();
  };

  const getRiskBadge = (risk) => {
    const value = getRisk(risk);

    const styles = {
      CRITICAL: {
        background: "#fee2e2",
        color: "#b91c1c",
      },
      HIGH: {
        background: "#ffedd5",
        color: "#c2410c",
      },
      MEDIUM: {
        background: "#fef3c7",
        color: "#a16207",
      },
      LOW: {
        background: "#dcfce7",
        color: "#15803d",
      },
    };

    return styles[value] || {
      background: "#f1f5f9",
      color: "#475569",
    };
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div
      style={{
        minHeight: "100%",
        paddingBottom: "30px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "22px 26px",
          marginBottom: "18px",
          boxShadow: "0 3px 12px rgba(15,23,42,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
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
            <span style={{ fontSize: "28px" }}>📊</span>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              Disaster Intelligence Reports
            </h1>
          </div>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Real-time disaster risk, hazard exposure and
            relocation intelligence.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 13px",
              background: "#ecfdf5",
              color: "#047857",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />

            LIVE DATA
          </div>

          <button
            onClick={loadReports}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              padding: "9px 14px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* REPORT SELECTOR */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "15px",
          padding: "8px",
          marginBottom: "18px",
          display: "flex",
          gap: "7px",
          width: "fit-content",
          maxWidth: "100%",
          flexWrap: "wrap",
        }}
      >
        {[
          ["overview", "Overview"],
          ["risk", "Risk Report"],
          ["hazard", "Hazard Report"],
          ["relocation", "Relocation Report"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setReportType(value)}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "9px 16px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "13px",
              background:
                reportType === value
                  ? "#0f172a"
                  : "transparent",
              color:
                reportType === value
                  ? "#ffffff"
                  : "#64748b",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <MetricCard
          icon="🏘️"
          title="Villages Monitored"
          value={stats.total}
          subtitle="Live database"
        />

        <MetricCard
          icon="🔴"
          title="Critical Villages"
          value={stats.critical}
          subtitle={`${riskPercentage(stats.critical)}% of monitored`}
        />

        <MetricCard
          icon="🟠"
          title="High Risk"
          value={stats.high}
          subtitle={`${riskPercentage(stats.high)}% of monitored`}
        />

        <MetricCard
          icon="👥"
          title="Population at Risk"
          value={formatPopulation(stats.populationAtRisk)}
          subtitle="Estimated exposure"
        />

        <MetricCard
          icon="🚨"
          title="Immediate Relocation"
          value={stats.immediate}
          subtitle="Priority cases"
        />

        <MetricCard
          icon="🎯"
          title="Avg Risk Score"
          value={stats.avgScore.toFixed(1)}
          subtitle="Across villages"
        />
      </div>

      {/* CONTENT */}

      {(reportType === "overview" ||
        reportType === "risk") && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.4fr) minmax(280px,1fr)",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          {/* RISK DISTRIBUTION */}

          <Panel
            title="Risk Distribution"
            subtitle="Village-level risk classification"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(180px,0.8fr) minmax(240px,1.2fr)",
                gap: "30px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  background: `conic-gradient(
                    #dc2626 0% ${riskPercentage(
                      stats.critical
                    )}%,
                    #f97316 ${riskPercentage(
                      stats.critical
                    )}% ${riskPercentage(
                      stats.critical + stats.high
                    )}%,
                    #eab308 ${riskPercentage(
                      stats.critical + stats.high
                    )}% ${riskPercentage(
                      stats.critical +
                        stats.high +
                        stats.medium
                    )}%,
                    #22c55e ${riskPercentage(
                      stats.critical +
                        stats.high +
                        stats.medium
                    )}% 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "auto",
                }}
              >
                <div
                  style={{
                    width: "112px",
                    height: "112px",
                    background: "#ffffff",
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "25px",
                      color: "#0f172a",
                    }}
                  >
                    {stats.total}
                  </strong>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    Villages
                  </span>
                </div>
              </div>

              <div>
                <RiskRow
                  label="Critical"
                  value={stats.critical}
                  percentage={riskPercentage(
                    stats.critical
                  )}
                />

                <RiskRow
                  label="High"
                  value={stats.high}
                  percentage={riskPercentage(
                    stats.high
                  )}
                />

                <RiskRow
                  label="Medium"
                  value={stats.medium}
                  percentage={riskPercentage(
                    stats.medium
                  )}
                />

                <RiskRow
                  label="Low"
                  value={
                    stats.total -
                    stats.critical -
                    stats.high -
                    stats.medium
                  }
                  percentage={riskPercentage(
                    stats.total -
                      stats.critical -
                      stats.high -
                      stats.medium
                  )}
                />
              </div>
            </div>
          </Panel>

          {/* DISTRICTS */}

          <Panel
            title="District Coverage"
            subtitle="Highest monitored districts"
          >
            {districtDistribution.length === 0 ? (
              <EmptyState text="No district data available" />
            ) : (
              districtDistribution.map(
                ([district, count]) => (
                  <div
                    key={district}
                    style={{
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <span
                        style={{
                          color: "#334155",
                          fontWeight: "600",
                        }}
                      >
                        {district}
                      </span>

                      <strong>{count}</strong>
                    </div>

                    <div
                      style={{
                        height: "7px",
                        background: "#e2e8f0",
                        borderRadius: "20px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            (count /
                              Math.max(
                                districtDistribution[0][1],
                                1
                              )) *
                            100
                          }%`,
                          height: "100%",
                          background: "#2563eb",
                          borderRadius: "20px",
                        }}
                      />
                    </div>
                  </div>
                )
              )
            )}
          </Panel>
        </div>
      )}

      {/* HAZARD REPORT */}

      {(reportType === "overview" ||
        reportType === "hazard") && (
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <Panel
            title="Hazard Intelligence"
            subtitle="Active hazard-zone distribution"
          >
            {hazardDistribution.length === 0 ? (
              <EmptyState text="No hazard data available" />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "14px",
                }}
              >
                {hazardDistribution.map(
                  ([hazard, count]) => (
                    <div
                      key={hazard}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "13px",
                        padding: "16px",
                        background: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#334155",
                          }}
                        >
                          ⚠️ {hazard}
                        </span>

                        <strong
                          style={{
                            fontSize: "20px",
                            color: "#0f172a",
                          }}
                        >
                          {count}
                        </strong>
                      </div>

                      <div
                        style={{
                          marginTop: "12px",
                          height: "7px",
                          background: "#e2e8f0",
                          borderRadius: "20px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${
                              (count /
                                Math.max(
                                  hazardDistribution[0][1],
                                  1
                                )) *
                              100
                            }%`,
                            background: "#f97316",
                            borderRadius: "20px",
                          }}
                        />
                      </div>

                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        Active hazard zones
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* RELOCATION REPORT */}

      {(reportType === "overview" ||
        reportType === "relocation") && (
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <Panel
            title="Relocation Intelligence"
            subtitle="Villages requiring intervention"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(200px,1fr))",
                gap: "14px",
              }}
            >
              <RelocationBox
                icon="🚨"
                title="Immediate"
                value={stats.immediate}
                description="Immediate relocation required"
              />

              <RelocationBox
                icon="⚠️"
                title="High Priority"
                value={stats.highPriority}
                description="Priority intervention cases"
              />

              <RelocationBox
                icon="👥"
                title="Population Exposure"
                value={formatPopulation(
                  stats.populationAtRisk
                )}
                description="Population under risk"
              />
            </div>
          </Panel>
        </div>
      )}

      {/* TOP RISK TABLE */}

      {(reportType === "overview" ||
        reportType === "risk" ||
        reportType === "relocation") && (
        <Panel
          title="Highest Risk Villages"
          subtitle="Priority cases requiring monitoring"
        >
          {loading ? (
            <EmptyState text="Loading live report data..." />
          ) : highestRiskVillages.length === 0 ? (
            <EmptyState text="No village data available" />
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "720px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    {[
                      "Village",
                      "District",
                      "Risk",
                      "Score",
                      "Priority",
                      "Population",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          fontSize: "12px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom:
                            "1px solid #e2e8f0",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {highestRiskVillages.map(
                    (village, index) => {
                      const badge =
                        getRiskBadge(village);

                      return (
                        <tr key={village.id ?? index}>
                          <td
                            style={{
                              padding: "14px",
                              fontWeight: "700",
                              color: "#0f172a",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {getName(village)}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#64748b",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {getDistrict(village)}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                ...badge,
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  "7px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "800",
                              }}
                            >
                              {getRisk(village)}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              fontWeight: "800",
                              color: "#0f172a",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {getScore(village).toFixed(
                              1
                            )}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#475569",
                              fontWeight: "700",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {getPriority(village)}
                          </td>

                          <td
                            style={{
                              padding: "14px",
                              color: "#475569",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {getPopulation(
                              village
                            ).toLocaleString()}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* FOOTER */}

      <div
        style={{
          marginTop: "18px",
          padding: "13px 16px",
          borderRadius: "12px",
          background: "#f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        <span>
          🔄 Auto-refresh interval: 30 seconds
        </span>

        <span>
          Last updated:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString()
            : "Loading..."}
        </span>
      </div>
    </div>
  );
};

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
}) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "15px",
      padding: "17px",
      boxShadow:
        "0 2px 8px rgba(15,23,42,0.04)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "23px",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#22c55e",
        }}
      />
    </div>

    <div
      style={{
        marginTop: "14px",
        fontSize: "27px",
        fontWeight: "800",
        color: "#0f172a",
      }}
    >
      {value}
    </div>

    <div
      style={{
        marginTop: "3px",
        fontSize: "13px",
        color: "#475569",
        fontWeight: "700",
      }}
    >
      {title}
    </div>

    <div
      style={{
        marginTop: "5px",
        fontSize: "11px",
        color: "#94a3b8",
      }}
    >
      {subtitle}
    </div>
  </div>
);

const Panel = ({
  title,
  subtitle,
  children,
}) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "20px",
      boxShadow:
        "0 2px 10px rgba(15,23,42,0.04)",
    }}
  >
    <div style={{ marginBottom: "20px" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "17px",
          fontWeight: "800",
          color: "#0f172a",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        {subtitle}
      </p>
    </div>

    {children}
  </div>
);

const RiskRow = ({
  label,
  value,
  percentage,
}) => (
  <div
    style={{
      marginBottom: "15px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          color: "#475569",
          fontWeight: "600",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: "13px",
          color: "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>

    <div
      style={{
        height: "7px",
        background: "#e2e8f0",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: "100%",
          background:
            label === "Critical"
              ? "#dc2626"
              : label === "High"
              ? "#f97316"
              : label === "Medium"
              ? "#eab308"
              : "#22c55e",
          borderRadius: "20px",
        }}
      />
    </div>
  </div>
);

const RelocationBox = ({
  icon,
  title,
  value,
  description,
}) => (
  <div
    style={{
      padding: "18px",
      borderRadius: "13px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
    }}
  >
    <div
      style={{
        fontSize: "25px",
        marginBottom: "8px",
      }}
    >
      {icon}
    </div>

    <div
      style={{
        fontSize: "25px",
        fontWeight: "800",
        color: "#0f172a",
      }}
    >
      {value}
    </div>

    <div
      style={{
        fontSize: "14px",
        fontWeight: "800",
        color: "#334155",
        marginTop: "3px",
      }}
    >
      {title}
    </div>

    <div
      style={{
        fontSize: "11px",
        color: "#94a3b8",
        marginTop: "5px",
      }}
    >
      {description}
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div
    style={{
      padding: "35px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: "13px",
    }}
  >
    {text}
  </div>
);

export default Reports;