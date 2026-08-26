package com.sih.disaster.dto.request;

import com.sih.disaster.enums.PriorityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

/**
 * Bound at POST /api/prioritization. Owner: Tanmay -> Purwansh.
 */
@Data
public class PrioritizationRequest {

    @NotBlank
    private String villageId;

    @NotNull
    private PriorityLevel priorityLevel;

    private String recommendedSiteId;

    private String capacityNotes;

    private Instant computedAt;
}
