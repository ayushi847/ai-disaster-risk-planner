package com.sih.disaster.service;

import com.sih.disaster.dto.request.DecisionApproveRequest;
import com.sih.disaster.dto.request.DecisionOverrideRequest;
import com.sih.disaster.dto.response.RelocationDecisionResponse;
import com.sih.disaster.entity.*;
import com.sih.disaster.enums.DecisionStatus;
import com.sih.disaster.exception.ConflictException;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Owner: Purwansh, used by Mrinal's admin panel (FR-6.1, FR-6.2, FR-6.3).
 * decidedBy/decidedAt are ALWAYS set server-side from the authenticated
 * caller - never accepted from the request body (SRS 10.6, 10.9).
 */
@Service
@RequiredArgsConstructor
public class RelocationDecisionService {

    private final RelocationDecisionRepository decisionRepository;
    private final VillageRepository villageRepository;
    private final RelocationSiteRepository relocationSiteRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    /** System-created from the AI/prioritization output - not a frontend submission (SRS 10.6). */
    @Transactional
    public RelocationDecisionResponse createFromRecommendation(String villageId, String recommendedSiteId) {
        Village village = villageRepository.findById(villageId)
                .orElseThrow(() -> new ResourceNotFoundException("Village not found: " + villageId));

        RelocationSite site = null;
        if (recommendedSiteId != null && !recommendedSiteId.isBlank()) {
            site = relocationSiteRepository.findById(recommendedSiteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Relocation site not found: " + recommendedSiteId));
        }

        RelocationDecision decision = RelocationDecision.builder()
                .village(village)
                .site(site)
                .status(DecisionStatus.PENDING)
                .build();
        RelocationDecision saved = decisionRepository.save(decision);

        auditLogService.record("RelocationDecision", saved.getId().toString(), "CREATE", null, null, RelocationDecisionResponse.from(saved));
        return RelocationDecisionResponse.from(saved);
    }

    public Page<RelocationDecisionResponse> list(DecisionStatus status, Pageable pageable) {
        Page<RelocationDecision> page = (status != null)
                ? decisionRepository.findByStatus(status, pageable)
                : decisionRepository.findAll(pageable);
        return page.map(RelocationDecisionResponse::from);
    }

    @Transactional
    public RelocationDecisionResponse approve(Long id, DecisionApproveRequest req, String actorEmail) {
        RelocationDecision decision = getOrThrow(id);
        assertPending(decision);

        RelocationDecisionResponse before = RelocationDecisionResponse.from(decision);
        AppUser actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (req != null && req.getSiteId() != null && !req.getSiteId().isBlank()) {
            RelocationSite site = relocationSiteRepository.findById(req.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Relocation site not found: " + req.getSiteId()));
            decision.setSite(site);
        }

        decision.setStatus(DecisionStatus.APPROVED);
        decision.setDecidedBy(actor);          // server-side only - never trust client value (SRS 10.9)
        decision.setDecidedAt(Instant.now());  // server-side only

        RelocationDecision saved = decisionRepository.save(decision);
        auditLogService.record("RelocationDecision", saved.getId().toString(), "APPROVE", actor, before, RelocationDecisionResponse.from(saved));
        return RelocationDecisionResponse.from(saved);
    }

    /** overrideReason is mandatory at the DTO level so every override self-explains in the audit log. */
    @Transactional
    public RelocationDecisionResponse override(Long id, DecisionOverrideRequest req, String actorEmail) {
        RelocationDecision decision = getOrThrow(id);
        assertPending(decision);

        RelocationDecisionResponse before = RelocationDecisionResponse.from(decision);
        AppUser actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        RelocationSite site = relocationSiteRepository.findById(req.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Relocation site not found: " + req.getSiteId()));

        decision.setSite(site);
        decision.setOverrideReason(req.getOverrideReason());
        decision.setStatus(DecisionStatus.OVERRIDDEN);
        decision.setDecidedBy(actor);
        decision.setDecidedAt(Instant.now());

        RelocationDecision saved = decisionRepository.save(decision);
        auditLogService.record("RelocationDecision", saved.getId().toString(), "OVERRIDE", actor, before,  RelocationDecisionResponse.from(saved));
        return RelocationDecisionResponse.from(saved);
    }

    @Transactional
    public RelocationDecisionResponse reject(Long id, String actorEmail) {
        RelocationDecision decision = getOrThrow(id);
        assertPending(decision);

        RelocationDecisionResponse before = RelocationDecisionResponse.from(decision);
        AppUser actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        decision.setStatus(DecisionStatus.REJECTED);
        decision.setDecidedBy(actor);
        decision.setDecidedAt(Instant.now());

        RelocationDecision saved = decisionRepository.save(decision);
        auditLogService.record("RelocationDecision", saved.getId().toString(), "REJECT", actor, before, RelocationDecisionResponse.from(saved));
        return RelocationDecisionResponse.from(saved);
    }

    private void assertPending(RelocationDecision decision) {
        if (decision.getStatus() != DecisionStatus.PENDING) {
            throw new ConflictException(
                    "Decision " + decision.getId() + " is already " + decision.getStatus() + " - cannot re-decide");
        }
    }

    RelocationDecision getOrThrow(Long id) {
        return decisionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relocation decision not found: " + id));
    }
}
