-- ==============================================================================
-- Lantern & Lion - Avatar, Customization & Gamified Economy Migration
-- Complies with Security Hardening, Anti-Cheat, and Row Level Security (RLS)
-- ==============================================================================

-- 1. Avatars Table -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  skin_tone TEXT NOT NULL DEFAULT 'honey',
  hair_style TEXT NOT NULL DEFAULT 'curls',
  face TEXT NOT NULL DEFAULT 'smile',
  gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  headwear TEXT,
  clothing TEXT NOT NULL DEFAULT 'starter-tunic',
  shoes TEXT NOT NULL DEFAULT 'starter-sandals',
  accessory TEXT,
  backpack TEXT NOT NULL DEFAULT 'starter-satchel',
  lantern TEXT NOT NULL DEFAULT 'starter-lantern',
  pet TEXT,
  emote TEXT NOT NULL DEFAULT 'emote-wave',
  special TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id)
);
CREATE INDEX IF NOT EXISTS avatars_child_id_idx ON public.avatars (child_id);

-- 2. User Economy Table (XP, Lantern Coins, Gems) -----------------------------
CREATE TABLE IF NOT EXISTS public.user_economy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id)
);
CREATE INDEX IF NOT EXISTS user_economy_child_id_idx ON public.user_economy (child_id);

-- 3. Inventory Items Catalog --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  slot TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  price_coins INTEGER NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  price_gems INTEGER NOT NULL DEFAULT 0 CHECK (price_gems >= 0),
  unlock_level INTEGER NOT NULL DEFAULT 1 CHECK (unlock_level >= 1),
  is_starter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_items_slot_idx ON public.inventory_items (slot);

-- 4. User Owned Inventory -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'starter',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, item_id)
);
CREATE INDEX IF NOT EXISTS user_inventory_child_id_idx ON public.user_inventory (child_id);
CREATE INDEX IF NOT EXISTS user_inventory_item_id_idx ON public.user_inventory (item_id);

-- 5. Economy Transactions Audit Log -------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('xp', 'coins', 'gems')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS economy_transactions_child_id_created_idx ON public.economy_transactions (child_id, created_at DESC);

-- 6. Row Level Security & Access Control ---------------------------------------
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_economy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_transactions ENABLE ROW LEVEL SECURITY;

-- Deny untrusted direct access from anon
REVOKE ALL ON public.avatars FROM anon;
REVOKE ALL ON public.user_economy FROM anon;
REVOKE ALL ON public.inventory_items FROM anon;
REVOKE ALL ON public.user_inventory FROM anon;
REVOKE ALL ON public.economy_transactions FROM anon;

-- Grant access to service_role for secure server API execution
GRANT ALL ON public.avatars TO service_role;
GRANT ALL ON public.user_economy TO service_role;
GRANT ALL ON public.inventory_items TO service_role;
GRANT ALL ON public.user_inventory TO service_role;
GRANT ALL ON public.economy_transactions TO service_role;

-- Allow authenticated users to read items catalog
CREATE POLICY "Anyone authenticated can view catalog items"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (true);

-- Parents can view their family's children avatars
CREATE POLICY "Parents can view family children avatars"
  ON public.avatars FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

-- Parents can view their family's children economy
CREATE POLICY "Parents can view family children economy"
  ON public.user_economy FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );
