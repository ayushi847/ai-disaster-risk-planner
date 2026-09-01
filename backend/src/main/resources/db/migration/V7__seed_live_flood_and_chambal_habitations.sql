-- ====================================================================
-- V7: Seed Live Active Flood & Chambal Basin Habitations & Shelters
-- Adds Prayagraj (UP), Gwalior/Chambal (MP), and Barpeta (Assam)
-- ====================================================================

-- 1. Insert New Habitations
INSERT INTO village (id, name, district, state, population, geometry, created_at, updated_at) VALUES
('VLG-072', 'Prayagraj Sangam Flood Lowlands', 'Prayagraj', 'Uttar Pradesh', 6800, ST_SetSRID(ST_MakePoint(81.8463, 25.4358), 4326), NOW(), NOW()),
('VLG-073', 'Dabra & Gwalior Chambal Basin', 'Gwalior', 'Madhya Pradesh', 5200, ST_SetSRID(ST_MakePoint(78.33, 25.90), 4326), NOW(), NOW()),
('VLG-074', 'Barpeta Town & Kazi Nazrul Ghat', 'Barpeta', 'Assam', 5900, ST_SetSRID(ST_MakePoint(91.00, 26.32), 4326), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Matching Safe Shelters
INSERT INTO relocation_site (id, name, capacity_total, capacity_used, resources_json, geometry, created_at, updated_at) VALUES
('SITE-075', 'Prayagraj University Science Campus Elevated Shelter', 8500, 0, '{"shelter": true, "water": true, "medical": true, "food": true}'::jsonb, ST_SetSRID(ST_MakePoint(81.854, 25.459), 4326), NOW(), NOW()),
('SITE-076', 'Gwalior District Sports Stadium Safe Relief Complex', 9500, 0, '{"shelter": true, "water": true, "medical": true, "food": true}'::jsonb, ST_SetSRID(ST_MakePoint(78.182, 26.218), 4326), NOW(), NOW()),
('SITE-077', 'Barpeta Town High-Ground Relief Center', 7500, 0, '{"shelter": true, "water": true, "medical": true, "food": true}'::jsonb, ST_SetSRID(ST_MakePoint(91.025, 26.352), 4326), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
