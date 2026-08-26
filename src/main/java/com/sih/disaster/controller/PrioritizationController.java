package com.sih.disaster.controller;

import com.sih.disaster.dto.request.PrioritizationRequest;
import com.sih.disaster.dto.response.PrioritizationResponse;
import com.sih.disaster.service.PrioritizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** SRS 5.4 - consumed from Tanmay's Decision & Capacity module. */
@RestController
@RequestMapping("/api/prioritization")
@RequiredArgsConstructor
public class PrioritizationController {

    private final PrioritizationService prioritizationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
    public ResponseEntity<PrioritizationResponse> ingest(@Valid @RequestBody PrioritizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prioritizationService.ingest(request));
    }

    @GetMapping("/{villageId}")
    public ResponseEntity<PrioritizationResponse> getCurrent(@PathVariable String villageId) {
        return ResponseEntity.ok(prioritizationService.getCurrent(villageId));
    }
}
