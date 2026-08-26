package com.sih.disaster.dto.request;

import lombok.Data;

/**
 * Bound at PUT /api/relocation-decisions/{id}/approve. Optional - the
 * admin may confirm the AI-recommended site as-is, or approve a specific one.
 */
@Data
public class DecisionApproveRequest {
    private String siteId;
}
