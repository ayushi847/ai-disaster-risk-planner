package com.sih.disaster.service;

import com.sih.disaster.dto.request.HazardZoneUploadRequest;
import com.sih.disaster.dto.response.HazardZoneResponse;
import com.sih.disaster.entity.HazardZone;
import com.sih.disaster.enums.HazardType;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.HazardZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Owner: Purwansh (FR-2.1, FR-2.2). Ingests Karan's hazard zone polygons. */
@Service
@RequiredArgsConstructor
public class HazardZoneService {

    private final HazardZoneRepository hazardZoneRepository;

    @Transactional
    public HazardZoneResponse create(HazardZoneUploadRequest req) {
        HazardZone zone = HazardZone.builder()
                .hazardType(req.getHazardType())
                .intensity(req.getIntensity())
                .source(req.getSource())
                .recordedAt(req.getRecordedAt())
                .geometry(req.getGeometry())
                .build();
        return HazardZoneResponse.from(hazardZoneRepository.save(zone));
    }

    @Transactional
    public List<HazardZoneResponse> createBatch(List<HazardZoneUploadRequest> requests) {
        return requests.stream().map(this::create).toList();
    }

    public Page<HazardZoneResponse> search(HazardType type, Pageable pageable) {
        Page<HazardZone> page = (type != null)
                ? hazardZoneRepository.findByHazardType(type, pageable)
                : hazardZoneRepository.findAll(pageable);
        return page.map(HazardZoneResponse::from);
    }

    public HazardZoneResponse getOne(Long id) {
        return HazardZoneResponse.from(getOrThrow(id));
    }

    /** FR-2.5 - completes CRUD. */
    @Transactional
    public void delete(Long id) {
        HazardZone zone = getOrThrow(id);
        hazardZoneRepository.delete(zone);
    }

    HazardZone getOrThrow(Long id) {
        return hazardZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hazard zone not found: " + id));
    }
}
