package com.sih.disaster.repository;

import com.sih.disaster.entity.RelocationSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RelocationSiteRepository extends JpaRepository<RelocationSite, String> {

    /**
     * FR-2.4 / GET /api/relocation-sites/near/{villageId} - proximity search
     * using ST_DWithin on a geography cast for accurate metric distance,
     * sorted nearest-first. distanceKm is computed per request, never stored
     * (SRS 10.3). Returns id + distance only; the service layer re-fetches
     * full entities via findAllById to avoid hand-parsing raw geometry
     * columns out of a native Object[] row.
     */
    @Query(value = """
            SELECT s.id AS id, ST_Distance(
                s.geometry::geography, v.geometry::geography
            ) / 1000.0 AS distanceKm
            FROM relocation_site s, village v
            WHERE v.id = :villageId
              AND ST_DWithin(s.geometry::geography, v.geometry::geography, :radiusMeters)
            ORDER BY distanceKm ASC
            """, nativeQuery = true)
    List<SiteDistanceProjection> findSiteIdsNearVillage(@Param("villageId") String villageId,
                                                          @Param("radiusMeters") double radiusMeters);

    interface SiteDistanceProjection {
        String getId();
        Double getDistanceKm();
    }

    @Query(value = """
            SELECT ST_Distance(s.geometry::geography, v.geometry::geography) / 1000.0
            FROM relocation_site s, village v
            WHERE s.id = :siteId AND v.id = :villageId
            """, nativeQuery = true)
    Double distanceKmBetween(@Param("siteId") String siteId, @Param("villageId") String villageId);

    /** FR-4.4 - count of sites whose assigned population exceeds their carrying capacity. */
    @Query("SELECT COUNT(s) FROM RelocationSite s WHERE s.capacityUsed > s.capacityTotal")
    long countOverCapacity();
}
