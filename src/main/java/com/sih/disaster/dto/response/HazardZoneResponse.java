package com.sih.disaster.dto.response;

import com.sih.disaster.entity.HazardZone;
import com.sih.disaster.enums.HazardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Polygon;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HazardZoneResponse {
    private Long id;
    private HazardType hazardType;
    private Double intensity;
    private String source;
    private Instant recordedAt;
    private Polygon geometry;

    public static HazardZoneResponse from(HazardZone h) {
        return HazardZoneResponse.builder()
                .id(h.getId())
                .hazardType(h.getHazardType())
                .intensity(h.getIntensity())
                .source(h.getSource())
                .recordedAt(h.getRecordedAt())
                .geometry(h.getGeometry())
                .build();
    }
}
