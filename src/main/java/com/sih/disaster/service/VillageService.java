package com.sih.disaster.service;

import com.sih.disaster.dto.request.VillageUploadRequest;
import com.sih.disaster.dto.response.*;
import com.sih.disaster.entity.PrioritizationResult;
import com.sih.disaster.entity.RiskAssessment;
import com.sih.disaster.entity.Village;
import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Owner: Purwansh (FR-2.1, FR-2.2, FR-2.5). Handles Karan's bulk GIS upload
 * and the read/CRUD surface consumed by Ayushi's dashboard.
 */
@Service
@RequiredArgsConstructor
public class VillageService {

    private final VillageRepository villageRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final PrioritizationResultRepository prioritizationResultRepository;
    private final RelocationSiteRepository relocationSiteRepository;

    private static final double DEFAULT_NEAREST_SITE_RADIUS_METERS = 50_000; // 50 km

    @Transactional
    public VillageResponse create(VillageUploadRequest req) {
        String id = (req.getId() != null && !req.getId().isBlank())
                ? req.getId()
                : "VLG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Village village = Village.builder()
                .id(id)
                .name(req.getName())
                .district(req.getDistrict())
                .state(req.getState())
                .population(req.getPopulation())
                .geometry(req.getGeometry())
                .build();

        return VillageResponse.from(villageRepository.save(village));
    }

    /** FR-2.2 bulk upload - each record validated independently via the same DTO contract. */
    @Transactional
    public List<VillageResponse> createBatch(List<VillageUploadRequest> requests) {
        return requests.stream().map(this::create).toList();
    }

    @Transactional
    public VillageResponse update(String id, VillageUploadRequest req) {
        Village village = getOrThrow(id);
        village.setName(req.getName());
        village.setDistrict(req.getDistrict());
        village.setState(req.getState());
        village.setPopulation(req.getPopulation());
        if (req.getGeometry() != null) {
            village.setGeometry(req.getGeometry());
        }
        return VillageResponse.from(villageRepository.save(village));
    }

    public Page<VillageResponse> search(String district, RiskLevel riskLevel, PriorityLevel priorityLevel, Pageable pageable) {
        return villageRepository.search(district, riskLevel, priorityLevel, pageable)
                .map(VillageResponse::from);
    }

    /** GET /api/villages/{id} - full detail incl. latest score, priority, nearest site (FR-5.4). */
    public VillageDetailResponse getDetail(String id) {
        Village village = getOrThrow(id);

        RiskAssessmentResponse latestRisk = riskAssessmentRepository
                .findFirstByVillageIdOrderByComputedAtDesc(id)
                .map(RiskAssessmentResponse::from)
                .orElse(null);

        PrioritizationResponse latestPriority = prioritizationResultRepository
                .findFirstByVillageIdOrderByComputedAtDesc(id)
                .map(PrioritizationResponse::from)
                .orElse(null);

        RelocationSiteResponse nearestSite = null;
        Double nearestDistance = null;
        List<RelocationSiteRepository.SiteDistanceProjection> nearby =
                relocationSiteRepository.findSiteIdsNearVillage(id, DEFAULT_NEAREST_SITE_RADIUS_METERS);
        if (!nearby.isEmpty()) {
            var closest = nearby.get(0);
            nearestSite = relocationSiteRepository.findById(closest.getId())
                    .map(RelocationSiteResponse::from)
                    .orElse(null);
            nearestDistance = closest.getDistanceKm();
        }

        return VillageDetailResponse.builder()
                .village(VillageResponse.from(village))
                .latestRiskAssessment(latestRisk)
                .latestPrioritization(latestPriority)
                .nearestSite(nearestSite)
                .nearestSiteDistanceKm(nearestDistance)
                .build();
    }

    /** FR-2.3 - villages intersecting a hazard zone (ST_Intersects). */
    public List<VillageResponse> findIntersectingHazardZone(Long hazardZoneId) {
        return villageRepository.findVillagesIntersectingHazardZone(hazardZoneId).stream()
                .map(VillageResponse::from)
                .toList();
    }

    /** FR-2.5 - completes CRUD. Cascades to risk_assessment/prioritization_result via FK ON DELETE CASCADE. */
    @Transactional
    public void delete(String id) {
        Village village = getOrThrow(id);
        villageRepository.delete(village);
    }

    Village getOrThrow(String id) {
        return villageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Village not found: " + id));
    }
}
