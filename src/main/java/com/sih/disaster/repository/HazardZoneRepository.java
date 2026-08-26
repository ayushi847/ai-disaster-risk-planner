package com.sih.disaster.repository;

import com.sih.disaster.entity.HazardZone;
import com.sih.disaster.enums.HazardType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HazardZoneRepository extends JpaRepository<HazardZone, Long> {
    Page<HazardZone> findByHazardType(HazardType hazardType, Pageable pageable);
}
