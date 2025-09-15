-- 1) Fix uniqueness so multiple referral credits per inviter are allowed
ALTER TABLE public.user_discounts DROP CONSTRAINT IF EXISTS uniq_first_purchase_per_user;

-- Unique only for first_purchase via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_first_purchase_per_user_idx
ON public.user_discounts(user_id)
WHERE type = 'first_purchase';

-- Ensure inviter award is idempotent per invitee via partial unique index
ALTER TABLE public.user_discounts
ADD COLUMN IF NOT EXISTS referral_award_for_invitee uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_referral_credit_per_invitee
ON public.user_discounts(user_id, referral_award_for_invitee)
WHERE type = 'referral_credit';

-- 2) Optional metadata on referrals (not strictly required with the index above)
-- You can uncomment if you want a visible flag on the referral record
-- ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS inviter_awarded boolean DEFAULT false;
-- ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS inviter_awarded_at timestamptz;

-- 3) Function to generate unique referral codes (SQL side)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
  exists_count int := 1;
BEGIN
  WHILE exists_count > 0 LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.referral_codes WHERE code = code;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 4) Backfill invite codes for all existing users that do not have one
INSERT INTO public.referral_codes(user_id, code)
SELECT u.id, public.generate_referral_code()
FROM auth.users u
LEFT JOIN public.referral_codes rc ON rc.user_id = u.id
WHERE rc.user_id IS NULL; 