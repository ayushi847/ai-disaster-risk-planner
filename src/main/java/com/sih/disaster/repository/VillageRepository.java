package com.sih.disaster.repository;

import com.sih.disaster.entity.Village;
import com.sih.disaster.enums.PriorityLevel;
import com.sih.disaster.enums.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// FR-2.5 CRUD is satisfied via the default JpaRepository delete methods
// (deleteById/delete) exposed through VillageService/VillageController -
// no custom delete query needed here.
public interface VillageRepository extends JpaRepository<Village, String> {

    /** Backs FR-5.3 / GET /api/villages filters. Null params are ignored. */
    @Query("""
            SELECT v FROM Village v
            WHERE (:district IS NULL OR v.district = :district)
              AND (:riskLevel IS NULL OR v.riskLevel = :riskLevel)
              AND (:priorityLevel IS NULL OR v.priorityLevel = :priorityLevel)
            """)
    Page<Village> search(@Param("district") String district,
                          @Param("riskLevel") RiskLevel riskLevel,
                          @Param("priorityLevel") PriorityLevel priorityLevel,
                          Pageable pageable);

    /**
     * FR-2.3 / GET /api/hazard-zones/{id}/villages - spatial intersection.
     * ST_Intersects on the raw geometry columns (both stored SRID 4326).
     */
    @Query(value = """
            SELECT v.* FROM village v
            JOIN hazard_zone h ON ST_Intersects(v.geometry, h.geometry)
            WHERE h.id = :hazardZoneId
            """, nativeQuery = true)
    List<Village> findVillagesIntersectingHazardZone(@Param("hazardZoneId") Long hazardZoneId);

    long countByRiskLevel(RiskLevel riskLevel);

    long countByPriorityLevel(PriorityLevel priorityLevel);
}
