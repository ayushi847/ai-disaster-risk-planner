package com.sih.disaster.dto.request;

import com.sih.disaster.enums.HazardType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.locationtech.jts.geom.Polygon;

import java.time.Instant;

/**
 * Bound at POST /api/hazard-zones. Owner: Karan -> Purwansh.
 */
@Data
public class HazardZoneUploadRequest {

    @NotNull
    private HazardType hazardType;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double intensity;

    private String source;

    private Instant recordedAt;

    @NotNull
    private Polygon geometry;
}
