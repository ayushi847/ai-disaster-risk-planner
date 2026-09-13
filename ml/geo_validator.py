"""
SIH26191 — Geo-Spatial Hazard Validator & Dynamic Risk Architecture Engine
=============================================================================
Senior Geo-Spatial Engineer, Disaster Management Analyst, and Data Architect Rules:

1. Terrain-Hazard Constraints (Flatlands vs Landslides):
   - Landslides require significant slope gradient (Slope >= 15°) and Elevation >= 50m.
   - Coastal lowlands, estuarine islands, and flat river plains are strictly prohibited from
     being tagged as 'Landslide'.
   - Lowland coastal/island areas are mapped to 'Storm Surge', 'Cyclone', or 'Flood'.
   - River plains/basins are mapped to 'Flood' or 'Flash Flood'.

2. Mining Subsidence Rule Engine:
   - Colliery and underground coalfield extraction zones (e.g. Kenduadih, Bagdigi, Kujama, Lalten Ganj in Dhanbad/Jharia)
     must be classified as 'Ground Subsidence', NEVER natural slope 'Landslide'.

3. Standardized Hazard Taxonomy:
   - Allowed Types: ['Flood', 'Flash Flood', 'Landslide', 'Cyclone', 'Storm Surge', 'Ground Subsidence', 'Extreme Heat']

4. Dynamic Multi-Factor Risk Formula:
   - Risk Score = (Real-Time Hazard Trigger * 0.5) + (Vulnerability Index * 0.3) + (Historical Frequency * 0.2)
   - Scaled 0 to 100.
   - Gated Threshold: An alert score >= 70 (Urgent/Critical) is strictly gated and requires
     active meteorological or hydrological alerts (IMD Orange/Red, 24h rain > 50mm, soil saturation > 80%, wind > 55 km/h).
"""

from typing import Dict, Any, Tuple, Optional

# Standardized Taxonomy (Disaster Management Standard)
ALLOWED_HAZARD_TYPES = [
    "Flood",
    "Flash Flood",
    "Landslide",
    "Cyclone",
    "Storm Surge",
    "Ground Subsidence",
    "Extreme Heat"
]

# Known Mining Colliery / Underground Fire & Subsidence Zones (Dhanbad, Bokaro, Ramgarh, Raniganj)
MINING_SUBSIDENCE_KEYWORDS = [
    "colliery", "mine", "mining", "underground fire", "coalfield", 
    "kenduadih", "kujama", "bagdigi", "lalten ganj", "putki-balihari", "jharia", "bokaro"
]

# Coastal / Island / Lowland keywords where Landslides are geomorphologically impossible
COASTAL_FLATLAND_KEYWORDS = [
    "island", "coastal", "port", "beach", "shoreline", "delta", "marsh",
    "ghoramara", "mousuni", "sagar island", "satapada", "konark", "satabhaya",
    "pentha", "jafarabad", "mandvi", "kutch", "chellanam", "alappad", "valiathura",
    "poonthura", "anjuthengu", "varkala", "kochu veli", "bapatla", "velachery",
    "mudichur", "tambaram", "kuttanad", "majuli", "salmora", "nirmali", "supaul"
]

# Approximate DEM elevations (meters above sea level) for known habitations (cached from SRTM/Open-Meteo)
KNOWN_ELEVATIONS = {
    "VLG-041": 3.0,    # Ghoramara Island
    "VLG-042": 3.5,    # Mousuni Island
    "VLG-043": 4.0,    # Sagar Island
    "VLG-059": 2.0,    # Satapada Coastal
    "VLG-060": 5.0,    # Konark Coastal Belt
    "VLG-029": 4.0,    # Satabhaya
    "VLG-030": 4.0,    # Pentha
    "VLG-031": 8.0,    # Coastal Jagatsinghpur
    "VLG-068": 12.0,   # Jafarabad Coastal
    "VLG-069": 14.0,   # Mandvi Port Kutch
    "VLG-071": 6.0,    # Bapatla Coastal
    "VLG-014": 2.0,    # Chellanam
    "VLG-015": 3.0,    # Alappad
    "VLG-016": 6.0,    # Valiathura
    "VLG-017": 5.0,    # Poonthura
    "VLG-018": 7.0,    # Anjuthengu
    "VLG-019": 18.0,   # Varkala Coastal Cliff (sandy cliff, <50m)
    "VLG-020": 4.0,    # Kochu Veli
    "VLG-021": 8.0,    # Kozhikode coastal
    "VLG-022": 7.0,    # Ponnani/Tanur coastal
    "VLG-023": -1.5,   # Kuttanad (below sea level)
    "VLG-047": 84.0,   # Salmora (Majuli island river flat)
    "VLG-058": 24.0,   # Tambaram West (flat urban plain)
    "VLG-056": 16.0,   # Mudichur
    "VLG-057": 8.0,    # Velachery marsh
    "VLG-064": 48.0,   # Nirmali Kosi Embankment (plain)
    "VLG-065": 42.0,   # Mahishi Kosi Lowlands (plain)
    "VLG-053": 1585.0, # Rajbagh Srinagar (high altitude flat valley river basin)
    "VLG-054": 1585.0, # Shivpora Srinagar (flat valley river basin)
    "VLG-072": 98.0,   # Prayagraj Sangam (river confluence plain)
    "VLG-073": 206.0,  # Dabra/Gwalior Chambal Basin (plain)
    "VLG-074": 42.0,   # Barpeta Town (Brahmaputra plain)
    "VLG-007": 195.0,  # Bagdigi Dhanbad (mining plateau)
    "VLG-008": 188.0,  # Kujama Dhanbad (mining plateau)
    "VLG-009": 186.0,  # Kenduadih Dhanbad (mining colliery)
    "VLG-010": 195.0,  # Lalten Ganj Dhanbad (mining plateau)
    "VLG-011": 650.0,  # Lukodiya Ranchi (mining plateau)
    "VLG-013": 220.0,  # Bokaro coalfield
    "VLG-036": 1890.0, # Sunil Ward Joshimath (steep mountain)
    "VLG-037": 1870.0, # Manohar Bagh Joshimath
    "VLG-038": 1850.0, # Singdhar Ward Joshimath
    "VLG-032": 880.0,  # Chooralmala Wayanad (steep Western Ghats)
    "VLG-033": 920.0,  # Mundakkai Wayanad (steep Western Ghats)
    "VLG-034": 1050.0, # Punchirimattam Wayanad
    "VLG-061": 840.0,  # Malin Ambegaon (steep Western Ghats)
    "VLG-062": 120.0,  # Taliye Mahad (steep foothill)
    "VLG-063": 350.0,  # Irshalwadi Raigad (cliff/peak)
}


def validate_and_classify_hazard(
    village_id: str,
    village_name: str,
    district: str,
    state: str,
    raw_hazard: str,
    lat: float,
    lng: float,
    elevation: Optional[float] = None
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Applies Senior Geo-Spatial Engineer & Data Architect validation logic:
    Returns (standardized_hazard_type, hazard_detail, validation_meta).
    """
    text_corpus = f"{village_id} {village_name} {district} {state} {raw_hazard}".lower()
    
    # 1. Determine Elevation
    if elevation is None:
        elevation = KNOWN_ELEVATIONS.get(village_id)
        if elevation is None:
            if any(k in text_corpus for k in ["island", "coastal", "port", "beach", "sea", "ocean"]):
                elevation = 15.0
            else:
                elevation = 200.0

    # 2. Check Mining Subsidence Rule
    is_mining_colliery = any(m in text_corpus for m in MINING_SUBSIDENCE_KEYWORDS)
    if is_mining_colliery:
        std_hazard = "Ground Subsidence"
        hazard_detail = "Subterranean mining collapse, coal seam fissures and ground subsidence"
        meta = {
            "elevationM": elevation,
            "slopeCategory": "Plateau / Colliery Basin",
            "ruleApplied": "RULE-MINING-SUBSIDENCE: Colliery / coalfield cave-in classified as Ground Subsidence",
            "isTerrainValid": True
        }
        return std_hazard, hazard_detail, meta

    # 3. Check Flatland / Coastal / Island / River Plain terrain constraints
    is_coastal_or_island = any(c in text_corpus for c in [
        "island", "coastal", "port", "cyclone", "surge", "sea level", "embankment breach", "shoreline",
        "sagar island", "ghoramara", "mousuni", "satapada", "konark", "satabhaya", "pentha",
        "jafarabad", "mandvi", "kutch", "bapatla", "chellanam", "alappad", "valiathura", "poonthura"
    ])

    is_riverine_flood_plain = any(f in text_corpus for f in [
        "river", "basin", "flood", "inundation", "confluence", "tributary", "waterlogging",
        "jhelum", "kosi", "brahmaputra", "ganga", "yamuna", "chambal", "sindh", "adyar", "canal",
        "rajbagh", "shivpora", "anantnag", "nirmali", "mahishi", "barpeta", "dhemaji", "dabra",
        "gwalior", "prayagraj", "tambaram", "mudichur", "velachery", "kuttanad"
    ])

    # Enforce Rule 1: Slope & Elevation constraint
    # Block Landslide if Elevation < 50m OR if location is a flat coastal island / river plain
    if "landslide" in raw_hazard.lower() or "mudslide" in raw_hazard.lower():
        if elevation < 50.0 or is_coastal_or_island or (is_riverine_flood_plain and "hill" not in text_corpus):
            # VIOLATION DETECTED: Flatland tagged with Landslide
            if "cyclone" in text_corpus:
                std_hazard = "Cyclone"
                hazard_detail = "Severe cyclone landfall and destructive wind surge"
            elif any(k in text_corpus for k in ["surge", "coastal", "island", "erosion", "tidal", "sea level"]):
                std_hazard = "Storm Surge"
                hazard_detail = "Coastal storm surge, saltwater inundation and severe shoreline erosion"
            else:
                std_hazard = "Flood"
                hazard_detail = "Lowland catchment flooding and riverine inundation"

            meta = {
                "elevationM": elevation,
                "slopeCategory": "Flat Lowland / Coastal Plain (<15° slope)",
                "ruleApplied": f"RULE-TERRAIN-MISMATCH: Blocked 'Landslide' due to low elevation ({elevation}m < 50m) or coastal/river plain. Reclassified to {std_hazard}",
                "isTerrainValid": True
            }
            return std_hazard, hazard_detail, meta

    # 4. Standard classification matching allowed taxonomy (Prioritize natural slope failures)
    if "flash flood" in raw_hazard.lower() or "glof" in raw_hazard.lower() or "cloudburst" in raw_hazard.lower():
        std_hazard = "Flash Flood"
        hazard_detail = raw_hazard
    elif any(k in raw_hazard.lower() for k in ["debris flow", "mudflow", "mudslide", "slope collapse", "cliff collapse"]):
        std_hazard = "Landslide"
        hazard_detail = raw_hazard
    elif "cyclone" in raw_hazard.lower():
        std_hazard = "Cyclone"
        hazard_detail = raw_hazard
    elif "surge" in raw_hazard.lower() or "coastal erosion" in raw_hazard.lower() or "tidal" in raw_hazard.lower():
        std_hazard = "Storm Surge"
        hazard_detail = raw_hazard
    elif "subsidence" in raw_hazard.lower() or "fissure" in raw_hazard.lower() or "structural cracking" in raw_hazard.lower():
        std_hazard = "Ground Subsidence"
        hazard_detail = raw_hazard
    elif "flood" in raw_hazard.lower() or "inundation" in raw_hazard.lower() or "waterlogging" in raw_hazard.lower() or "overflow" in raw_hazard.lower():
        std_hazard = "Flood"
        hazard_detail = raw_hazard
    elif "heat" in raw_hazard.lower():
        std_hazard = "Extreme Heat"
        hazard_detail = raw_hazard
    elif "landslide" in raw_hazard.lower():
        std_hazard = "Landslide"
        hazard_detail = raw_hazard
    else:
        std_hazard = "Flood" if elevation < 100 else "Landslide"
        hazard_detail = raw_hazard

    meta = {
        "elevationM": elevation,
        "slopeCategory": "High Relief / Steep Mountain (>15° slope)" if elevation >= 300 else "Valley / Undulating",
        "ruleApplied": "RULE-STANDARD-TAXONOMY: Validated against approved hazard classifications",
        "isTerrainValid": True
    }
    return std_hazard, hazard_detail, meta


def compute_dynamic_risk_score(
    realtime_trigger: float,
    vulnerability_index: float,
    historical_frequency: float,
    has_active_met_alert: bool = False,
    hazard_type: str = "Flood"
) -> Tuple[float, str, Dict[str, Any]]:
    """
    Computes the Dynamic Multi-Factor Risk Score:
      Risk Score = (Real-Time Hazard Trigger * 0.5) + (Vulnerability Index * 0.3) + (Historical Frequency * 0.2)
      Scaled to 0 - 100.
    
    CRITICAL GATING RULE:
      An alert score >= 70 (Urgent/Critical) MUST be backed by active meteorological or hydrological thresholds.
      If has_active_met_alert is False, the score is capped at 68.0 to eliminate false local alarms (e.g. Gwalior).
    """
    rt = max(0.0, min(1.0, float(realtime_trigger)))
    vuln = max(0.0, min(1.0, float(vulnerability_index)))
    hist = max(0.0, min(1.0, float(historical_frequency)))

    raw_score = (rt * 0.5 + vuln * 0.3 + hist * 0.2) * 100.0
    gated = False

    # Enforcement of Core Requirement: Gating unverified Critical/Urgent alerts
    if raw_score >= 70.0 and not has_active_met_alert:
        raw_score = 66.5  # Clamped to High/Medium-High watch; requires active trigger for Critical
        gated = True

    score = round(max(5.0, min(98.0, raw_score)), 1)

    if score >= 75.0:
        level = "CRITICAL"
    elif score >= 55.0:
        level = "HIGH"
    elif score >= 35.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    breakdown = {
        "realtimeTriggerContribution": round(rt * 0.5 * 100, 1),
        "vulnerabilityContribution": round(vuln * 0.3 * 100, 1),
        "historicalFrequencyContribution": round(hist * 0.2 * 100, 1),
        "realtimeTriggerWeight": 0.5,
        "vulnerabilityWeight": 0.3,
        "historicalFrequencyWeight": 0.2,
        "hasActiveMetAlert": has_active_met_alert,
        "isThresholdGated": gated,
        "formula": "Risk Score = (Real-Time Trigger × 0.5) + (Vulnerability × 0.3) + (Historical Freq × 0.2)"
    }

    return score, level, breakdown
