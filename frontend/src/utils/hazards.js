/**
 * SIH26191 — Realistic Multi-Hazard Catchment & River Basin Inundation Polygons
 * Modeled after Google Flood Hub, Central Water Commission (CWC), & Geological Survey of India (GSI)
 * Real organic spatial boundaries covering major Indian flood basins, landslide valleys, and coastal surge zones.
 */

export const hazards = [
  // 1. BRAHMAPUTRA RIVER FLOOD BASIN (Assam - Guwahati, Barpeta, Majuli, Dhemaji)
  {
    id: "HAZ-001",
    name: "Brahmaputra Major Riverine Flood Basin",
    type: "Flood",
    severity: "Extreme",
    affectedPopulation: 1450000,
    color: "#ef4444",
    fillColor: "#f87171",
    description: "Active monsoon inundation corridor along Brahmaputra main stem & tributaries (Jiadhall & Beki).",
    coordinates: [
      [26.45, 90.85],
      [26.55, 91.20],
      [26.70, 91.80],
      [26.95, 92.50],
      [27.30, 93.80],
      [27.55, 94.60],
      [27.45, 94.85],
      [27.15, 94.40],
      [26.80, 93.50],
      [26.40, 92.20],
      [26.15, 91.40],
      [26.10, 90.90],
    ],
  },

  // 2. CHAMBAL & SINDH RIVER FLOOD ZONE (MP - Gwalior, Dabra, Datia, Bhind)
  {
    id: "HAZ-002",
    name: "Chambal & Sindh River Flash Inundation Zone",
    type: "Flood",
    severity: "Extreme",
    affectedPopulation: 850000,
    color: "#ef4444",
    fillColor: "#fb7185",
    description: "Google Flood Hub identified extreme flood discharge & river overflow basin.",
    coordinates: [
      [26.35, 78.05],
      [26.50, 78.40],
      [26.40, 78.85],
      [26.15, 78.95],
      [25.80, 78.70],
      [25.65, 78.35],
      [25.75, 78.10],
      [26.05, 77.95],
    ],
  },

  // 3. GANGA-YAMUNA SANGAM FLOOD LOWLANDS (UP - Prayagraj, Kaushambi, Mirzapur)
  {
    id: "HAZ-003",
    name: "Ganga-Yamuna Confluence Flood Plain",
    type: "Flood",
    severity: "Danger",
    affectedPopulation: 1200000,
    color: "#ea580c",
    fillColor: "#fdba74",
    description: "High flood level catchment prone to backwater flooding and low-lying urban inundation.",
    coordinates: [
      [25.55, 81.65],
      [25.60, 81.95],
      [25.48, 82.20],
      [25.35, 82.15],
      [25.28, 81.85],
      [25.35, 81.60],
      [25.45, 81.55],
    ],
  },

  // 4. KOSI RIVER EMBANKMENT BREACH BASIN (Bihar - Supaul, Saharsa, Madhepura)
  {
    id: "HAZ-004",
    name: "Kosi 'Sorrow of Bihar' Meandering Flood Catchment",
    type: "Flood",
    severity: "Extreme",
    affectedPopulation: 2100000,
    color: "#ef4444",
    fillColor: "#f87171",
    description: "Chronic high-silt river avulsion and extensive agricultural and settlement submergence.",
    coordinates: [
      [26.50, 86.40],
      [26.65, 86.80],
      [26.45, 87.10],
      [26.10, 87.05],
      [25.75, 86.70],
      [25.70, 86.35],
      [26.05, 86.30],
    ],
  },

  // 5. WAYANAD DEBRIS FLOW & LANDSLIDE CORRIDOR (Kerala - Chooralmala, Mundakkai, Meppadi)
  {
    id: "HAZ-005",
    name: "Western Ghats High-Risk Landslide & Debris Flow Zone",
    type: "Landslide",
    severity: "Extreme",
    affectedPopulation: 420000,
    color: "#b45309",
    fillColor: "#f59e0b",
    description: "Steep slope failure corridor triggered by intense rain & high soil pore pressure.",
    coordinates: [
      [11.65, 76.05],
      [11.70, 76.25],
      [11.58, 76.35],
      [11.45, 76.28],
      [11.42, 76.10],
      [11.50, 75.98],
    ],
  },

  // 6. JOSHIMATH & ALAKNANDA VALLEY SUBSIDENCE ZONE (Uttarakhand - Chamoli, Tapovan, Raini)
  {
    id: "HAZ-006",
    name: "Joshimath Tectonic Subsidence & Slope Creep Fault Line",
    type: "Landslide",
    severity: "Extreme",
    affectedPopulation: 180000,
    color: "#b45309",
    fillColor: "#fbbf24",
    description: "Main Central Thrust (MCT) geotechnical subsidence & Alaknanda valley flash flood zone.",
    coordinates: [
      [30.65, 79.45],
      [30.70, 79.75],
      [30.55, 79.85],
      [30.40, 79.70],
      [30.42, 79.40],
      [30.52, 79.35],
    ],
  },

  // 7. SUNDARBANS CYCLONE & TIDAL INUNDATION CORRIDOR (West Bengal - Sagar, Mousuni, Ghoramara)
  {
    id: "HAZ-007",
    name: "Sundarbans Coastal Surge & Embankment Erosion Zone",
    type: "Flood",
    severity: "Danger",
    affectedPopulation: 950000,
    color: "#0284c7",
    fillColor: "#38bdf8",
    description: "Vulnerable delta islands exposed to severe storm surges, tidal ingress, and sea level rise.",
    coordinates: [
      [22.10, 88.00],
      [22.25, 88.40],
      [22.05, 88.65],
      [21.60, 88.45],
      [21.50, 88.10],
      [21.75, 87.95],
    ],
  },

  // 8. BEAS & PARVATI VALLEY FLASH FLOOD CORRIDOR (Himachal Pradesh - Kullu, Mandi, Pandoh)
  {
    id: "HAZ-008",
    name: "Beas River Alpine Flash Flood & Cloudburst Basin",
    type: "Flood",
    severity: "Danger",
    affectedPopulation: 380000,
    color: "#ea580c",
    fillColor: "#fdba74",
    description: "Narrow mountain gorge vulnerable to sudden cloudburst discharge and river scouring.",
    coordinates: [
      [32.15, 77.05],
      [32.25, 77.40],
      [31.95, 77.55],
      [31.60, 77.25],
      [31.50, 76.90],
      [31.75, 76.85],
    ],
  },

  // 9. JHARIA COALFIELD FIRE & SUBSIDENCE ZONE (Jharkhand - Dhanbad, Kujama, Kenduadih)
  {
    id: "HAZ-009",
    name: "Jharia Underground Mine Fire & Ground Collapse Zone",
    type: "Landslide",
    severity: "Extreme",
    affectedPopulation: 650000,
    color: "#dc2626",
    fillColor: "#ef4444",
    description: "Active subterranean coal seam fires causing ground fissures and toxic gas release.",
    coordinates: [
      [23.85, 86.30],
      [23.90, 86.55],
      [23.75, 86.60],
      [23.65, 86.48],
      [23.68, 86.25],
    ],
  },

  // 10. KUTTANAD BELOW-SEA-LEVEL WATERLOGGING BELT (Kerala - Alappuzha, Kottayam)
  {
    id: "HAZ-010",
    name: "Kuttanad Sub-Sea-Level Chronic Submergence Delta",
    type: "Flood",
    severity: "Warning",
    affectedPopulation: 580000,
    color: "#0284c7",
    fillColor: "#7dd3fc",
    description: "Vembanad Lake lowland system situated 1.5-2.2m below sea level prone to prolonged waterlogging.",
    coordinates: [
      [9.65, 76.25],
      [9.70, 76.50],
      [9.45, 76.58],
      [9.30, 76.45],
      [9.35, 76.22],
    ],
  },

  // 11. KRISHNA-BUDAMERU SURGE BASIN (Andhra Pradesh - Vijayawada, NTR District)
  {
    id: "HAZ-011",
    name: "Budameru Rivulet Catchment & Urban Inundation Corridor",
    type: "Flood",
    severity: "Extreme",
    affectedPopulation: 450000,
    color: "#ef4444",
    fillColor: "#f87171",
    description: "Flash flood catchment causing historic 12-ft water surges in Vijayawada urban plain.",
    coordinates: [
      [16.65, 80.50],
      [16.70, 80.75],
      [16.50, 80.85],
      [16.38, 80.65],
      [16.42, 80.45],
    ],
  }
];
