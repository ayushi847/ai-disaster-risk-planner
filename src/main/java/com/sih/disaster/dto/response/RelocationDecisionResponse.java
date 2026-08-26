package com.sih.disaster.dto.response;

import com.sih.disaster.entity.RelocationDecision;
import com.sih.disaster.enums.DecisionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelocationDecisionResponse {
    private Long id;
    private String villageId;
    private String siteId;
    private DecisionStatus status;
    private Long decidedByUserId;
    private String decidedByName;
    private Instant decidedAt;
    private String overrideReason;
    private Instant createdAt;

    public static RelocationDecisionResponse from(RelocationDecision d) {
        return RelocationDecisionResponse.builder()
                .id(d.getId())
                .villageId(d.getVillage().getId())
                .siteId(d.getSite() != null ? d.getSite().getId() : null)
                .status(d.getStatus())
                .decidedByUserId(d.getDecidedBy() != null ? d.getDecidedBy().getId() : null)
                .decidedByName(d.getDecidedBy() != null ? d.getDecidedBy().getName() : null)
                .decidedAt(d.getDecidedAt())
                .overrideReason(d.getOverrideReason())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
