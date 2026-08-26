package com.sih.disaster.controller;

import com.sih.disaster.dto.request.RelocationSiteUploadRequest;
import com.sih.disaster.dto.response.RelocationSiteResponse;
import com.sih.disaster.service.RelocationSiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** SRS 5.2 + 5.4. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RelocationSiteController {

    private final RelocationSiteService relocationSiteService;

    @GetMapping("/relocation-sites")
    public ResponseEntity<Page<RelocationSiteResponse>> list(Pageable pageable) {
        return ResponseEntity.ok(relocationSiteService.list(pageable));
    }

    @PostMapping("/relocation-sites")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelocationSiteResponse> create(@Valid @RequestBody RelocationSiteUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(relocationSiteService.create(request));
    }

    /** FR-2.4 - ST_DWithin proximity search, sorted nearest-first. */
    @GetMapping("/relocation-sites/near/{villageId}")
    public ResponseEntity<List<RelocationSiteResponse>> near(
            @PathVariable String villageId,
            @RequestParam(name = "radiusKm", defaultValue = "50") double radiusKm) {
        return ResponseEntity.ok(relocationSiteService.findNearVillage(villageId, radiusKm));
    }

    @GetMapping("/relocation-sites/{id}/capacity")
    public ResponseEntity<RelocationSiteResponse> capacity(@PathVariable String id) {
        return ResponseEntity.ok(relocationSiteService.getCapacity(id));
    }

    /** FR-2.5 - completes CRUD (not itemized in SRS 5.2's table but required by the FR text). */
    @DeleteMapping("/relocation-sites/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        relocationSiteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
