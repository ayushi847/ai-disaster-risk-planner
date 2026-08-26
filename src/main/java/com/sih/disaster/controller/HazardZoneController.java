package com.sih.disaster.controller;

import com.sih.disaster.dto.request.HazardZoneUploadRequest;
import com.sih.disaster.dto.response.HazardZoneResponse;
import com.sih.disaster.dto.response.VillageResponse;
import com.sih.disaster.enums.HazardType;
import com.sih.disaster.service.HazardZoneService;
import com.sih.disaster.service.VillageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** SRS 5.2. */
@RestController
@RequestMapping("/api/hazard-zones")
@RequiredArgsConstructor
public class HazardZoneController {

    private final HazardZoneService hazardZoneService;
    private final VillageService villageService;

    @GetMapping
    public ResponseEntity<Page<HazardZoneResponse>> list(@RequestParam(required = false) HazardType type,
                                                           Pageable pageable) {
        return ResponseEntity.ok(hazardZoneService.search(type, pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HazardZoneResponse>> create(@Valid @RequestBody List<HazardZoneUploadRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hazardZoneService.createBatch(requests));
    }

    /** FR-2.3 - spatial intersection (ST_Intersects). */
    @GetMapping("/{id}/villages")
    public ResponseEntity<List<VillageResponse>> villagesIntersecting(@PathVariable Long id) {
        return ResponseEntity.ok(villageService.findIntersectingHazardZone(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HazardZoneResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(hazardZoneService.getOne(id));
    }

    /** FR-2.5 - completes CRUD (not itemized in SRS 5.2's table but required by the FR text). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hazardZoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
