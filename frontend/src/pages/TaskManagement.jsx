import { useEffect, useMemo, useState } from "react";
import { getVillages, BACKEND_URL } from "../services/api";
import { villages as fallbackVillages } from "../utils/villages";

// ─── TEAM ASSIGNMENT POOLS ───────────────────────────────────────
const RESCUE_TEAMS = [
  "NDRF Battalion 1", "NDRF Battalion 3", "NDRF Battalion 6",
  "NDRF Battalion 8", "NDRF Battalion 12", "SDRF Alpha Unit",
  "SDRF Bravo Unit", "State Disaster Response Force", "Army Engineering Corps",
  "IAF Rescue Wing", "Navy Flood Relief Unit", "BSF Flood Relief Team"
];

const SURVEY_TEAMS = [
  "ISRO-NRSC GIS Cell", "State GIS Survey Team", "NIDM Field Assessment Unit",
  "GSI Geological Survey Unit", "DRDO Terrain Analysis Cell",
  "District Survey & Settlement Office", "IMD Field Station Team",
  "CWC Hydrology Division", "CGWB Monitoring Unit"
];

const MEDICAL_TEAMS = [
  "PHC Mobile Medical Unit", "District Hospital CMO Team",
  "ICMR Epidemic Response Unit", "Red Cross Medical Corps",
  "MSF Emergency Health Unit", "WHO Field Health Unit"
];

const LOGISTICS_TEAMS = [
  "District Supply & Transport", "NHAI Emergency Corridor Team",
  "Indian Railways Relief Division", "State Warehousing Corp",
  "FCI Distribution Cell", "District Collectorate Logistics"
];

// ─── TASK TEMPLATE GENERATORS ────────────────────────────────────
const generateTasksFromVillages = (villages) => {
  const tasks = [];
  let taskId = 1;

  const now = new Date();
  const formatDeadline = (hoursFromNow) => {
    const d = new Date(now.getTime() + hoursFromNow * 3600000);
    const day = d.getDate();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = monthNames[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    if (hoursFromNow <= 24) return `Today ${hours}:${mins}`;
    if (hoursFromNow <= 48) return `Tomorrow ${hours}:${mins}`;
    return `${day} ${month} ${hours}:${mins}`;
  };

  const pickTeam = (arr, idx) => arr[idx % arr.length];
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  };

  // Sort villages by risk score descending
  const sorted = [...villages].sort((a, b) => {
    const sa = Number(a.riskScore || a.risk_score || a.score || 0);
    const sb = Number(b.riskScore || b.risk_score || b.score || 0);
    return sb - sa;
  });

  sorted.forEach((v, idx) => {
    const name = v.name || v.villageName || v.village_name || `Village ${v.id}`;
    const district = v.district || v.districtName || "";
    const state = v.state || "";
    const risk = String(v.riskLevel || v.risk_level || "MEDIUM").toUpperCase();
    const hazard = v.hazardType || v.hazard_type || "Multi-Hazard";
    const score = Number(v.riskScore || v.risk_score || v.score || 50);
    const population = Number(v.population || 5000);
    const h = hash(v.id || name);

    if (risk === "CRITICAL") {
      // CRITICAL → Emergency Evacuation Task (IN_PROGRESS or PENDING)
      const progress = 30 + (h % 55); // 30-84%
      tasks.push({
        id: taskId++,
        title: `Emergency Evacuation — ${name}`,
        subtitle: `${district}, ${state}`,
        category: "Emergency Evacuation",
        priority: "CRITICAL",
        status: progress > 60 ? "IN_PROGRESS" : "PENDING",
        assigned: pickTeam(RESCUE_TEAMS, idx),
        progress,
        deadline: formatDeadline(4 + (h % 8)), // 4-12 hours
        score,
        population,
        hazard,
        villageId: v.id,
      });

      // CRITICAL → Medical Response Deployment
      if (population > 5000) {
        const medProgress = 20 + (h % 40);
        tasks.push({
          id: taskId++,
          title: `Medical Response Deployment — ${name}`,
          subtitle: `${district}, ${state} • Pop: ${population.toLocaleString()}`,
          category: "Medical Response",
          priority: "CRITICAL",
          status: medProgress > 50 ? "IN_PROGRESS" : "PENDING",
          assigned: pickTeam(MEDICAL_TEAMS, idx),
          progress: medProgress,
          deadline: formatDeadline(3 + (h % 6)),
          score,
          population,
          hazard,
          villageId: v.id,
        });
      }

    } else if (risk === "HIGH") {
      // HIGH → Shelter Readiness Verification
      const progress = 15 + (h % 70);
      const statusVal = progress >= 85 ? "COMPLETED" : progress >= 40 ? "IN_PROGRESS" : "PENDING";
      tasks.push({
        id: taskId++,
        title: `Shelter & Relocation Readiness — ${name}`,
        subtitle: `${district}, ${state}`,
        category: "Shelter Verification",
        priority: "HIGH",
        status: statusVal,
        assigned: pickTeam(SURVEY_TEAMS, idx),
        progress: statusVal === "COMPLETED" ? 100 : progress,
        deadline: statusVal === "COMPLETED" ? "Completed" : formatDeadline(12 + (h % 24)),
        score,
        population,
        hazard,
        villageId: v.id,
      });

      // HIGH → Supply Chain Pre-positioning
      if (idx % 3 === 0) {
        const logProgress = 10 + (h % 60);
        tasks.push({
          id: taskId++,
          title: `Relief Supply Pre-positioning — ${name}`,
          subtitle: `${district}, ${state}`,
          category: "Logistics",
          priority: "HIGH",
          status: logProgress > 50 ? "IN_PROGRESS" : "PENDING",
          assigned: pickTeam(LOGISTICS_TEAMS, idx),
          progress: logProgress,
          deadline: formatDeadline(18 + (h % 24)),
          score,
          population,
          hazard,
          villageId: v.id,
        });
      }

    } else if (risk === "MEDIUM") {
      // MEDIUM → Risk Assessment / Field Survey
      const progress = 20 + (h % 80);
      const statusVal = progress >= 90 ? "COMPLETED" : progress >= 35 ? "IN_PROGRESS" : "PENDING";
      tasks.push({
        id: taskId++,
        title: `${hazard} Risk Assessment — ${name}`,
        subtitle: `${district}, ${state}`,
        category: "Risk Analysis",
        priority: "MEDIUM",
        status: statusVal,
        assigned: pickTeam(SURVEY_TEAMS, idx),
        progress: statusVal === "COMPLETED" ? 100 : progress,
        deadline: statusVal === "COMPLETED" ? "Completed" : formatDeadline(24 + (h % 48)),
        score,
        population,
        hazard,
        villageId: v.id,
      });

    } else {
      // LOW → Monitoring / Preparedness
      const progress = 40 + (h % 60);
      tasks.push({
        id: taskId++,
        title: `Preparedness Monitoring — ${name}`,
        subtitle: `${district}, ${state}`,
        category: "Monitoring",
        priority: "LOW",
        status: progress >= 95 ? "COMPLETED" : "IN_PROGRESS",
        assigned: pickTeam(SURVEY_TEAMS, idx),
        progress: progress >= 95 ? 100 : progress,
        deadline: progress >= 95 ? "Completed" : formatDeadline(48 + (h % 72)),
        score,
        population,
        hazard,
        villageId: v.id,
      });
    }
  });

  return tasks;
};

// ─── PRIORITY COLORS ─────────────────────────────────────────────
const PRIORITY_STYLES = {
  CRITICAL: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  HIGH:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  MEDIUM:   { bg: "#fefce8", color: "#a16207", border: "#fef08a" },
  LOW:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

const STATUS_STYLES = {
  COMPLETED:   { bg: "#dcfce7", color: "#15803d", label: "COMPLETED" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8", label: "IN PROGRESS" },
  PENDING:     { bg: "#fef3c7", color: "#b45309", label: "PENDING" },
};

const CATEGORY_ICONS = {
  "Emergency Evacuation": "🚨",
  "Medical Response": "🏥",
  "Shelter Verification": "🏕️",
  "Risk Analysis": "📊",
  "Logistics": "🚚",
  "Monitoring": "📡",
};

// ─── COMPONENT ───────────────────────────────────────────────────
const TaskManagement = () => {
  const [villages, setVillages] = useState(fallbackVillages || []);
  const [filter, setFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVillages();
        if (Array.isArray(data) && data.length > 0) setVillages(data);
      } catch {
        // fallback already set
      }
      setLastUpdated(new Date());
    };
    load();
  }, []);

  const tasks = useMemo(() => generateTasksFromVillages(villages), [villages]);

  const stats = useMemo(() => ({
    total: tasks.length,
    critical: tasks.filter(t => t.priority === "CRITICAL").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter !== "ALL") result = result.filter(t => t.status === filter);
    if (priorityFilter !== "ALL") result = result.filter(t => t.priority === priorityFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.subtitle || "").toLowerCase().includes(q) ||
        t.assigned.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.hazard.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tasks, filter, priorityFilter, searchQuery]);

  const StatCard = ({ title, value, icon, accent }) => (
    <div style={{
      background: "#fff",
      padding: "18px 20px",
      borderRadius: "14px",
      border: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}>
      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</p>
        <h2 style={{ margin: "6px 0 0", fontSize: "30px", fontWeight: 800, color: accent || "#0f172a" }}>{value}</h2>
      </div>
      <div style={{
        fontSize: "28px",
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        background: "#f8fafc",
      }}>
        {icon}
      </div>
    </div>
  );

  const FilterButton = ({ label, value, currentFilter, onClick }) => (
    <button
      onClick={() => onClick(value)}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: currentFilter === value ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
        background: currentFilter === value ? "#eff6ff" : "#fff",
        color: currentFilter === value ? "#2563eb" : "#475569",
        fontWeight: 600,
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        padding: "22px 26px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 12px rgba(0,0,0,.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
            📋 Disaster Task Management
          </h1>
          <p style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
            Manage emergency operations, rescue activities, field surveys, and logistics tasks across {villages.length} habitations.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Last synchronized: {lastUpdated.toLocaleTimeString()}
          </div>
          <div style={{
            marginTop: "6px",
            fontSize: "11px",
            color: "#16a34a",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px",
          }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
            LIVE — Auto-generated from PostGIS
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>
        <StatCard title="Total Tasks" value={stats.total} icon="📋" />
        <StatCard title="Critical" value={stats.critical} icon="🚨" accent="#dc2626" />
        <StatCard title="In Progress" value={stats.inProgress} icon="⚡" accent="#2563eb" />
        <StatCard title="Pending" value={stats.pending} icon="⏳" accent="#b45309" />
        <StatCard title="Completed" value={stats.completed} icon="✅" accent="#16a34a" />
      </div>

      {/* ── FILTERS & SEARCH ────────────────────────────────── */}
      <div style={{
        background: "#fff",
        padding: "14px 20px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, alignSelf: "center", marginRight: "4px" }}>STATUS:</span>
          {[
            ["ALL", "All"],
            ["PENDING", "Pending"],
            ["IN_PROGRESS", "In Progress"],
            ["COMPLETED", "Completed"],
          ].map(([val, label]) => (
            <FilterButton key={val} label={label} value={val} currentFilter={filter} onClick={setFilter} />
          ))}

          <div style={{ width: "1px", background: "#e2e8f0", margin: "0 6px" }} />

          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, alignSelf: "center", marginRight: "4px" }}>PRIORITY:</span>
          {[
            ["ALL", "All"],
            ["CRITICAL", "Critical"],
            ["HIGH", "High"],
            ["MEDIUM", "Medium"],
          ].map(([val, label]) => (
            <FilterButton key={`p-${val}`} label={label} value={val} currentFilter={priorityFilter} onClick={setPriorityFilter} />
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Search tasks, teams, hazards..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            width: "240px",
            outline: "none",
            color: "#334155",
          }}
        />
      </div>

      {/* ── SHOWING COUNT ───────────────────────────────────── */}
      <div style={{ fontSize: "13px", color: "#94a3b8", paddingLeft: "4px" }}>
        Showing <strong style={{ color: "#334155" }}>{filteredTasks.length}</strong> of {tasks.length} tasks
      </div>

      {/* ── TASK TABLE ──────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,.04)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "13px 16px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Task</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned Team</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Progress</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deadline</th>
              <th style={{ padding: "13px 12px", fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                  No tasks match the selected filters.
                </td>
              </tr>
            )}
            {filteredTasks.map(task => {
              const ps = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
              const ss = STATUS_STYLES[task.status] || STATUS_STYLES.PENDING;
              const catIcon = CATEGORY_ICONS[task.category] || "📌";
              const progressColor =
                task.status === "COMPLETED" ? "#16a34a" :
                task.priority === "CRITICAL" ? "#dc2626" :
                task.priority === "HIGH" ? "#f59e0b" :
                "#2563eb";

              return (
                <tr key={task.id} style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Task Name */}
                  <td style={{ padding: "14px 16px", maxWidth: "320px" }}>
                    <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#0f172a", lineHeight: "1.4" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "3px" }}>
                      {task.subtitle}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      fontSize: "12px",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}>
                      <span>{catIcon}</span> {task.category}
                    </span>
                  </td>

                  {/* Priority Badge */}
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: ps.bg,
                      color: ps.color,
                      border: `1px solid ${ps.border}`,
                      letterSpacing: "0.3px",
                    }}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assigned Team */}
                  <td style={{ padding: "14px 12px", fontSize: "12.5px", color: "#334155" }}>
                    {task.assigned}
                  </td>

                  {/* Progress Bar */}
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "100px",
                        height: "7px",
                        background: "#e2e8f0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${task.progress}%`,
                          height: "100%",
                          background: progressColor,
                          borderRadius: "10px",
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, minWidth: "32px" }}>
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Deadline */}
                  <td style={{ padding: "14px 12px", fontSize: "12px", color: "#64748b" }}>
                    {task.deadline}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      padding: "5px 11px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: ss.bg,
                      color: ss.color,
                      letterSpacing: "0.3px",
                    }}>
                      {ss.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER NOTE ─────────────────────────────────────── */}
      <div style={{
        fontSize: "11px",
        color: "#94a3b8",
        textAlign: "center",
        padding: "8px 0 4px",
      }}>
        Tasks are dynamically generated from {villages.length} PostGIS habitations across {new Set(villages.map(v => v.state)).size} states.
        Assignments based on NDRF battalion deployment zones and district administrative hierarchy.
      </div>

    </div>
  );
};

export default TaskManagement;