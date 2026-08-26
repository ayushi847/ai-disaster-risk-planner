package com.sih.disaster.dto.response;

import com.sih.disaster.entity.Village;
import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Geometry;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VillageResponse {
    private String id;
    private String name;
    private String district;
    private String state;
    private Integer population;
    private Geometry geometry;
    private Double riskScore;
    private RiskLevel riskLevel;
    private PriorityLevel priorityLevel;
    private Instant updatedAt;

    public static VillageResponse from(Village v) {
        return VillageResponse.builder()
                .id(v.getId())
                .name(v.getName())
                .district(v.getDistrict())
                .state(v.getState())
                .population(v.getPopulation())
                .geometry(v.getGeometry())
                .riskScore(v.getRiskScore())
                .riskLevel(v.getRiskLevel())
                .priorityLevel(v.getPriorityLevel())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
