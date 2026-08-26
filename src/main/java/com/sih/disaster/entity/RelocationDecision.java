package com.sih.disaster.entity;

import com.sih.disaster.enums.DecisionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * villageId / recommendedSiteId (initial) are system-created from the
 * AI/prioritization output. status + overrideReason come from Mrinal's
 * admin panel. decidedBy/decidedAt are ALWAYS set server-side from the
 * authenticated JWT subject + server clock - never trust a client value
 * for these two fields (SRS 10.6 / 10.9).
 */
@Entity
@Table(name = "relocation_decision")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelocationDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private RelocationSite site;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private DecisionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private AppUser decidedBy;

    private Instant decidedAt;

    @Column(columnDefinition = "text")
    private String overrideReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
