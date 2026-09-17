/**
 * Emergency Authority Directory & SOS Dispatch Utility
 * Provides location-aware nearest authorities (DEOC / DDMA, SDMA, NDRF, Police 112, Medical 108)
 * and generates pre-drafted SOS SMS & direct Call deep-links.
 */

// Universal National Helplines
export const NATIONAL_HELPLINES = {
  ERSS: {
    id: "national-112",
    name: "National Emergency Response Support System (ERSS)",
    department: "Ministry of Home Affairs",
    phone: "112",
    displayPhone: "112",
    type: "universal",
    jurisdiction: "All India (Police, Fire, Medical)",
    available24x7: true,
    badge: "National 112",
    priority: 1
  },
  NDMA: {
    id: "ndma-control",
    name: "NDMA National Disaster Helpline",
    department: "National Disaster Management Authority",
    phone: "1078",
    displayPhone: "1078 / 011-26701728",
    type: "disaster_control",
    jurisdiction: "National Disaster Control Room",
    available24x7: true,
    badge: "NDMA HQ",
    priority: 2
  },
  NDRF: {
    id: "ndrf-hq",
    name: "NDRF 24x7 Operations Command Centre",
    department: "National Disaster Response Force (HQ)",
    phone: "+919711077372",
    displayPhone: "011-24363260 / +91 97110 77372",
    type: "ndrf",
    jurisdiction: "All India Tactical Rescue Operations",
    available24x7: true,
    badge: "NDRF HQ",
    priority: 3
  },
  MEDICAL: {
    id: "medical-108",
    name: "National Medical Emergency & Ambulance",
    department: "Emergency Medical Services",
    phone: "108",
    displayPhone: "108",
    type: "medical",
    jurisdiction: "Nationwide Trauma & Life Support",
    available24x7: true,
    badge: "Ambulance 108",
    priority: 4
  }
};

// State Emergency Operation Centres (SEOC / SDMA)
export const STATE_SDMAS = {
  "Uttarakhand": {
    name: "Uttarakhand State Disaster Management Authority (USDMA)",
    phone: "0135-2710334",
    tollFree: "1070",
    seoc: "0135-2710335",
    sdrf: "+919456559300",
    headquarters: "Dehradun"
  },
  "Himachal Pradesh": {
    name: "Himachal Pradesh State Disaster Management Authority (HPSDMA)",
    phone: "0177-2812344",
    tollFree: "1070",
    seoc: "0177-2629439",
    sdrf: "+919459457100",
    headquarters: "Shimla"
  },
  "Assam": {
    name: "Assam State Disaster Management Authority (ASDMA)",
    phone: "0361-2237221",
    tollFree: "1070",
    seoc: "0361-2237010",
    sdrf: "+919435962222",
    headquarters: "Guwahati"
  },
  "Kerala": {
    name: "Kerala State Disaster Management Authority (KSDMA)",
    phone: "0471-2364424",
    tollFree: "1070",
    seoc: "0471-2331639",
    sdrf: "0471-2333198",
    headquarters: "Thiruvananthapuram"
  },
  "Odisha": {
    name: "Odisha State Disaster Management Authority (OSDMA)",
    phone: "0674-2395398",
    tollFree: "1070",
    seoc: "0674-2395395",
    odraf: "0674-2395531",
    headquarters: "Bhubaneswar"
  },
  "Maharashtra": {
    name: "Maharashtra Disaster Management Department (SDMA)",
    phone: "022-22027990",
    tollFree: "1070",
    seoc: "022-22885994",
    sdrf: "022-22026599",
    headquarters: "Mantralaya, Mumbai"
  },
  "Tamil Nadu": {
    name: "Tamil Nadu Disaster Risk Reduction Agency (TNDRRA)",
    phone: "044-28593990",
    tollFree: "1070",
    seoc: "044-28593991",
    sdrf: "044-28447701",
    headquarters: "Chennai"
  },
  "Jammu and Kashmir": {
    name: "J&K Disaster Management Authority (JKDMA)",
    phone: "0194-2452138",
    tollFree: "1070",
    seoc: "0191-2560263",
    sdrf: "0194-2455019",
    headquarters: "Srinagar / Jammu"
  },
  "Jharkhand": {
    name: "Jharkhand State Disaster Management Authority",
    phone: "0651-2400220",
    tollFree: "1070",
    seoc: "0651-2400234",
    sdrf: "0651-2490001",
    headquarters: "Ranchi"
  },
  "West Bengal": {
    name: "West Bengal Disaster Management & Civil Defence",
    phone: "033-22143526",
    tollFree: "1070",
    seoc: "033-22144031",
    sdrf: "033-22141995",
    headquarters: "Nabanna, Howrah"
  },
  "Bihar": {
    name: "Bihar State Disaster Management Authority (BSDMA)",
    phone: "0612-2547232",
    tollFree: "1070",
    seoc: "0612-2546057",
    sdrf: "0612-2226245",
    headquarters: "Patna"
  },
  "Sikkim": {
    name: "Sikkim State Disaster Management Authority (SSDMA)",
    phone: "03592-202283",
    tollFree: "1070",
    seoc: "03592-201075",
    sdrf: "03592-202892",
    headquarters: "Gangtok"
  },
  "Gujarat": {
    name: "Gujarat State Disaster Management Authority (GSDMA)",
    phone: "079-23259283",
    tollFree: "1070",
    seoc: "079-23251900",
    sdrf: "079-23251908",
    headquarters: "Gandhinagar"
  },
  "Andhra Pradesh": {
    name: "Andhra Pradesh State Disaster Management Authority (APSDMA)",
    phone: "0863-2377018",
    tollFree: "1070",
    seoc: "0863-2377020",
    sdrf: "0863-2377019",
    headquarters: "Tadepalli, Guntur"
  },
  "Uttar Pradesh": {
    name: "UP State Disaster Management Authority (UPSDMA)",
    phone: "0522-2720828",
    tollFree: "1070",
    seoc: "0522-2720830",
    sdrf: "0522-2287236",
    headquarters: "Lucknow"
  },
  "Madhya Pradesh": {
    name: "MP State Disaster Management Authority (MPSDMA)",
    phone: "0755-2446158",
    tollFree: "1070",
    seoc: "0755-2446159",
    sdrf: "0755-2550100",
    headquarters: "Bhopal"
  },
  "Manipur": {
    name: "Manipur State Disaster Management Authority",
    phone: "0385-2443441",
    tollFree: "1070",
    seoc: "0385-2443442",
    sdrf: "0385-2450101",
    headquarters: "Imphal"
  }
};

// District Emergency Operation Centres (DEOC / DDMA) & Local Authorities
export const DISTRICT_AUTHORITIES = {
  // Uttarakhand
  "Chamoli": {
    ddmaName: "DDMA Chamoli / District Emergency Operation Centre",
    phone: "01372-251437",
    mobile: "+919411112976",
    ndrfBattalion: "NDRF 8th Battalion / SDRF Joshimath Unit",
    ndrfPhone: "+919456559301",
    cmoPhone: "01372-252157"
  },
  "Rudraprayag": {
    ddmaName: "DDMA Rudraprayag / DEOC Control Room",
    phone: "01364-233727",
    mobile: "+919412914875",
    ndrfBattalion: "SDRF Agastyamuni Post",
    ndrfPhone: "+919456559302",
    cmoPhone: "01364-233211"
  },
  "Dehradun": {
    ddmaName: "DDMA Dehradun / District Disaster Control",
    phone: "0135-2726066",
    mobile: "+919412055850",
    ndrfBattalion: "SDRF HQ Jolly Grant",
    ndrfPhone: "+919456559300",
    cmoPhone: "0135-2656345"
  },

  // Himachal Pradesh
  "Kullu": {
    ddmaName: "DDMA Kullu / Emergency Operation Centre",
    phone: "01902-225630",
    mobile: "+919418022630",
    ndrfBattalion: "NDRF 14th Battalion (Kullu Detachment)",
    ndrfPhone: "+918219500642",
    cmoPhone: "01902-222350"
  },
  "Mandi": {
    ddmaName: "DDMA Mandi / Disaster Management Cell",
    phone: "01905-226201",
    mobile: "+919418026201",
    ndrfBattalion: "SDRF 3rd Battalion Mandi",
    ndrfPhone: "+919459457102",
    cmoPhone: "01905-222160"
  },

  // Kerala
  "Wayanad": {
    ddmaName: "DDMA Wayanad / District Collectorate DEOC",
    phone: "04936-204151",
    mobile: "+918078409770",
    ndrfBattalion: "NDRF 4th Battalion / Fire & Rescue Wayanad",
    ndrfPhone: "+919447760085",
    cmoPhone: "04936-202332"
  },
  "Ernakulam": {
    ddmaName: "DDMA Ernakulam / District Emergency Control",
    phone: "0484-2423513",
    mobile: "+919447477500",
    ndrfBattalion: "NDRF Cochin Coastal Operations Base",
    ndrfPhone: "0484-2422233",
    cmoPhone: "0484-2361209"
  },
  "Alappuzha": {
    ddmaName: "DDMA Alappuzha / Flood Control Room",
    phone: "0477-2238630",
    mobile: "+919447738630",
    ndrfBattalion: "KSDMA Water Rescue Unit Alappuzha",
    ndrfPhone: "0477-2251100",
    cmoPhone: "0477-2251650"
  },
  "Kozhikode": {
    ddmaName: "DDMA Kozhikode / DEOC Control Room",
    phone: "0495-2371002",
    mobile: "+919447737002",
    ndrfBattalion: "SDRF Coastal & Hill Quick Reaction Team",
    ndrfPhone: "0495-2371405",
    cmoPhone: "0495-2371713"
  },

  // Assam
  "Dhemaji": {
    ddmaName: "DDMA Dhemaji / District Flood Control Cell",
    phone: "03753-224464",
    mobile: "+919435088210",
    ndrfBattalion: "NDRF 1st Battalion (Patgaon / Dhemaji Unit)",
    ndrfPhone: "+919435962225",
    cmoPhone: "03753-224250"
  },
  "Majuli": {
    ddmaName: "DDMA Majuli / River Island Emergency Unit",
    phone: "03775-274444",
    mobile: "+919435374444",
    ndrfBattalion: "SDRF Inland Water Rescue Post Garamur",
    ndrfPhone: "+919435962230",
    cmoPhone: "03775-274211"
  },
  "Kamrup Metropolitan": {
    ddmaName: "DDMA Kamrup Metro / Guwahati Emergency Cell",
    phone: "0361-2733052",
    mobile: "+919435012345",
    ndrfBattalion: "NDRF 1st Battalion Guwahati HQ",
    ndrfPhone: "0361-2849005",
    cmoPhone: "0361-2735100"
  },
  "Cachar": {
    ddmaName: "DDMA Cachar / Silchar Disaster Operation Cell",
    phone: "03842-245866",
    mobile: "+919435074215",
    ndrfBattalion: "SDRF Barak Valley Quick Rescue Unit",
    ndrfPhone: "+919435962240",
    cmoPhone: "03842-245220"
  },
  "Barpeta": {
    ddmaName: "DDMA Barpeta / Flood & Erosion Control",
    phone: "03665-252125",
    mobile: "+919435052125",
    ndrfBattalion: "SDRF Lower Assam Rescue Unit",
    ndrfPhone: "+919435962245",
    cmoPhone: "03665-252110"
  },

  // Odisha
  "Puri": {
    ddmaName: "DDMA Puri / Coastal Cyclone Emergency Cell",
    phone: "06752-223230",
    mobile: "+919437023230",
    ndrfBattalion: "NDRF 3rd Battalion / ODRAF Puri Unit",
    ndrfPhone: "06752-222100",
    cmoPhone: "06752-222045"
  },
  "Kendrapara": {
    ddmaName: "DDMA Kendrapara / Estuarine Disaster Control",
    phone: "06727-232803",
    mobile: "+919437032803",
    ndrfBattalion: "ODRAF Kendrapara Coastal Rapid Team",
    ndrfPhone: "06727-232101",
    cmoPhone: "06727-232014"
  },
  "Jagatsinghpur": {
    ddmaName: "DDMA Jagatsinghpur / Paradip Maritime Unit",
    phone: "06724-220368",
    mobile: "+919437020368",
    ndrfBattalion: "ODRAF Super Cyclone Response Unit",
    ndrfPhone: "06724-220101",
    cmoPhone: "06724-220025"
  },

  // Maharashtra
  "Raigad": {
    ddmaName: "DDMA Raigad / Alibaug Disaster Control Room",
    phone: "02141-222097",
    mobile: "+919422691234",
    ndrfBattalion: "NDRF 5th Battalion Pune / Raigad Team",
    ndrfPhone: "02141-222101",
    cmoPhone: "02141-222055"
  },
  "Pune": {
    ddmaName: "DDMA Pune / Collectorate Disaster Management",
    phone: "020-26123371",
    mobile: "+919422012371",
    ndrfBattalion: "NDRF 5th Battalion Talegaon Camp HQ",
    ndrfPhone: "02114-247000",
    cmoPhone: "020-26122485"
  },

  // Jharkhand
  "Dhanbad": {
    ddmaName: "DDMA Dhanbad / Subsidence & Mine Hazard Cell",
    phone: "0326-2312601",
    mobile: "+919431122601",
    ndrfBattalion: "BCCL & District Mine Rescue Emergency Team",
    ndrfPhone: "0326-2230101",
    cmoPhone: "0326-2311210"
  },
  "Ranchi": {
    ddmaName: "DDMA Ranchi / Disaster Control Room",
    phone: "0651-2214001",
    mobile: "+919431104001",
    ndrfBattalion: "NDRF 9th Battalion Ranchi Detachment",
    ndrfPhone: "0651-2400234",
    cmoPhone: "0651-2208035"
  },

  // Jammu & Kashmir
  "Anantnag": {
    ddmaName: "DDMA Anantnag / South Kashmir Disaster Cell",
    phone: "01932-222337",
    mobile: "+919419022337",
    ndrfBattalion: "SDRF 1st Battalion / Valley Mountain Rescue",
    ndrfPhone: "01932-223100",
    cmoPhone: "01932-222311"
  },
  "Srinagar": {
    ddmaName: "DDMA Srinagar / Jhelum Flood Control DEOC",
    phone: "0194-2452182",
    mobile: "+919419045218",
    ndrfBattalion: "SDRF Headquarters Srinagar",
    ndrfPhone: "0194-2455019",
    cmoPhone: "0194-2452243"
  }
};

/**
 * Resolves the top nearest authorities for a given village, alert, or location object
 * @param {Object} locationOrAlert - Village or Alert object containing state, district, name, coordinates
 * @returns {Array} List of sorted, prioritized authority contact cards
 */
export function getNearestAuthorities(locationOrAlert = {}) {
  const district = (locationOrAlert.district || "").trim();
  const state = (locationOrAlert.state || "").trim();
  const hazardType = (locationOrAlert.hazardType || locationOrAlert.type || "").toLowerCase();

  const authorities = [];

  // 1. Check for specific District Authority (DDMA / DEOC)
  let districtData = DISTRICT_AUTHORITIES[district];
  if (!districtData && district) {
    // Try fuzzy match on district name
    const foundKey = Object.keys(DISTRICT_AUTHORITIES).find(
      (k) => k.toLowerCase() === district.toLowerCase() || district.toLowerCase().includes(k.toLowerCase())
    );
    if (foundKey) districtData = DISTRICT_AUTHORITIES[foundKey];
  }

  if (districtData) {
    authorities.push({
      id: `ddma-${district.toLowerCase().replace(/\s+/g, "-")}`,
      name: districtData.ddmaName,
      department: "District Disaster Management Authority (DDMA)",
      phone: districtData.mobile || districtData.phone,
      landline: districtData.phone,
      type: "district_deoc",
      jurisdiction: `District Control Room (${district})`,
      available24x7: true,
      badge: "District DEOC",
      priority: 1,
      isNearest: true
    });

    if (districtData.ndrfBattalion) {
      authorities.push({
        id: `ndrf-${district.toLowerCase().replace(/\s+/g, "-")}`,
        name: districtData.ndrfBattalion,
        department: "Disaster Response Tactical Team",
        phone: districtData.ndrfPhone,
        type: "tactical_rescue",
        jurisdiction: `Local Rapid Response (${district})`,
        available24x7: true,
        badge: "NDRF / SDRF Unit",
        priority: 2,
        isNearest: true
      });
    }

    if (districtData.cmoPhone) {
      authorities.push({
        id: `medical-${district.toLowerCase().replace(/\s+/g, "-")}`,
        name: `Chief Medical Officer (CMO) Hospital Control`,
        department: `District Health & Trauma Services`,
        phone: districtData.cmoPhone,
        type: "medical",
        jurisdiction: `District Emergency Ward (${district})`,
        available24x7: true,
        badge: "District Hospital",
        priority: 4
      });
    }
  }

  // 2. Check for State SDMA / SEOC
  let stateData = STATE_SDMAS[state];
  if (!stateData && state) {
    const foundStateKey = Object.keys(STATE_SDMAS).find(
      (k) => k.toLowerCase() === state.toLowerCase() || state.toLowerCase().includes(k.toLowerCase())
    );
    if (foundStateKey) stateData = STATE_SDMAS[foundStateKey];
  }

  if (stateData) {
    authorities.push({
      id: `sdma-${state.toLowerCase().replace(/\s+/g, "-")}`,
      name: stateData.name,
      department: "State Emergency Operation Centre (SEOC)",
      phone: stateData.tollFree || stateData.seoc || stateData.phone,
      landline: stateData.phone,
      sdrf: stateData.sdrf,
      type: "state_sdma",
      jurisdiction: `State HQ (${stateData.headquarters})`,
      available24x7: true,
      badge: "State SEOC",
      priority: 3
    });
  }

  // 3. Always include Universal National Emergency (112)
  authorities.push({
    ...NATIONAL_HELPLINES.ERSS,
    phone: "112"
  });

  // 4. If Flood, Landslide or Cyclone alert, prioritize NDRF HQ if not already added
  const isSevere = hazardType.includes("flood") || hazardType.includes("cyclone") || hazardType.includes("landslide");
  if (isSevere && !authorities.some((a) => a.id.startsWith("ndrf"))) {
    authorities.push(NATIONAL_HELPLINES.NDRF);
  }

  // Ensure unique phone numbers and sort by priority
  const seenPhones = new Set();
  const uniqueList = [];
  for (const auth of authorities) {
    const cleanP = cleanPhoneNumber(auth.phone);
    if (!seenPhones.has(cleanP)) {
      seenPhones.add(cleanP);
      uniqueList.push(auth);
    }
  }

  return uniqueList.sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 5);
}

/**
 * Cleans phone number string removing hyphens, spaces, and brackets
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^\d+]/g, "");
}

/**
 * Generates an actionable, structured SOS SMS draft
 * Contains location, coordinates, hazard type, alert level, time-to-impact, and Google Maps pin
 */
export function generateEmergencySmsTemplate(authority, item = {}) {
  const villageName = item.name || item.village_name || item.villageName || item.title || "Target Habitation";
  const district = item.district || "Alert District";
  const state = item.state || "Alert State";
  const hazard = item.hazardType || item.type || item.hazard_type || "Disaster Event";
  const severity = (item.severity || item.risk_level || item.riskLevel || "CRITICAL").toUpperCase();
  const lat = item.lat || item.latitude || (item.coordinates ? item.coordinates[0] : null);
  const lng = item.lng || item.longitude || (item.coordinates ? item.coordinates[1] : null);
  const pop = item.population || item.population_at_risk || item.pop || "N/A";
  const timeToImpact = item.estimatedTimeToImpact?.timeWindowFormatted || item.timeToImpact || item.impactHorizon || "IMMEDIATE";

  const mapLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : "";

  return [
    `🚨 [SOS DISASTER ALERT] - URGENT ACTION REQUIRED`,
    `TO: ${authority?.name || "Emergency Response Authority"}`,
    `HAZARD: ${hazard.toUpperCase()} (${severity} ALERT)`,
    `LOCATION: ${villageName}, Dist: ${district}, State: ${state}`,
    lat && lng ? `GPS COORD: ${lat.toFixed ? lat.toFixed(5) : lat}, ${lng.toFixed ? lng.toFixed(5) : lng}` : null,
    mapLink ? `MAP PIN: ${mapLink}` : null,
    `EST. TIME-TO-IMPACT: ${timeToImpact}`,
    pop !== "N/A" ? `POPULATION AT RISK: ~${pop} residents` : null,
    `STATUS: Threat imminent under prevailing circumstances. Please dispatch nearest rescue, evacuation & medical team urgently.`
  ].filter(Boolean).join("\n");
}

/**
 * Creates cross-platform SMS URI with automatic OS compatibility
 * iOS requires '&body=' while Android/RFC standard uses '?body='
 */
export function getSmsUri(phone, message) {
  const clean = cleanPhoneNumber(phone);
  const encodedBody = encodeURIComponent(message || "");
  
  // Detect iOS browser
  const isIOS = typeof navigator !== "undefined" && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent || "") || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const separator = isIOS ? "&body=" : "?body=";
  return `sms:${clean}${separator}${encodedBody}`;
}

/**
 * Creates telephone dialer URI
 */
export function getCallUri(phone) {
  const clean = cleanPhoneNumber(phone);
  return `tel:${clean}`;
}

/**
 * Copies text to clipboard with fallback
 */
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(el);
    return successful;
  } catch {
    return false;
  }
}
