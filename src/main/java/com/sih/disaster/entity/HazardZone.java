package com.sih.disaster.entity;

import com.sih.disaster.enums.HazardType;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Polygon;

import java.time.Instant;

@Entity
@Table(name = "hazard_zone")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HazardZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HazardType hazardType;

    @Column(nullable = false)
    private Double intensity; // 0.0 - 1.0

    private String source;

    private Instant recordedAt;

    @Column(nullable = false, columnDefinition = "geometry(Polygon,4326)")
    private Polygon geometry;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
