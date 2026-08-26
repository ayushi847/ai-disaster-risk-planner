package com.sih.disaster.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.sih.disaster.entity.RelocationSite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelocationSiteResponse {
    private String id;
    private String name;
    private Integer capacityTotal;
    private Integer capacityUsed;
    private Integer remainingCapacity;
    private boolean overCapacity;
    private JsonNode resources;
    private Point geometry;
    /** Only populated by proximity endpoints (ST_DWithin); never persisted. */
    private Double distanceKm;

    public static RelocationSiteResponse from(RelocationSite s) {
        return RelocationSiteResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .capacityTotal(s.getCapacityTotal())
                .capacityUsed(s.getCapacityUsed())
                .remainingCapacity(s.remainingCapacity())
                .overCapacity(s.isOverCapacity())
                .resources(s.getResources())
                .geometry(s.getGeometry())
                .build();
    }
}
