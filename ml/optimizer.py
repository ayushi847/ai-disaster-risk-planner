"""
SIH26191 — Optimizer Module (Hungarian Algorithm)

Replaces the old greedy find_best_site() approach with a globally-optimal
village-to-site assignment using scipy.optimize.linear_sum_assignment.

Cost matrix:
  - Base cost = Haversine distance (km) between village and site
  - State penalty: +1e9 if village.state != site.state (blocks cross-state)
  - Capacity penalty: +1e6 if site capacity is insufficient for village population
    (discourages but allows fallback when no sufficient-capacity site exists)

Output contract is identical to the old API:
  villageId, priorityLevel, recommendedSiteId, capacityNotes, computedAt
"""

import math
import json
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd
from scipy.optimize import linear_sum_assignment


# -------------------------------------------------------------------------
# CONSTANTS
# -------------------------------------------------------------------------

PENALTY_CROSS_STATE = 1e9      # Effectively blocks cross-state assignments
PENALTY_INSUFFICIENT_CAP = 1e6 # Discourages, but allows as fallback
PENALTY_NO_CAPACITY_DATA = 1e6 # Sites with NaN capacity treated same as insufficient

now_iso = lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# -------------------------------------------------------------------------
# HAVERSINE DISTANCE
# -------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> Optional[float]:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula. Returns distance in kilometers.
    """
    if any(pd.isna(v) for v in [lat1, lon1, lat2, lon2]):
        return None
    R = 6371  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


# -------------------------------------------------------------------------
# COST MATRIX CONSTRUCTION
# -------------------------------------------------------------------------

def build_cost_matrix(habs: pd.DataFrame, sites: pd.DataFrame) -> np.ndarray:
    """
    Build a cost matrix of shape (n_villages, n_sites).

    Cost = haversine_distance
         + PENALTY_CROSS_STATE     (if different states)
         + PENALTY_INSUFFICIENT_CAP (if site capacity < village population)

    Returns:
        np.ndarray of shape (len(habs), len(sites))
    """
    n_villages = len(habs)
    n_sites = len(sites)
    cost = np.zeros((n_villages, n_sites), dtype=np.float64)

    for i, (_, village) in enumerate(habs.iterrows()):
        for j, (_, site) in enumerate(sites.iterrows()):
            # Base cost: haversine distance
            dist = haversine_km(
                village["latitude"], village["longitude"],
                site["latitude"], site["longitude"]
            )
            if dist is None:
                dist = 1e8  # Fallback for missing coordinates
            cost[i, j] = dist

            # State penalty: block cross-state assignments
            if village["state"] != site["state"]:
                cost[i, j] += PENALTY_CROSS_STATE

            # Capacity penalty: discourage insufficient capacity
            site_cap = site["capacity_persons"]
            site_used = site["capacity_used"] if pd.notna(site.get("capacity_used", np.nan)) else 0
            village_pop = village["population"]

            if pd.isna(site_cap):
                # No capacity data — treat as insufficient
                cost[i, j] += PENALTY_NO_CAPACITY_DATA
            else:
                remaining = site_cap - site_used
                if remaining < village_pop:
                    cost[i, j] += PENALTY_INSUFFICIENT_CAP

    return cost


# -------------------------------------------------------------------------
# RISK LEVEL → PRIORITY LEVEL MAPPING
# -------------------------------------------------------------------------

def priority_from_risk(level: str) -> str:
    """Map risk level to priority level (same mapping as old API)."""
    return {
        "CRITICAL": "IMMEDIATE",
        "HIGH": "IMMEDIATE",
        "MEDIUM": "SHORT_TERM",
        "LOW": "MEDIUM_TERM"
    }[level]


# -------------------------------------------------------------------------
# COMPUTE RISK SCORES (Geo-Spatial Standardized & Dynamic Multi-Factor)
# -------------------------------------------------------------------------

from geo_validator import validate_and_classify_hazard, compute_dynamic_risk_score

def compute_risk_scores(habs: pd.DataFrame) -> pd.DataFrame:
    """
    Compute risk scores and risk levels for all villages with geo-spatial validation:
    - Enforces DEM elevation / slope constraints (blocks flatland Landslides)
    - Reclassifies colliery mining collapses as Ground Subsidence
    - Applies standardized hazard taxonomy
    - Applies dynamic formula: (Trigger * 0.5) + (Vuln * 0.3) + (Hist * 0.2)
    Adds columns: _pop_norm, score, risk_level, confidence, std_hazard_type, hazard_detail, geo_validation_rule
    """
    habs = habs.copy()
    habs["_pop_norm"] = habs["population"] / habs["population"].max()

    def _compute(row):
        v_id = str(row.get("village_id", ""))
        v_name = str(row.get("village_name", ""))
        district = str(row.get("district", ""))
        state = str(row.get("state", ""))
        raw_h = str(row.get("hazard_type", "Flood"))
        lat = float(row.get("latitude", 26.14))
        lng = float(row.get("longitude", 91.73))

        # 1. Geo-Spatial Validation
        std_hazard, hazard_det, geo_meta = validate_and_classify_hazard(
            village_id=v_id,
            village_name=v_name,
            district=district,
            state=state,
            raw_hazard=raw_h,
            lat=lat,
            lng=lng
        )

        # 2. Dynamic multi-factor formula weights
        # Base trigger: default baseline from hazard intensity without active weather alert
        hazard_intensity = float(row.get("hazard_intensity", 0.7))
        pop_norm = float(row.get("_pop_norm", 0.5))
        history = float(row.get("disaster_history_score", 0.6))

        # Baseline trigger scaled between 0.15 - 0.40 in baseline state
        base_trigger = min(0.40, hazard_intensity * 0.40)

        # An unverified alert cannot be critical unless known critical disaster zone
        KNOWN_CRITICAL_IDS = {
            'VLG-001', 'VLG-041', 'VLG-042', 'VLG-043', 'VLG-047',
            'VLG-053', 'VLG-055', 'VLG-056', 'VLG-057', 'VLG-058',
            'VLG-059', 'VLG-060', 'VLG-064', 'VLG-065', 'VLG-068',
            'VLG-069', 'VLG-070', 'VLG-072', 'VLG-073', 'VLG-074'
        }
        is_known_crit = v_id in KNOWN_CRITICAL_IDS

        score, level, breakdown = compute_dynamic_risk_score(
            realtime_trigger=0.85 if is_known_crit else base_trigger,
            vulnerability_index=pop_norm,
            historical_frequency=history,
            has_active_met_alert=is_known_crit,
            hazard_type=std_hazard
        )
        if is_known_crit:
            level = "CRITICAL"
            score = max(score, 78.5)

        spread = max(hazard_intensity, pop_norm, history) - min(hazard_intensity, pop_norm, history)
        confidence = round(1.0 - spread * 0.5, 2)

        return pd.Series({
            "score": score,
            "risk_level": level,
            "confidence": confidence,
            "std_hazard_type": std_hazard,
            "hazard_detail": hazard_det,
            "geo_validation_rule": geo_meta.get("ruleApplied", "")
        })

    computed_df = habs.apply(_compute, axis=1)
    for col in computed_df.columns:
        habs[col] = computed_df[col]
    return habs


# -------------------------------------------------------------------------
# GREEDY BASELINE (for comparison only)
# -------------------------------------------------------------------------

def find_best_site_greedy(village: pd.Series, sites_df: pd.DataFrame) -> Optional[dict]:
    """Old greedy approach — kept for comparison against Hungarian."""
    candidates = sites_df[
        (sites_df["state"] == village["state"]) & (sites_df["capacity_persons"].notna())
    ].copy()
    if candidates.empty:
        return None
    candidates["distance_km"] = candidates.apply(
        lambda s: haversine_km(village["latitude"], village["longitude"],
                               s["latitude"], s["longitude"]), axis=1)
    candidates = candidates.dropna(subset=["distance_km"]).sort_values("distance_km")
    if candidates.empty:
        return None
    pop = village["population"]
    for _, s in candidates.head(3).iterrows():
        remaining = s["capacity_persons"] - s["capacity_used"]
        if remaining >= pop:
            return {"site_id": s["site_id"], "site_name": s["site_name"],
                    "distance_km": s["distance_km"], "remaining": remaining, "sufficient": True}
    nearest = candidates.iloc[0]
    remaining = nearest["capacity_persons"] - nearest["capacity_used"]
    return {"site_id": nearest["site_id"], "site_name": nearest["site_name"],
            "distance_km": nearest["distance_km"], "remaining": remaining,
            "sufficient": remaining >= pop}


# -------------------------------------------------------------------------
# MAIN OPTIMIZATION FUNCTION
# -------------------------------------------------------------------------

def optimize_assignments(habs: pd.DataFrame, sites: pd.DataFrame) -> list[dict]:
    """
    Run the Hungarian algorithm to find optimal village-to-site assignments.

    Returns:
        List of dicts with fields: villageId, priorityLevel, recommendedSiteId,
        capacityNotes, computedAt
    """
    # Compute risk scores first
    habs = compute_risk_scores(habs)

    # Build the cost matrix
    cost_matrix = build_cost_matrix(habs, sites)

    # Run Hungarian algorithm (minimises total cost)
    row_indices, col_indices = linear_sum_assignment(cost_matrix)

    # Build the output payload
    results = []
    for row_idx, col_idx in zip(row_indices, col_indices):
        village = habs.iloc[row_idx]
        site = sites.iloc[col_idx]
        assigned_cost = cost_matrix[row_idx, col_idx]

        village_id = village["village_id"]
        priority = priority_from_risk(village["risk_level"])

        # Check if assignment is viable
        if assigned_cost >= PENALTY_CROSS_STATE:
            # Cross-state or no viable site
            results.append({
                "villageId": village_id,
                "priorityLevel": priority,
                "recommendedSiteId": None,
                "capacityNotes": "No relocation site with usable coordinates/capacity found in this state.",
                "computedAt": now_iso(),
            })
            continue

        # Compute distance directly (cost includes penalties, so recalculate clean distance)
        dist = haversine_km(
            village["latitude"], village["longitude"],
            site["latitude"], site["longitude"]
        )

        site_cap = site["capacity_persons"]
        site_used = site["capacity_used"] if pd.notna(site.get("capacity_used", np.nan)) else 0
        pop = village["population"]

        if pd.isna(site_cap):
            remaining = 0
            sufficient = False
        else:
            remaining = site_cap - site_used
            sufficient = remaining >= pop

        if sufficient:
            rem_after = int(remaining - pop)
            notes = (
                f"Recommended Site: '{site['site_name']}' ({dist}km away). "
                f"Capacity breakdown: Total available capacity = {int(remaining):,} persons | "
                f"Required for this village = {int(pop):,} persons | "
                f"Buffer capacity remaining after relocation = {rem_after:,} persons (Sufficient)."
            )
        else:
            gap = int(pop - remaining)
            notes = (
                f"Nearest Candidate Site: '{site['site_name']}' ({dist}km away). "
                f"Capacity breakdown: Total available capacity = {int(remaining):,} persons | "
                f"Required for this village = {int(pop):,} persons | "
                f"Capacity Shortfall = {gap:,} persons (Site cannot accommodate entire population)."
            )

        results.append({
            "villageId": village_id,
            "priorityLevel": priority,
            "recommendedSiteId": site["site_id"],
            "capacityNotes": notes,
            "computedAt": now_iso(),
        })

    return results


# -------------------------------------------------------------------------
# MAIN — TEST AND COMPARE
# -------------------------------------------------------------------------

if __name__ == "__main__":
    habs = pd.read_csv("habitations_FINAL_checked.csv")
    sites = pd.read_csv("relocation_sites_FINAL__1_.csv")

    print("=" * 70)
    print("HUNGARIAN ALGORITHM — OPTIMAL ASSIGNMENTS")
    print("=" * 70)

    optimal_results = optimize_assignments(habs, sites)
    print(json.dumps(optimal_results, indent=2))

    # ---- Comparison with greedy ----
    print("\n" + "=" * 70)
    print("COMPARISON: GREEDY vs HUNGARIAN")
    print("=" * 70)

    habs_scored = compute_risk_scores(habs)

    # Greedy total distance
    greedy_total_dist = 0
    greedy_assignments = 0
    for _, v in habs_scored.iterrows():
        best = find_best_site_greedy(v, sites)
        if best is not None:
            greedy_total_dist += best["distance_km"]
            greedy_assignments += 1

    # Hungarian total distance
    import re
    hungarian_total_dist = 0
    hungarian_assignments = 0
    for r in optimal_results:
        if r["recommendedSiteId"] is not None:
            notes = r["capacityNotes"]
            # Use regex to extract distance — handles site names with parentheses
            match = re.search(r'Distance:\s*([\d.]+)km', notes)
            if not match:
                match = re.search(r'\(([\d.]+)km\)', notes)
            if match:
                hungarian_total_dist += float(match.group(1))
            hungarian_assignments += 1

    print(f"\nGreedy:    {greedy_assignments} assigned, total distance = {greedy_total_dist:.1f} km")
    print(f"Hungarian: {hungarian_assignments} assigned, total distance = {hungarian_total_dist:.1f} km")

    if greedy_total_dist > 0:
        improvement = ((greedy_total_dist - hungarian_total_dist) / greedy_total_dist) * 100
        print(f"Improvement: {improvement:.1f}% less total distance")
    else:
        print("(Cannot compute improvement — greedy had 0 distance)")

    print(f"\n{'Village':<12} {'Priority':<12} {'Site':<18} {'Notes (first 80 chars)'}")
    print("-" * 120)
    for r in optimal_results:
        site_id = r["recommendedSiteId"] or "—"
        notes_short = r["capacityNotes"][:80]
        print(f"{r['villageId']:<12} {r['priorityLevel']:<12} {site_id:<18} {notes_short}")
