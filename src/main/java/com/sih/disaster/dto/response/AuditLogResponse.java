package com.sih.disaster.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.sih.disaster.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private String entity;
    private String entityId;
    private String action;
    private Long actorId;
    private String actorName;
    private Instant timestamp;
    private JsonNode beforeState;
    private JsonNode afterState;

    public static AuditLogResponse from(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .entity(a.getEntity())
                .entityId(a.getEntityId())
                .action(a.getAction())
                .actorId(a.getActor() != null ? a.getActor().getId() : null)
                .actorName(a.getActor() != null ? a.getActor().getName() : null)
                .timestamp(a.getTimestamp())
                .beforeState(a.getBeforeState())
                .afterState(a.getAfterState())
                .build();
    }
}
