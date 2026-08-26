package com.sih.disaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GET /api/villages/{id} - village plus its latest risk score and nearest
 * relocation site, per FR-5.4 (dashboard detail panel).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VillageDetailResponse {
    private VillageResponse village;
    private RiskAssessmentResponse latestRiskAssessment;
    private PrioritizationResponse latestPrioritization;
    private RelocationSiteResponse nearestSite;
    private Double nearestSiteDistanceKm;
}
