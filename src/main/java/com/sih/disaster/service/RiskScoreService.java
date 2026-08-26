package com.sih.disaster.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.disaster.dto.request.RiskScoreRequest;
import com.sih.disaster.dto.response.RiskAssessmentResponse;
import com.sih.disaster.entity.RiskAssessment;
import com.sih.disaster.entity.Village;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.RiskAssessmentRepository;
import com.sih.disaster.repository.VillageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * FR-2.6 - Owner: Purwansh, consumed from Jenam's ML service
 * (POST /api/risk-scores). The backend never computes score/riskLevel
 * itself; it only persists what Jenam's model produces (SRS 10.4) and
 * denormalizes the latest value onto Village for fast dashboard reads.
 */
@Service
@RequiredArgsConstructor
public class RiskScoreService {

    private final VillageRepository villageRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public RiskAssessmentResponse ingest(RiskScoreRequest req) {
        Village village = villageRepository.findById(req.getVillageId())
                .orElseThrow(() -> new ResourceNotFoundException("Village not found: " + req.getVillageId()));

        RiskAssessment entity = RiskAssessment.builder()
                .village(village)
                .score(req.getScore())
                .riskLevel(req.getRiskLevel())
                .factors(req.getFactors() != null ? objectMapper.valueToTree(req.getFactors()) : null)
                .confidence(req.getConfidence())
                .computedAt(req.getComputedAt() != null ? req.getComputedAt() : Instant.now())
                .build();
        RiskAssessment saved = riskAssessmentRepository.save(entity);

        // Denormalized copy on Village for fast dashboard reads (SRS 9.7 pattern).
        village.setRiskScore(req.getScore());
        village.setRiskLevel(req.getRiskLevel());
        villageRepository.save(village);

        return RiskAssessmentResponse.from(saved);
    }

    @Transactional
    public List<RiskAssessmentResponse> ingestBatch(List<RiskScoreRequest> requests) {
        return requests.stream().map(this::ingest).toList();
    }

    public List<RiskAssessmentResponse> history(String villageId) {
        return riskAssessmentRepository.findHistoryForVillage(villageId).stream()
                .map(RiskAssessmentResponse::from)
                .toList();
    }
}
