import { Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

// Pages
import Dashboard from "../pages/Dashboard";
import MapView from "../pages/MapView";
import RiskAnalysis from "../pages/RiskAnalysis";
import HazardForecast from "../pages/HazardForecast";
import RelocationPlanner from "../pages/RelocationPlanner";
import AIDiagnostics from "../pages/AIDiagnostics";
import Alerts from "../pages/Alerts";
import Reports from "../pages/Reports";
import TaskManagement from "../pages/TaskManagement";


const AppRoutes = () => {
  return (
    <Routes>

      {/* =========================================
          MAIN DASHBOARD LAYOUT
          ========================================= */}

      <Route element={<DashboardLayout />}>

        {/* ================= DASHBOARD ================= */}

        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* ================= ANALYTICS ================= */}

        {/* Map View */}
        <Route
          path="/map-view"
          element={<MapView />}
        />

        {/* Risk Analysis */}
        <Route
          path="/risk-analysis"
          element={<RiskAnalysis />}
        />

        {/* Hazard Forecast */}
        <Route
          path="/hazard-forecast"
          element={<HazardForecast />}
        />

        {/* Relocation Planner */}
        <Route
          path="/relocation-planner"
          element={<RelocationPlanner />}
        />

        {/* AI Diagnostics */}
        <Route
          path="/ai-diagnostics"
          element={<AIDiagnostics />}
        />


        {/* ================= MANAGEMENT ================= */}

        {/* Reports */}
        <Route
          path="/reports"
          element={<Reports />}
        />

        {/* Alerts */}
        <Route
          path="/alerts"
          element={<Alerts />}
        />

        {/* Task Management */}
        <Route
          path="/tasks"
          element={<TaskManagement />}
        />

      </Route>

    </Routes>
  );
};


export default AppRoutes;