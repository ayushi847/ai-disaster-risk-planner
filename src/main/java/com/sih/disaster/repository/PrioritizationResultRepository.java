package com.sih.disaster.repository;

import com.sih.disaster.entity.PrioritizationResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrioritizationResultRepository extends JpaRepository<PrioritizationResult, Long> {
    Optional<PrioritizationResult> findFirstByVillageIdOrderByComputedAtDesc(String villageId);
}
