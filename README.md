# disaster-relocation-backend

Backend & Geospatial Database module — **Owner: Purwansh** — for the SIH 2026
*AI-Based Disaster Risk Assessment & Relocation Planning System*.

Implements SRS sections 4.2, 5, 6, 7, 9 and 10: Spring Boot REST API +
PostgreSQL/PostGIS, JWT auth, and the DTO→Service→Entity contracts the rest
of the team (Karan, Jenam, Tanmay, Ayushi, Mrinal) integrate against.

## Stack

- Java 21, Spring Boot 3.3 (Web, Data JPA, Security, Validation)
- PostgreSQL 16 + PostGIS 3.4, Hibernate Spatial, JTS
- Flyway (schema migrations, versioned per FR-2.10)
- JWT (jjwt) for stateless auth
- Lombok

## Project layout

```
config/       Spring Security + Jackson/GeoJSON wiring
security/     JWT service, filter, UserDetailsService
enums/        RiskLevel, PriorityLevel, HazardType, DecisionStatus, UserRole
entity/       JPA entities (Village, HazardZone, RelocationSite,
              RiskAssessment, PrioritizationResult, RelocationDecision,
              AppUser, AuditLog)
dto/request/  Inbound payload contracts (bound via @Valid, never bound
              directly to entities - see SRS 9.9 checklist)
dto/response/ Outbound shapes served to the frontend/admin panel
repository/   Spring Data JPA + native PostGIS spatial queries
service/      Business logic, DTO<->Entity mapping, denormalization
controller/   REST endpoints (SRS section 5)
exception/    Centralized error handling -> consistent ApiError JSON
db/migration/ Flyway SQL (V1__init_schema.sql = full schema + GiST indexes)
```

## Running locally

```bash
docker compose up -d          # starts postgres+postgis on :5432
mvn spring-boot:run           # Flyway migrates automatically on boot
```

Default dev config (`application.yml`) points at
`jdbc:postgresql://localhost:5432/disaster_relocation` / `postgres`/`postgres`.
Override via env vars for other environments: `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ORIGINS`.

**Before a real deployment:** set `JWT_SECRET` to a real random 32+ byte
secret via env var — the default in `application.yml` is dev-only and is
committed to the repo on purpose so the team can run locally without setup.

There's no seed data / bootstrap admin yet — see Open Items below. To create
the first admin account you'll need to either insert a row directly (bcrypt
the password) or temporarily relax `/api/auth/register` to `permitAll()`,
register the first admin, then revert.

## Auth flow

1. `POST /api/auth/login` → `{token, tokenType: "Bearer", user}`
2. Send `Authorization: Bearer <token>` on every write/admin call.
3. Roles: `VIEWER` (read-only dashboard), `ADMIN` / `AUTHORITY` (everything
   else — upload, ingest scores/priorities, approve/override decisions).

Read endpoints for villages, hazard zones, relocation sites, risk scores,
prioritization, and the dashboard summary are public (no token needed) so
Ayushi's dashboard works without a login. Every write endpoint and the
admin/audit endpoints require a valid JWT — enforced both at the
`SecurityConfig` filter-chain level and again per-controller via
`@PreAuthorize`, matching the Auth column in SRS section 5.

## Integration contracts (what each teammate calls)

**Karan → `POST /api/villages`, `POST /api/hazard-zones`, `POST /api/relocation-sites`**
Send processed GeoJSON/CSV as JSON with a `geometry` field holding a
standard GeoJSON geometry object (EPSG:4326) — Jackson deserializes it
straight into a JTS `Geometry`/`Polygon`/`Point`, no manual parsing needed
on either side.

**Jenam → `POST /api/risk-scores`** (see `dto/request/RiskScoreRequest.java`)
Matches the sample contract in SRS 5.7 exactly:
```json
{
  "villageId": "VLG-2031",
  "score": 78.4,
  "riskLevel": "HIGH",
  "factors": { "hazardIntensity": 0.81, "populationDensity": 0.62, "disasterHistory": 0.70 },
  "confidence": 0.88,
  "computedAt": "2026-08-22T10:15:00Z"
}
```
If your service emits snake_case, tell me and I'll add `@JsonProperty` on
`RiskFactors` rather than changing the DTO's Java naming (SRS 9.2).

**Tanmay → `POST /api/prioritization`**
`{villageId, priorityLevel, recommendedSiteId, capacityNotes}`. This
endpoint assumes the village already has a risk score and the recommended
site already exists — call it after Jenam's ingestion and after the site is
uploaded.

**Ayushi → all `GET` endpoints**, especially `GET /api/dashboard/summary` for
top-line counts and `GET /api/villages/{id}` for the detail panel (includes
latest risk assessment, latest priority, and nearest relocation site with
distance in one response).

**Mrinal → `/api/relocation-decisions/**` and `/api/audit-logs`**
Every approve/override/reject sets `decidedBy`/`decidedAt` from the JWT and
server clock — never from the request body — and writes an audit log row
automatically. `override` requires a non-blank `overrideReason`.

## Governing rule (SRS 10.9)

If a value can be independently computed or verified server-side (who
decided something, distance between two points, when something happened),
the API overwrites it server-side even if a caller sends one. Only Karan's
geometry/population, Jenam's scores, Tanmay's priorities, and an
authenticated admin's decision/override actions are trusted as input.

## Open items (carried over from SRS 8.1 — need the team's input)

1. Final hazard type list + severity scale.
2. Risk-level classification thresholds (Low/Medium/High/Critical cut-offs)
   — currently just persisted as whatever Jenam's service sends.
3. Carrying-capacity formula inputs — `resources_json` on `RelocationSite`
   is a free-form JSONB bucket until Tanmay's module needs specific keys.
4. Scheduled vs on-demand score recomputation — no scheduler wired up yet;
   `POST /api/risk-scores` is on-demand only.
5. No bootstrap-admin / seed-data migration yet (see "Running locally").
6. `UserRole` has no dedicated machine/service role — Jenam's and Tanmay's
   services currently authenticate as an `ADMIN`/`AUTHORITY` account to call
   their ingestion endpoints. Worth a `SERVICE` role + service-account JWTs
   if that's a concern before demo day.
