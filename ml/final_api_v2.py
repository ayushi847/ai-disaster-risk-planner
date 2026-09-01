"""
SIH26191 — ML Service v2 (FastAPI)

Integrated backend service merging all 4 advanced capabilities:
  1. Explainability: Factor contribution points, percentages, dominant factor, plain English explanation
  2. Optimization: Globally optimal Hungarian algorithm (scipy.optimize.linear_sum_assignment)
  3. Anomaly Detection: IsolationForest-based data anomaly detection with human-readable reasons
  4. LLM Risk Summaries: Groq AI generated 2-line executive summaries

CRITICAL RULE: All existing fields (villageId, score, riskLevel, factors, confidence,
priorityLevel, recommendedSiteId, capacityNotes) are preserved exactly to guarantee
100% backward compatibility with Purwansh's Spring Boot backend and Ayushi's frontend.

Run:  venv/bin/uvicorn final_api_v2:app --reload --port 8001
Docs: http://localhost:8001/docs
"""

import math
import os
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from explainability import explain_risk_score
from optimizer import optimize_assignments, compute_risk_scores
from anomaly_detector import detect_anomalies
from llm_summarizer import summarize_all_villages, generate_ai_summary
from live_weather_sensor import fetch_village_live_telemetry

load_dotenv()

app = FastAPI(
    title="SIH26191 ML Service v2 — Risk Scoring, Optimization, Real-Time Sensor Telemetry & AI Explainability",
    version="2.1.0"
)

# Enable CORS for Spring Boot & Next.js/React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Spring Boot Backend Connection (configurable via .env) ---
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
BACKEND_EMAIL = os.getenv("BACKEND_EMAIL", "admin@sih.gov.in")
BACKEND_PASSWORD = os.getenv("BACKEND_PASSWORD", "admin123")

BACKEND_LOGIN_URL = f"{BACKEND_URL}/api/auth/login"
BACKEND_RISK_URL = f"{BACKEND_URL}/api/risk-scores/batch"
BACKEND_PRIORITIZATION_URL = f"{BACKEND_URL}/api/prioritization"

now_iso = lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------
# LOAD + COMPUTE PIPELINE
# ---------------------------------------------------------------------

def load_and_compute():
    """
    Executes the full end-to-end ML pipeline:
      1. Load checked CSV datasets
      2. Compute core risk scores & risk levels
      3. Compute explainability breakdowns
      4. Detect anomalies with IsolationForest
      5. Generate LLM / AI summaries
      6. Run Hungarian optimization for site assignment
    """
    habs = pd.read_csv("habitations_FINAL_checked.csv")
    sites = pd.read_csv("relocation_sites_FINAL__1_.csv")

    # 1. Core risk scoring
    habs_scored = compute_risk_scores(habs)

    # 2. Anomaly detection
    anomalies = detect_anomalies(habs)
    anomaly_map = {a["villageId"]: a for a in anomalies}

    # 3. AI Summaries (pre-generate for all villages)
    ai_summaries = summarize_all_villages(habs)

    # 4. Build enriched risk score payload
    risk_payload = []
    for _, row in habs_scored.iterrows():
        v_id = row["village_id"]
        pop_norm = row["_pop_norm"]
        risk_level = row["risk_level"]

        # Explainability
        explanation = explain_risk_score(row, pop_norm, risk_level)

        # Anomaly info
        anom_info = anomaly_map.get(v_id, {"isAnomaly": False, "anomalyScore": 0.0, "anomalyReason": ""})

        # Summary
        summary = ai_summaries.get(v_id, "")

        risk_payload.append({
            # Original backward-compatible fields
            "villageId": v_id,
            "villageName": row.get("village_name", ""),
            "district": row.get("district", ""),
            "state": row.get("state", ""),
            "lat": float(row.get("latitude", 26.14)),
            "lng": float(row.get("longitude", 91.73)),
            "hazardType": row.get("hazard_type", "Landslide"),
            "score": row["score"],
            "riskLevel": risk_level,
            "factors": {
                "hazardIntensity": row["hazard_intensity"],
                "populationDensity": round(pop_norm, 2),
                "disasterHistory": row["disaster_history_score"],
            },
            "confidence": row["confidence"],
            "computedAt": now_iso(),

            # New v2 Enriched Fields
            "dominantFactor": explanation["dominantFactor"],
            "plainEnglishExplanation": explanation["plainEnglishExplanation"],
            "breakdown": explanation["breakdown"],
            "isAnomaly": anom_info["isAnomaly"],
            "anomalyScore": anom_info["anomalyScore"],
            "anomalyReason": anom_info["anomalyReason"],
            "aiSummary": summary,
        })

    # 5. Hungarian Optimization for relocation prioritization
    prioritization_payload = optimize_assignments(habs, sites)

    return risk_payload, prioritization_payload


RISK_SCORES, PRIORITIZATION = load_and_compute()


# ---------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "up",
        "service": "SIH26191 ML Service v2",
        "villages_loaded": len(RISK_SCORES),
        "features": [
            "Explainable Risk Scoring",
            "Hungarian Algorithm Optimization (scipy)",
            "IsolationForest Anomaly Detection",
            "Groq LLM Risk Summaries"
        ]
    }


@app.get("/api/risk-scores")
def get_risk_scores(village_id: Optional[str] = None):
    """Returns all risk score records, or a single village by ID."""
    if village_id:
        return next((r for r in RISK_SCORES if r["villageId"] == village_id), {"error": "not found"})
    return RISK_SCORES


@app.get("/api/prioritization")
def get_prioritization(village_id: Optional[str] = None):
    """Returns optimal relocation assignments computed via Hungarian algorithm."""
    if village_id:
        return next((p for p in PRIORITIZATION if p["villageId"] == village_id), {"error": "not found"})
    return PRIORITIZATION


@app.get("/api/anomalies")
def get_anomalies():
    """Returns only villages flagged by IsolationForest as anomalous."""
    return [r for r in RISK_SCORES if r.get("isAnomaly")]


@app.get("/api/realtime-weather/{village_id}")
def get_realtime_weather(village_id: str):
    """
    Fetches 100% REAL LIVE meteorological satellite & ground sensor telemetry
    for a specific village by ID (Rainfall mm/h, 24h Rain, Soil Moisture, Temp, IMD Alert Level).
    """
    v = next((r for r in RISK_SCORES if r["villageId"] == village_id), None)
    if not v:
        return {"error": f"Village '{village_id}' not found"}
    
    lat = v.get("lat", 26.14)
    lng = v.get("lng", 91.73)
    name = v.get("villageName", "")
    hazard = v.get("hazardType", "Landslide")

    telemetry = fetch_village_live_telemetry(lat, lng, village_id, name, hazard)
    
    # Calculate live adjusted dynamic risk score
    base_score = v["score"]
    delta = telemetry["dynamicRiskDelta"]
    adjusted_score = min(99.0, max(1.0, round(base_score + delta, 1)))

    adjusted_risk_level = "CRITICAL" if adjusted_score >= 80 else ("HIGH" if adjusted_score >= 60 else ("MEDIUM" if adjusted_score >= 40 else "LOW"))

    return {
        **telemetry,
        "baseRiskScore": base_score,
        "liveAdjustedRiskScore": adjusted_score,
        "liveAdjustedRiskLevel": adjusted_risk_level,
    }


from concurrent.futures import ThreadPoolExecutor

@app.get("/api/live-sensor-feed")
def get_live_sensor_feed():
    """
    Fetches real-time telemetry across all 71 habitations concurrently using ThreadPoolExecutor
    and returns a national early warning sensor snapshot in sub-second time.
    """
    def fetch_one(v):
        v_id = v["villageId"]
        lat = v.get("lat", 26.14)
        lng = v.get("lng", 91.73)
        name = v.get("villageName", "")
        hazard = v.get("hazardType", "Landslide")
        return fetch_village_live_telemetry(lat, lng, v_id, name, hazard)

    with ThreadPoolExecutor(max_workers=20) as executor:
        feed = list(executor.map(fetch_one, RISK_SCORES))

    red_alerts = sum(1 for tel in feed if tel.get("imdAlertLevel") == "RED")
    orange_alerts = sum(1 for tel in feed if tel.get("imdAlertLevel") == "ORANGE")
    yellow_alerts = sum(1 for tel in feed if tel.get("imdAlertLevel") == "YELLOW")

    return {
        "status": "success",
        "nationalSummary": {
            "totalHabitationsMonitored": len(feed),
            "redAlertHabitations": red_alerts,
            "orangeAlertHabitations": orange_alerts,
            "yellowWatchHabitations": yellow_alerts,
            "normalHabitations": len(feed) - (red_alerts + orange_alerts + yellow_alerts),
            "sensorNetwork": "IMD-NCMRWF Doppler & ECMWF Satellite Mesh (Live)",
            "updatedAt": now_iso()
        },
        "habitations": feed
    }


@app.post("/api/recompute")
def recompute():
    """Re-executes the full ML pipeline if CSV datasets are updated."""
    global RISK_SCORES, PRIORITIZATION
    RISK_SCORES, PRIORITIZATION = load_and_compute()
    return {
        "status": "recomputed",
        "villages": len(RISK_SCORES),
        "anomalies_detected": len([r for r in RISK_SCORES if r.get("isAnomaly")])
    }


# ---------------------------------------------------------------------
# JWT AUTH HELPER — Login to Spring Boot backend
# ---------------------------------------------------------------------

def login_to_backend() -> dict:
    """
    Authenticates with Purwansh's Spring Boot backend via
    POST /api/auth/login and returns the JWT token + headers.

    Returns:
        dict with 'token' and 'headers' keys on success,
        or 'error' key on failure.
    """
    try:
        login_payload = {
            "email": BACKEND_EMAIL,
            "password": BACKEND_PASSWORD
        }
        r = requests.post(BACKEND_LOGIN_URL, json=login_payload, timeout=10)

        if r.status_code == 200:
            data = r.json()
            token = data.get("token", "")
            if token:
                return {
                    "token": token,
                    "headers": {
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                }
            return {"error": f"Login succeeded but no token in response: {r.text[:200]}"}
        else:
            return {"error": f"Login failed (HTTP {r.status_code}): {r.text[:300]}"}
    except Exception as e:
        return {"error": f"Cannot reach backend at {BACKEND_LOGIN_URL}: {str(e)}"}


@app.post("/api/push-to-backend")
def push_to_backend():
    """
    Pushes ML-computed risk scores and optimal relocation assignments
    to Purwansh's Spring Boot backend (POST /api/risk-scores/batch
    and POST /api/prioritization).

    Flow:
      1. Login to backend → get JWT token
      2. POST risk scores batch (with Authorization header)
      3. POST each prioritization record (with Authorization header)
    """
    results = {}

    # Step 1: Authenticate with JWT
    auth = login_to_backend()
    if "error" in auth:
        return {
            "status": "auth_failed",
            "error": auth["error"],
            "hint": "Make sure the Spring Boot backend is running on "
                    f"{BACKEND_URL} and an admin account exists with "
                    f"email '{BACKEND_EMAIL}'. See backend README for setup."
        }

    headers = auth["headers"]
    results["auth"] = "success"

    # Step 2: Push risk scores (batch)
    try:
        r1 = requests.post(BACKEND_RISK_URL, json=RISK_SCORES, headers=headers, timeout=30)
        if r1.status_code == 201:
            results["risk_scores"] = {
                "status": "success",
                "http_code": r1.status_code,
                "villages_pushed": len(RISK_SCORES)
            }
        else:
            results["risk_scores"] = {
                "status": "failed",
                "http_code": r1.status_code,
                "body": r1.text[:500]
            }
    except Exception as e:
        results["risk_scores"] = {"status": "error", "error": str(e)}

    # Step 3: Push prioritization (one by one, as backend expects single objects)
    try:
        sent = 0
        failed = 0
        errors = []
        for p in PRIORITIZATION:
            r2 = requests.post(BACKEND_PRIORITIZATION_URL, json=p, headers=headers, timeout=10)
            if r2.status_code == 201:
                sent += 1
            else:
                failed += 1
                if len(errors) < 3:  # Show first 3 errors only
                    errors.append({
                        "villageId": p.get("villageId"),
                        "http_code": r2.status_code,
                        "body": r2.text[:200]
                    })
        results["prioritization"] = {
            "status": "success" if failed == 0 else "partial",
            "sent": sent,
            "failed": failed,
            "total": len(PRIORITIZATION)
        }
        if errors:
            results["prioritization"]["first_errors"] = errors
    except Exception as e:
        results["prioritization"] = {"status": "error", "error": str(e)}

    return results


@app.get("/api/backend-status")
def backend_status():
    """
    Quick health check — tests if the Spring Boot backend is reachable
    and if JWT login succeeds. Call this before push-to-backend to debug.
    """
    # Test 1: Is backend reachable?
    try:
        r = requests.get(f"{BACKEND_URL}/api/dashboard/summary", timeout=5)
        backend_up = r.status_code == 200
    except Exception:
        backend_up = False

    # Test 2: Can we login?
    auth = login_to_backend()
    login_ok = "token" in auth

    return {
        "backend_url": BACKEND_URL,
        "backend_reachable": backend_up,
        "login_successful": login_ok,
        "login_email": BACKEND_EMAIL,
        "login_error": auth.get("error") if not login_ok else None,
        "ml_villages_ready": len(RISK_SCORES),
        "ml_prioritizations_ready": len(PRIORITIZATION),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
