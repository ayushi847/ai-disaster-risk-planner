package com.sih.disaster.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.locationtech.jts.geom.Point;

/**
 * Bound at POST /api/relocation-sites. Owner: Karan/Tanmay -> Purwansh.
 */
@Data
public class RelocationSiteUploadRequest {

    private String id;

    @NotBlank
    private String name;

    @NotNull
    @Min(0)
    private Integer capacityTotal;

    private JsonNode resources;

    @NotNull
    private Point geometry;
}
