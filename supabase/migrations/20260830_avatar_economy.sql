-- Migration: Avatar Character Personalization & Gamified 3-Currency Economy
-- Defines tables, security policies, and indexes for character appearance, equipment, inventory, and wallets.

-- 1. Character Appearance
CREATE TABLE IF NOT EXISTS character_profiles (
  profile_id BIGINT PRIMARY KEY,
  skin_tone VARCHAR(32) NOT NULL DEFAULT 'honey',
  hair_style VARCHAR(32) NOT NULL DEFAULT 'short',
  face VARCHAR(32) NOT NULL DEFAULT 'smile',
  gender VARCHAR(16) NOT NULL DEFAULT 'male',
  character_name VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Character Equipment
CREATE TABLE IF NOT EXISTS character_equipment (
  profile_id BIGINT PRIMARY KEY,
  headwear VARCHAR(64),
  clothing VARCHAR(64) DEFAULT 'starter-tunic',
  shoes VARCHAR(64) DEFAULT 'starter-sandals',
  accessory VARCHAR(64) DEFAULT 'scripture-band',
  backpack VARCHAR(64) DEFAULT 'starter-satchel',
  lantern VARCHAR(64) DEFAULT 'starter-lantern',
  pet VARCHAR(64),
  emote VARCHAR(64) DEFAULT 'emote-wave',
  special VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Player Inventories (Owned cosmetics / collectibles)
CREATE TABLE IF NOT EXISTS player_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id BIGINT NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acquired_via VARCHAR(32) NOT NULL DEFAULT 'starter',
  CONSTRAINT uq_player_item UNIQUE (profile_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_player_inventories_profile ON player_inventories(profile_id);

-- 4. Player Wallets (3-currency economy: XP, Coins, Gems)
CREATE TABLE IF NOT EXISTS player_wallets (
  profile_id BIGINT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Wallet Transaction Ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id BIGINT NOT NULL,
  currency VARCHAR(16) NOT NULL CHECK (currency IN ('xp', 'coins', 'gems')),
  amount INTEGER NOT NULL,
  source VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile ON wallet_transactions(profile_id, created_at DESC);

-- Enable RLS
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
