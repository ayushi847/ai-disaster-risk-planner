package com.sih.disaster.repository;

import com.sih.disaster.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    @Query("""
            SELECT r FROM RiskAssessment r
            WHERE r.village.id = :villageId
            ORDER BY r.computedAt DESC
            """)
    List<RiskAssessment> findHistoryForVillage(@Param("villageId") String villageId);

    Optional<RiskAssessment> findFirstByVillageIdOrderByComputedAtDesc(String villageId);
}
