package com.sih.disaster.controller;

import com.sih.disaster.dto.request.DecisionApproveRequest;
import com.sih.disaster.dto.request.DecisionOverrideRequest;
import com.sih.disaster.dto.response.RelocationDecisionResponse;
import com.sih.disaster.enums.DecisionStatus;
import com.sih.disaster.service.RelocationDecisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** SRS 5.5 - used by Mrinal's admin panel (FR-6.1, FR-6.2). */
@RestController
@RequestMapping("/api/relocation-decisions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
public class RelocationDecisionController {

    private final RelocationDecisionService relocationDecisionService;

    @GetMapping
    public ResponseEntity<Page<RelocationDecisionResponse>> list(
            @RequestParam(required = false) DecisionStatus status, Pageable pageable) {
        return ResponseEntity.ok(relocationDecisionService.list(status, pageable));
    }

    /** Creates a decision record from an AI recommendation (system/admin-triggered). */
    @PostMapping
    public ResponseEntity<RelocationDecisionResponse> create(
            @RequestParam String villageId,
            @RequestParam(required = false) String recommendedSiteId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(relocationDecisionService.createFromRecommendation(villageId, recommendedSiteId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<RelocationDecisionResponse> approve(
            @PathVariable Long id,
            @RequestBody(required = false) DecisionApproveRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(relocationDecisionService.approve(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/override")
    public ResponseEntity<RelocationDecisionResponse> override(
            @PathVariable Long id,
            @Valid @RequestBody DecisionOverrideRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(relocationDecisionService.override(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<RelocationDecisionResponse> reject(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(relocationDecisionService.reject(id, authentication.getName()));
    }
}
