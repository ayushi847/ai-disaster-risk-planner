package com.sih.disaster.service;

import com.sih.disaster.dto.request.RelocationSiteUploadRequest;
import com.sih.disaster.dto.response.RelocationSiteResponse;
import com.sih.disaster.entity.RelocationSite;
import com.sih.disaster.exception.ResourceNotFoundException;
import com.sih.disaster.repository.RelocationSiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Owner: Purwansh (FR-2.1, FR-2.2, FR-2.4). Relocation site CRUD + proximity search. */
@Service
@RequiredArgsConstructor
public class RelocationSiteService {

    private final RelocationSiteRepository relocationSiteRepository;

    @Transactional
    public RelocationSiteResponse create(RelocationSiteUploadRequest req) {
        String id = (req.getId() != null && !req.getId().isBlank())
                ? req.getId()
                : "SITE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        RelocationSite site = RelocationSite.builder()
                .id(id)
                .name(req.getName())
                .capacityTotal(req.getCapacityTotal())
                .capacityUsed(0)
                .resources(req.getResources())
                .geometry(req.getGeometry())
                .build();
        return RelocationSiteResponse.from(relocationSiteRepository.save(site));
    }

    public Page<RelocationSiteResponse> list(Pageable pageable) {
        return relocationSiteRepository.findAll(pageable).map(RelocationSiteResponse::from);
    }

    public RelocationSiteResponse getCapacity(String id) {
        return RelocationSiteResponse.from(getOrThrow(id));
    }

    /**
     * FR-2.4 / GET /api/relocation-sites/near/{villageId} - ST_DWithin proximity
     * search, sorted nearest-first, radius configurable (defaults to 50 km).
     */
    public List<RelocationSiteResponse> findNearVillage(String villageId, double radiusKm) {
        double radiusMeters = radiusKm * 1000.0;
        List<RelocationSiteRepository.SiteDistanceProjection> hits =
                relocationSiteRepository.findSiteIdsNearVillage(villageId, radiusMeters);

        Map<String, RelocationSite> sitesById = relocationSiteRepository
                .findAllById(hits.stream().map(RelocationSiteRepository.SiteDistanceProjection::getId).toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(RelocationSite::getId, s -> s));

        return hits.stream()
                .map(hit -> {
                    RelocationSiteResponse resp = RelocationSiteResponse.from(sitesById.get(hit.getId()));
                    resp.setDistanceKm(hit.getDistanceKm());
                    return resp;
                })
                .toList();
    }

    /** Used by Tanmay's module (via PrioritizationService) and the decision-approval workflow. */
    @Transactional
    public void adjustCapacityUsed(String siteId, int delta) {
        RelocationSite site = getOrThrow(siteId);
        int updated = Math.max(0, site.getCapacityUsed() + delta);
        site.setCapacityUsed(updated);
        relocationSiteRepository.save(site);
    }

    /** FR-2.5 - completes CRUD (not itemized in SRS 5.2's table but required by the FR text). */
    @Transactional
    public void delete(String id) {
        RelocationSite site = getOrThrow(id);
        relocationSiteRepository.delete(site);
    }

    RelocationSite getOrThrow(String id) {
        return relocationSiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relocation site not found: " + id));
    }
}
