package com.sih.disaster.service;

import com.sih.disaster.dto.request.PrioritizationRequest;
import com.sih.disaster.dto.response.PrioritizationResponse;
import com.sih.disaster.entity.PrioritizationResult;
import com.sih.disaster.entity.RelocationSite;
import com.sih.disaster.entity.Village;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.PrioritizationResultRepository;
import com.sih.disaster.repository.RelocationSiteRepository;
import com.sih.disaster.repository.VillageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * FR-2.7 - Owner: Purwansh, consumed from Tanmay's Decision & Capacity
 * module (POST /api/prioritization). Depends on risk scores and
 * relocation-site capacity already being in the DB (SRS section 8).
 */
@Service
@RequiredArgsConstructor
public class PrioritizationService {

    private final VillageRepository villageRepository;
    private final PrioritizationResultRepository prioritizationResultRepository;
    private final RelocationSiteRepository relocationSiteRepository;

    @Transactional
    public PrioritizationResponse ingest(PrioritizationRequest req) {
        Village village = villageRepository.findById(req.getVillageId())
                .orElseThrow(() -> new ResourceNotFoundException("Village not found: " + req.getVillageId()));

        RelocationSite recommendedSite = null;
        if (req.getRecommendedSiteId() != null && !req.getRecommendedSiteId().isBlank()) {
            recommendedSite = relocationSiteRepository.findById(req.getRecommendedSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Relocation site not found: " + req.getRecommendedSiteId()));
        }

        PrioritizationResult entity = PrioritizationResult.builder()
                .village(village)
                .priorityLevel(req.getPriorityLevel())
                .recommendedSite(recommendedSite)
                .capacityNotes(req.getCapacityNotes())
                .computedAt(req.getComputedAt() != null ? req.getComputedAt() : Instant.now())
                .build();
        PrioritizationResult saved = prioritizationResultRepository.save(entity);

        // Denormalized copy on Village for fast dashboard reads.
        village.setPriorityLevel(req.getPriorityLevel());
        villageRepository.save(village);

        return PrioritizationResponse.from(saved);
    }

    public PrioritizationResponse getCurrent(String villageId) {
        return prioritizationResultRepository.findFirstByVillageIdOrderByComputedAtDesc(villageId)
                .map(PrioritizationResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No prioritization result yet for village: " + villageId));
    }
}
