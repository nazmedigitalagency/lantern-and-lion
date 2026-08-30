-- 🗺️ Migration: Bible Adventure World Schema
-- Timestamp: 2026-08-30 15:00:00 UTC

-- 1. Adventure Worlds
CREATE TABLE IF NOT EXISTS adventure_worlds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Adventure Locations (8 Canonical Regions)
CREATE TABLE IF NOT EXISTS adventure_locations (
    id TEXT PRIMARY KEY,
    world_id TEXT REFERENCES adventure_worlds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    icon TEXT NOT NULL,
    map_x INT NOT NULL DEFAULT 0,
    map_y INT NOT NULL DEFAULT 0,
    order_index INT NOT NULL DEFAULT 1,
    scripture_range TEXT NOT NULL,
    summary TEXT NOT NULL,
    environment_description TEXT,
    tone TEXT NOT NULL DEFAULT 'emerald',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Adventure Chapters
CREATE TABLE IF NOT EXISTS adventure_chapters (
    id TEXT PRIMARY KEY,
    location_id TEXT REFERENCES adventure_locations(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    scripture_reference TEXT NOT NULL,
    bible_text TEXT NOT NULL,
    narrative_explanation TEXT NOT NULL,
    takeaway_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Adventure Collectibles
CREATE TABLE IF NOT EXISTS adventure_collectibles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'common',
    location_id TEXT REFERENCES adventure_locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Adventure Progress
CREATE TABLE IF NOT EXISTS user_adventure_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL,
    location_id TEXT NOT NULL REFERENCES adventure_locations(id) ON DELETE CASCADE,
    progress INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    mastered BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_child_location UNIQUE (child_id, location_id)
);

-- 6. User Collectibles Pouch
CREATE TABLE IF NOT EXISTS user_collectibles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL,
    collectible_id TEXT NOT NULL REFERENCES adventure_collectibles(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES adventure_locations(id) ON DELETE SET NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_child_collectible UNIQUE (child_id, collectible_id)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_user_adv_progress_child ON user_adventure_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_user_collectibles_child ON user_collectibles(child_id);
CREATE INDEX IF NOT EXISTS idx_adv_locations_order ON adventure_locations(order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE adventure_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_adventure_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;

-- Public read policies for static canonical content
CREATE POLICY "Public read for adventure worlds" ON adventure_worlds FOR SELECT USING (true);
CREATE POLICY "Public read for adventure locations" ON adventure_locations FOR SELECT USING (true);
CREATE POLICY "Public read for adventure chapters" ON adventure_chapters FOR SELECT USING (true);
CREATE POLICY "Public read for adventure collectibles" ON adventure_collectibles FOR SELECT USING (true);

-- User progress policies
CREATE POLICY "Users can read own adventure progress" ON user_adventure_progress
    FOR SELECT USING (auth.uid() = child_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own adventure progress" ON user_adventure_progress
    FOR ALL USING (auth.uid() = child_id OR auth.role() = 'service_role');

CREATE POLICY "Users can read own collectibles" ON user_collectibles
    FOR SELECT USING (auth.uid() = child_id OR auth.role() = 'service_role');

CREATE POLICY "Users can claim collectibles" ON user_collectibles
    FOR INSERT WITH CHECK (auth.uid() = child_id OR auth.role() = 'service_role');
