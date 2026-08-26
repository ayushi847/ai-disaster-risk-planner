package com.sih.disaster.entity;

import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Geometry;

import java.time.Instant;

/**
 * Core spatial entity. geometry may be a Point or a Polygon depending on
 * what Karan's GIS pipeline hands off for a given village.
 *
 * riskScore/riskLevel/priorityLevel are DENORMALIZED copies of the latest
 * RiskAssessment / PrioritizationResult, kept here purely so the dashboard
 * (GET /api/villages) can render in one query instead of N+1 joins.
 * The source of truth for history is risk_assessment / prioritization_result.
 */
@Entity
@Table(name = "village")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Village {

    @Id
    @Column(length = 30)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 150)
    private String district;

    @Column(length = 150)
    private String state;

    private Integer population;

    @Column(nullable = false, columnDefinition = "geometry(Geometry,4326)")
    private Geometry geometry;

    // --- denormalized, written only by RiskScoreService / PrioritizationService ---
    private Double riskScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", length = 15)
    private PriorityLevel priorityLevel;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
