package com.sih.disaster.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.locationtech.jts.geom.Geometry;

/**
 * Bound at POST /api/villages. Owner: Karan -> Purwansh (admin-only upload,
 * never called by the public frontend - SRS 10.1).
 */
@Data
public class VillageUploadRequest {

    /** Optional - if omitted the backend generates one (e.g. VLG-xxxx). */
    private String id;

    @NotBlank
    private String name;

    private String district;

    private String state;

    @NotNull
    @Min(0)
    private Integer population;

    @NotNull
    private Geometry geometry;
}
