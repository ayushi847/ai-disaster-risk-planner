package com.sih.disaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * GET /api/dashboard/summary - FR-2.9: aggregated counts to minimize
 * frontend round-trips.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private long totalVillages;
    private Map<String, Long> villagesByRiskLevel;
    private Map<String, Long> villagesByPriorityLevel;
    private long totalRelocationSites;
    private long sitesOverCapacity;
    private Map<String, Long> decisionsByStatus;
    private long pendingDecisions;
}
