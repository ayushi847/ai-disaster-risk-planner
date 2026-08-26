package com.sih.disaster.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.disaster.dto.response.AuditLogResponse;
import com.sih.disaster.entity.AppUser;
import com.sih.disaster.entity.AuditLog;
import com.sih.disaster.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * FR-6.3 - Every decision (auto or manual) is recorded in an immutable
 * audit log with actor, timestamp, and prior state. This service is the
 * ONLY writer of AuditLog rows; no controller/repository exposes update
 * or delete for this entity (SRS 10.8, NFR "Auditability").
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void record(String entity, String entityId, String action, AppUser actor, Object before, Object after) {
        AuditLog log = AuditLog.builder()
                .entity(entity)
                .entityId(entityId)
                .action(action)
                .actor(actor)
                .timestamp(Instant.now())
                .beforeState(toJson(before))
                .afterState(toJson(after))
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLogResponse> search(String entity, Long actorId, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.search(entity, actorId, from, to, pageable).map(AuditLogResponse::from);
    }

    private JsonNode toJson(Object value) {
        return value == null ? null : objectMapper.valueToTree(value);
    }
}
