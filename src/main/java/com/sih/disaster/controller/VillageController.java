package com.sih.disaster.controller;

import com.sih.disaster.dto.request.VillageUploadRequest;
import com.sih.disaster.dto.response.VillageDetailResponse;
import com.sih.disaster.dto.response.VillageResponse;
import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
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
@RequestMapping("/api/villages")
@RequiredArgsConstructor
public class VillageController {

    private final VillageService villageService;

    @GetMapping
    public ResponseEntity<Page<VillageResponse>> list(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) RiskLevel riskLevel,
            @RequestParam(required = false) PriorityLevel priority,
            Pageable pageable) {
        return ResponseEntity.ok(villageService.search(district, riskLevel, priority, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VillageDetailResponse> getOne(@PathVariable String id) {
        return ResponseEntity.ok(villageService.getDetail(id));
    }

    /** FR-2.2 bulk upload from Karan's processed GeoJSON. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VillageResponse>> create(@Valid @RequestBody List<VillageUploadRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(villageService.createBatch(requests));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VillageResponse> update(@PathVariable String id,
                                                    @Valid @RequestBody VillageUploadRequest request) {
        return ResponseEntity.ok(villageService.update(id, request));
    }

    /** FR-2.5 - completes CRUD (not itemized in SRS 5.2's table but required by the FR text). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        villageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
