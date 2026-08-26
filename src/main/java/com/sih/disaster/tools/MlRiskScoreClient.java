package com.sih.disaster.tools;

import com.sih.disaster.dto.request.RiskScoreRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * The ONLY class in this project that calls Jenam's ML service directly.
 */
@Component
@Slf4j
public class MlRiskScoreClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ml.base-url}")
    private String riskScoresUrl;

    public List<RiskScoreRequest> fetchRiskScores() {
        try {
            RiskScoreRequest[] scores = restTemplate.getForObject(riskScoresUrl, RiskScoreRequest[].class);
            return scores != null ? Arrays.asList(scores) : Collections.emptyList();
        } catch (Exception e) {
            log.error("Could not reach ML service at {}: {}", riskScoresUrl, e.getMessage());
            return Collections.emptyList();
        }
    }
}