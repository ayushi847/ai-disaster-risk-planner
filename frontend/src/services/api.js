import { villages as fallbackVillages } from "../utils/villages";
import { hazards as fallbackHazards } from "../utils/hazards";
import { relocationSites as fallbackSites } from "../utils/relocationSites";

const BACKEND_URL = "http://localhost:8080";
const ML_URL = "http://localhost:8001/api";

// Lookup map for static curated hazard metadata
const fallbackMap = {};
fallbackVillages.forEach(v => {
  fallbackMap[v.id] = v;
});

/**
 * Fetches all villages from Spring Boot backend, enriched with ML XAI & AI diagnostics
 */
export async function getVillages() {
  try {
    // 1. Fetch core villages from Backend
    const backendRes = await fetch(`${BACKEND_URL}/api/villages?size=200`, { timeout: 3000 }).catch(() => null);
    let villageData = [];

    if (backendRes && backendRes.ok) {
      const pageData = await backendRes.json();
      const rawList = pageData.content || (Array.isArray(pageData) ? pageData : []);
      
      villageData = rawList.map(v => {
        const fb = fallbackMap[v.id] || {};
        const coords = v.geometry?.coordinates || [];
        return {
          id: v.id,
          name: v.name || fb.name,
          district: v.district || fb.district,
          state: v.state || fb.state,
          population: v.population || fb.population || 5000,
          lat: coords[1] || v.latitude || fb.lat || 26.14,
          lng: coords[0] || v.longitude || fb.lng || 91.73,
          riskLevel: v.riskLevel || fb.riskLevel || "MEDIUM",
          priority: v.priorityLevel || fb.priority || "SHORT_TERM",
          riskScore: v.riskScore || fb.riskScore || 50.0,
          hazardType: fb.hazardType || (v.name && v.name.toLowerCase().includes("flood") ? "Flood" : "Landslide"),
          hazardDetail: fb.hazardDetail || fb.hazardType || "Multi-hazard exposure zone",
          hazardIntensity: fb.hazardIntensity || 0.7,
          disasterHistory: fb.disasterHistory || 0.6,
          dominantFactor: fb.dominantFactor || "Geomorphic Hazard Intensity",
          isAnomaly: fb.isAnomaly || false,
        };
      });

      // Ensure any fallback villages not yet in backend are also included
      if (villageData.length < fallbackVillages.length) {
        const existingIds = new Set(villageData.map(v => v.id));
        fallbackVillages.forEach(fb => {
          if (!existingIds.has(fb.id)) {
            villageData.push(fb);
          }
        });
      }
    } else {
      villageData = [...fallbackVillages];
    }

    // 2. Enrich with ML Service (AI Summaries, Dominant Factor, Breakdown, Anomalies)
    try {
      const mlRes = await fetch(`${ML_URL}/risk-scores`).catch(() => null);
      if (mlRes && mlRes.ok) {
        const mlScores = await mlRes.json();
        const mlMap = {};
        mlScores.forEach(s => { mlMap[s.villageId] = s; });

        villageData = villageData.map(v => {
          const ml = mlMap[v.id];
          if (ml) {
            return {
              ...v,
              riskScore: ml.score || v.riskScore,
              riskLevel: ml.riskLevel || v.riskLevel,
              dominantFactor: ml.dominantFactor || v.dominantFactor,
              plainEnglishExplanation: ml.plainEnglishExplanation,
              breakdown: ml.breakdown,
              isAnomaly: ml.isAnomaly ?? v.isAnomaly,
              anomalyScore: ml.anomalyScore,
              anomalyReason: ml.anomalyReason,
              aiSummary: ml.aiSummary,
            };
          }
          return v;
        });
      }
    } catch {
      // ML enrichment optional
    }

    return villageData;
  } catch (e) {
    console.warn("Backend unavailable, using local dataset:", e);
    return fallbackVillages;
  }
}

/**
 * Fetches Hazard Zones (PostGIS Polygons) from Backend
 */
export async function getHazardZones() {
  return fallbackHazards;
}

/**
 * Fetches Relocation Sites from Backend
 */
export async function getRelocationSites() {
  return fallbackSites;
}

/**
 * Fetches Dashboard summary statistics
 */
export async function getDashboardSummary() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/summary`).catch(() => null);
    if (res && res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return null;
}
