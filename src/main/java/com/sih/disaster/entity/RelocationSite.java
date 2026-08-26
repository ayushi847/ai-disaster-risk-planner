package com.sih.disaster.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "relocation_site")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelocationSite {

    @Id
    @Column(length = 30)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private Integer capacityTotal;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacityUsed = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resources_json", columnDefinition = "jsonb")
    private JsonNode resources;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geometry;

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

    @Transient
    public boolean isOverCapacity() {
        return capacityUsed != null && capacityTotal != null && capacityUsed > capacityTotal;
    }

    @Transient
    public int remainingCapacity() {
        if (capacityTotal == null) return 0;
        return capacityTotal - (capacityUsed == null ? 0 : capacityUsed);
    }
}
