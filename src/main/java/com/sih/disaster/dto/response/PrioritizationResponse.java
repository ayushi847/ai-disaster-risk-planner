package com.sih.disaster.dto.response;

import com.sih.disaster.entity.PrioritizationResult;
import com.sih.disaster.enums.PriorityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrioritizationResponse {
    private Long id;
    private String villageId;
    private PriorityLevel priorityLevel;
    private String recommendedSiteId;
    private String capacityNotes;
    private Instant computedAt;

    public static PrioritizationResponse from(PrioritizationResult p) {
        return PrioritizationResponse.builder()
                .id(p.getId())
                .villageId(p.getVillage().getId())
                .priorityLevel(p.getPriorityLevel())
                .recommendedSiteId(p.getRecommendedSite() != null ? p.getRecommendedSite().getId() : null)
                .capacityNotes(p.getCapacityNotes())
                .computedAt(p.getComputedAt())
                .build();
    }
}
