package com.sih.disaster.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskFactors {
    private Double hazardIntensity;
    private Double populationDensity;
    private Double disasterHistory;
}
