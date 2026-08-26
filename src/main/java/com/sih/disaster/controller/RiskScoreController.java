package com.sih.disaster.controller;

import com.sih.disaster.dto.request.RiskScoreRequest;
import com.sih.disaster.dto.response.RiskAssessmentResponse;
import com.sih.disaster.enums.RiskLevel;
import com.sih.disaster.service.RiskScoreService;
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

/** SRS 5.3 - consumed from Jenam's ML service. */
@RestController
@RequestMapping("/api/risk-scores")
@RequiredArgsConstructor
public class RiskScoreController {

    private final RiskScoreService riskScoreService;
    private final VillageService villageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
    public ResponseEntity<RiskAssessmentResponse> ingest(@Valid @RequestBody RiskScoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskScoreService.ingest(request));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
    public ResponseEntity<List<RiskAssessmentResponse>> ingestBatch(@Valid @RequestBody List<RiskScoreRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskScoreService.ingestBatch(requests));
    }

    @GetMapping("/{villageId}")
    public ResponseEntity<List<RiskAssessmentResponse>> history(@PathVariable String villageId) {
        return ResponseEntity.ok(riskScoreService.history(villageId));
    }

    /** GET /api/risk-scores?level=HIGH - list villages filtered by risk level. */
    @GetMapping(params = "level")
    public ResponseEntity<Page<com.sih.disaster.dto.response.VillageResponse>> byLevel(
            @RequestParam RiskLevel level, Pageable pageable) {
        return ResponseEntity.ok(villageService.search(null, level, null, pageable));
    }
}
