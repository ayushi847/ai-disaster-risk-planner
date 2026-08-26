package com.sih.disaster.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Bound at PUT /api/relocation-decisions/{id}/override. overrideReason is
 * mandatory so every override is self-explaining in the audit log (SRS 9.5).
 */
@Data
public class DecisionOverrideRequest {

    @NotBlank
    private String siteId;

    @NotBlank
    private String overrideReason;
}
