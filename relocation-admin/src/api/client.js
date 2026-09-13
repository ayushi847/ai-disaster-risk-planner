const BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Error simulation toggle (preserved for UI testing)
let shouldSimulateError = false;
export const setSimulateError = (val) => { shouldSimulateError = val; };

function maybeThrow() {
  if (shouldSimulateError) {
    throw new Error('Simulated network error');
  }
}

// Helper to construct authorization and content headers
function getHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Local registry mapping site IDs to districts (backend stores spatial point data instead of text)
const SITE_DISTRICTS = {
  s1: 'Rudraprayag',
  s2: 'Chamoli',
  s3: 'Ramban',
};

// Helper function to enrich backend relocation decision responses with village details
async function enrichDecision(decision) {
  try {
    const village = await getVillageById(decision.villageId);
    return {
      ...decision,
      district: village.district,
      riskLevel: village.riskLevel,
      priorityLevel: village.priorityLevel,
      decidedBy: decision.decidedByName || decision.decidedByUserId || null,
    };
  } catch (e) {
    console.error(`Failed to enrich decision ${decision.id} for village ${decision.villageId}:`, e);
    return {
      ...decision,
      district: 'Unknown',
      riskLevel: 'LOW',
      priorityLevel: 'MEDIUM_TERM',
      decidedBy: decision.decidedByName || decision.decidedByUserId || null,
    };
  }
}

export async function login(email, password) {
  maybeThrow();
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Invalid credentials');
  }
  const data = await response.json(); // AuthResponse: { token, tokenType, user }
  return { token: data.token, user: data.user };
}

export async function getCurrentUser(token) {
  maybeThrow();
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Invalid token');
  }
  const user = await response.json(); // UserResponse: { id, name, email, role }
  return user;
}

export async function getDecisions() {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-decisions?size=100`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch decisions: ${response.statusText}`);
  }
  const data = await response.json();
  const content = data.content || data;
  const enriched = await Promise.all(content.map(enrichDecision));
  return enriched;
}

export async function getDecisionById(id) {
  maybeThrow();
  const decisions = await getDecisions();
  const decision = decisions.find(d => String(d.id) === String(id));
  if (!decision) {
    throw new Error('Decision not found');
  }
  return decision;
}

export async function approveDecision(id) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-decisions/${id}/approve`, {
    method: 'PUT',
    headers,
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to approve decision');
  }
  const updated = await response.json(); // RelocationDecisionResponse
  return enrichDecision(updated);
}

export async function overrideDecision(id, { siteId, overrideReason }) {
  maybeThrow();
  if (!overrideReason?.trim()) {
    throw new Error('Override reason is required');
  }
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-decisions/${id}/override`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ siteId, overrideReason }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to override decision');
  }
  const updated = await response.json(); // RelocationDecisionResponse
  return enrichDecision(updated);
}

export async function getVillageById(id) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/villages/${id}`, { headers });
  if (!response.ok) {
    throw new Error('Village not found');
  }
  const data = await response.json(); // VillageDetailResponse: { village, ... }
  return data.village;
}

export async function getSiteCapacity(id) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-sites/${id}/capacity`, { headers });
  if (!response.ok) {
    throw new Error('Site not found');
  }
  const site = await response.json(); // RelocationSiteResponse
  return {
    ...site,
    district: site.district || SITE_DISTRICTS[id] || 'Unknown',
  };
}

export async function getAuditLogs() {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/audit-logs?size=100`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }
  const data = await response.json();
  const content = data.content || data;
  return content.map(log => ({ ...log }));
}

export async function getRelocationSites() {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-sites?size=100`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch relocation sites');
  }
  const data = await response.json();
  return data.content || data;
}

export async function rejectDecision(id) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-decisions/${id}/reject`, {
    method: 'PUT',
    headers,
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to reject decision');
  }
  const updated = await response.json();
  return enrichDecision(updated);
}

export async function getDashboardSummary() {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/dashboard/summary`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }
  return await response.json();
}

export async function getVillages(page = 0, size = 100) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/villages?page=${page}&size=${size}`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch villages');
  }
  const data = await response.json();
  return data.content || data;
}

export async function getHazardZones() {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/hazard-zones?size=100`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch hazard zones');
  }
  const data = await response.json();
  return data.content || data;
}

export async function getNearbySites(villageId, radiusKm = 50) {
  maybeThrow();
  const headers = getHeaders();
  const response = await fetch(`${BASE_URL}/api/relocation-sites/near/${villageId}?radiusKm=${radiusKm}`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch nearby sites');
  }
  return await response.json();
}

export function resetDecisions() {
  // No-op for real backend integration
}