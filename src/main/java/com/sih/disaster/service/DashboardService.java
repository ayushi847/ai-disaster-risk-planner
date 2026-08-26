package com.sih.disaster.service;

import com.sih.disaster.dto.response.DashboardSummaryResponse;
import com.sih.disaster.enums.DecisionStatus;
import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
import com.sih.disaster.repository.RelocationDecisionRepository;
import com.sih.disaster.repository.RelocationSiteRepository;
import com.sih.disaster.repository.VillageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * FR-2.9 - GET /api/dashboard/summary. Aggregated counts (villages by
 * risk/priority level, site capacity status, pending decisions) so
 * Ayushi's frontend can render top-level stats in a single round-trip.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VillageRepository villageRepository;
    private final RelocationSiteRepository relocationSiteRepository;
    private final RelocationDecisionRepository decisionRepository;

    public DashboardSummaryResponse summary() {
        Map<String, Long> byRisk = new LinkedHashMap<>();
        for (RiskLevel level : RiskLevel.values()) {
            byRisk.put(level.name(), villageRepository.countByRiskLevel(level));
        }

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (PriorityLevel level : PriorityLevel.values()) {
            byPriority.put(level.name(), villageRepository.countByPriorityLevel(level));
        }

        Map<String, Long> byDecisionStatus = new LinkedHashMap<>();
        for (DecisionStatus status : DecisionStatus.values()) {
            byDecisionStatus.put(status.name(), decisionRepository.countByStatus(status));
        }

        return DashboardSummaryResponse.builder()
                .totalVillages(villageRepository.count())
                .villagesByRiskLevel(byRisk)
                .villagesByPriorityLevel(byPriority)
                .totalRelocationSites(relocationSiteRepository.count())
                .sitesOverCapacity(relocationSiteRepository.countOverCapacity())
                .decisionsByStatus(byDecisionStatus)
                .pendingDecisions(decisionRepository.countByStatus(DecisionStatus.PENDING))
                .build();
    }
}
