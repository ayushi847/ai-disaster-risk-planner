package com.sih.disaster.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.sih.disaster.enums.RiskLevel;
import lombok.Data;

import java.time.Instant;

/**
 * Bound at POST /api/risk-scores. Owner: Jenam -> Purwansh. Mirrors SRS 5.7.
 */
@Data
public class RiskScoreRequest {

    @NotBlank
    private String villageId;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double score;

    @NotNull
    private RiskLevel riskLevel;

    @Valid
    private RiskFactors factors;

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double confidence;

    private Instant computedAt;
}
