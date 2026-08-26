package com.sih.disaster.entity;

import com.sih.disaster.enums.PriorityLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Historical record of every prioritization computed for a village.
 * Written exclusively from Tanmay's Decision & Capacity module
 * via POST /api/prioritization (SRS 10.5).
 */
@Entity
@Table(name = "prioritization_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrioritizationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private PriorityLevel priorityLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_site_id")
    private RelocationSite recommendedSite;

    @Column(columnDefinition = "text")
    private String capacityNotes;

    @Column(nullable = false)
    private Instant computedAt;

    @PrePersist
    void onCreate() {
        if (computedAt == null) {
            computedAt = Instant.now();
        }
    }
}
