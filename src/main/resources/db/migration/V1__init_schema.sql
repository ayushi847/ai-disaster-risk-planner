-- ============================================================
-- V1: Initial schema for the Disaster Risk Assessment &
-- Relocation Planning System (Backend & Geospatial DB - Purwansh)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------
-- users (auth) - table name "users" because USER is reserved
-- ---------------------------------------------------------
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(150)        NOT NULL,
    email         VARCHAR(255)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(20)         NOT NULL CHECK (role IN ('VIEWER','ADMIN','AUTHORITY')),
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- village
-- ---------------------------------------------------------
CREATE TABLE village (
    id             VARCHAR(30)   PRIMARY KEY,
    name           VARCHAR(200)  NOT NULL,
    district       VARCHAR(150),
    state          VARCHAR(150),
    population     INTEGER       CHECK (population >= 0),
    geometry       geometry(Geometry, 4326) NOT NULL,
    risk_score     DOUBLE PRECISION,
    risk_level     VARCHAR(10)   CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    priority_level VARCHAR(15)   CHECK (priority_level IN ('IMMEDIATE','SHORT_TERM','MEDIUM_TERM')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_village_geom ON village USING GIST (geometry);
CREATE INDEX idx_village_district ON village (district);
CREATE INDEX idx_village_risk_level ON village (risk_level);
CREATE INDEX idx_village_priority_level ON village (priority_level);

-- ---------------------------------------------------------
-- hazard_zone
-- ---------------------------------------------------------
CREATE TABLE hazard_zone (
    id           BIGSERIAL PRIMARY KEY,
    hazard_type  VARCHAR(20)  NOT NULL CHECK (hazard_type IN ('FLOOD','LANDSLIDE','CYCLONE','EARTHQUAKE','DROUGHT')),
    intensity    DOUBLE PRECISION NOT NULL CHECK (intensity BETWEEN 0.0 AND 1.0),
    source       VARCHAR(200),
    recorded_at  TIMESTAMPTZ,
    geometry     geometry(Polygon, 4326) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_hazard_zone_geom ON hazard_zone USING GIST (geometry);
CREATE INDEX idx_hazard_zone_type ON hazard_zone (hazard_type);

-- ---------------------------------------------------------
-- relocation_site
-- ---------------------------------------------------------
CREATE TABLE relocation_site (
    id             VARCHAR(30) PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    capacity_total INTEGER      NOT NULL CHECK (capacity_total >= 0),
    capacity_used  INTEGER      NOT NULL DEFAULT 0 CHECK (capacity_used >= 0),
    resources_json JSONB,
    geometry       geometry(Point, 4326) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_relocation_site_geom ON relocation_site USING GIST (geometry);

-- ---------------------------------------------------------
-- risk_assessment (history; latest copy denormalized onto village)
-- ---------------------------------------------------------
CREATE TABLE risk_assessment (
    id           BIGSERIAL PRIMARY KEY,
    village_id   VARCHAR(30) NOT NULL REFERENCES village(id) ON DELETE CASCADE,
    score        DOUBLE PRECISION NOT NULL CHECK (score BETWEEN 0.0 AND 100.0),
    risk_level   VARCHAR(10) NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    factors_json JSONB,
    confidence   DOUBLE PRECISION CHECK (confidence BETWEEN 0.0 AND 1.0),
    computed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_assessment_village ON risk_assessment (village_id);
CREATE INDEX idx_risk_assessment_computed_at ON risk_assessment (computed_at);

-- ---------------------------------------------------------
-- prioritization_result (history; latest copy denormalized onto village)
-- ---------------------------------------------------------
CREATE TABLE prioritization_result (
    id                    BIGSERIAL PRIMARY KEY,
    village_id            VARCHAR(30) NOT NULL REFERENCES village(id) ON DELETE CASCADE,
    priority_level        VARCHAR(15) NOT NULL CHECK (priority_level IN ('IMMEDIATE','SHORT_TERM','MEDIUM_TERM')),
    recommended_site_id   VARCHAR(30) REFERENCES relocation_site(id),
    capacity_notes        TEXT,
    computed_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prioritization_village ON prioritization_result (village_id);

-- ---------------------------------------------------------
-- relocation_decision
-- ---------------------------------------------------------
CREATE TABLE relocation_decision (
    id               BIGSERIAL PRIMARY KEY,
    village_id       VARCHAR(30) NOT NULL REFERENCES village(id),
    site_id          VARCHAR(30) REFERENCES relocation_site(id),
    status           VARCHAR(15) NOT NULL CHECK (status IN ('PENDING','APPROVED','OVERRIDDEN','REJECTED')),
    decided_by       BIGINT REFERENCES users(id),
    decided_at       TIMESTAMPTZ,
    override_reason  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_relocation_decision_village ON relocation_decision (village_id);
CREATE INDEX idx_relocation_decision_status ON relocation_decision (status);

-- ---------------------------------------------------------
-- audit_log (append-only; no update/delete grants issued to app role in prod)
-- ---------------------------------------------------------
CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    entity        VARCHAR(60)  NOT NULL,
    entity_id     VARCHAR(60)  NOT NULL,
    action        VARCHAR(30)  NOT NULL,
    actor_id      BIGINT REFERENCES users(id),
    "timestamp"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    before_state  JSONB,
    after_state   JSONB
);
CREATE INDEX idx_audit_log_entity ON audit_log (entity, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log ("timestamp");
