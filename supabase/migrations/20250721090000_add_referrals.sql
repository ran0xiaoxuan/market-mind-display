-- Create enum for discount types
DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('first_purchase', 'referral_credit');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table: referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  user_id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: referrals (who used whose code)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid NOT NULL,
  invitee_user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  invitee_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: user_discounts (credits)
CREATE TABLE IF NOT EXISTS public.user_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.discount_type NOT NULL,
  consumed boolean NOT NULL DEFAULT false,
  consumed_at timestamptz,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Ensure only one first_purchase credit per user
  CONSTRAINT uniq_first_purchase_per_user UNIQUE (user_id, type)
    DEFERRABLE INITIALLY IMMEDIATE
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;

-- Policies: users can read their own data
DO $$ BEGIN
  CREATE POLICY "Users can read their own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read their own referrals as inviter" ON public.referrals
  FOR SELECT USING (auth.uid() = inviter_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read their own discounts" ON public.user_discounts
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Deny writes from client; service role bypasses RLS
-- (No INSERT/UPDATE/DELETE policies)

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON public.referrals(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee ON public.referrals(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_user_discounts_user ON public.user_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_discounts_consumed ON public.user_discounts(user_id, consumed, type); 