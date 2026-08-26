package com.sih.disaster.repository;

import com.sih.disaster.entity.RelocationDecision;
import com.sih.disaster.enums.DecisionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelocationDecisionRepository extends JpaRepository<RelocationDecision, Long> {
    Page<RelocationDecision> findByStatus(DecisionStatus status, Pageable pageable);
    long countByStatus(DecisionStatus status);
}
