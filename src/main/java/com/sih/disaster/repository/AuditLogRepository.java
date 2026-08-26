package com.sih.disaster.repository;

import com.sih.disaster.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Append-only - intentionally exposes no update/delete methods. Filterable
 * by entity/actor/date per FR-6.3 and GET /api/audit-logs.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:entity IS NULL OR a.entity = :entity)
              AND (:actorId IS NULL OR a.actor.id = :actorId)
              AND (:from IS NULL OR a.timestamp >= :from)
              AND (:to IS NULL OR a.timestamp <= :to)
            ORDER BY a.timestamp DESC
            """)
    Page<AuditLog> search(@Param("entity") String entity,
                           @Param("actorId") Long actorId,
                           @Param("from") java.time.Instant from,
                           @Param("to") java.time.Instant to,
                           Pageable pageable);
}
