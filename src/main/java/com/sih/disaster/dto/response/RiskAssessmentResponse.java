package com.sih.disaster.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.sih.disaster.entity.RiskAssessment;
import com.sih.disaster.enums.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentResponse {
    private Long id;
    private String villageId;
    private Double score;
    private RiskLevel riskLevel;
    private JsonNode factors;
    private Double confidence;
    private Instant computedAt;

    public static RiskAssessmentResponse from(RiskAssessment r) {
        return RiskAssessmentResponse.builder()
                .id(r.getId())
                .villageId(r.getVillage().getId())
                .score(r.getScore())
                .riskLevel(r.getRiskLevel())
                .factors(r.getFactors())
                .confidence(r.getConfidence())
                .computedAt(r.getComputedAt())
                .build();
    }
}
