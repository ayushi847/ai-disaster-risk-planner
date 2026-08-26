package com.sih.disaster.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.sih.disaster.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * Historical record of every risk score computed for a village.
 * Written exclusively from Jenam's ML service via POST /api/risk-scores.
 * The backend never computes score/riskLevel itself (see SRS 10.4).
 */
@Entity
@Table(name = "risk_assessment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(nullable = false)
    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RiskLevel riskLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "factors_json", columnDefinition = "jsonb")
    private JsonNode factors;

    private Double confidence;

    @Column(nullable = false)
    private Instant computedAt;

    @PrePersist
    void onCreate() {
        if (computedAt == null) {
            computedAt = Instant.now();
        }
    }
}
