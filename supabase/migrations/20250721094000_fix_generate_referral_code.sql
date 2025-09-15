-- Fix generate_referral_code to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text := '';
  i int;
  exists_count int := 1;
BEGIN
  WHILE exists_count > 0 LOOP
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.referral_codes rc WHERE rc.code = new_code;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Safe backfill for any users still missing a referral code
INSERT INTO public.referral_codes(user_id, code)
SELECT u.id, public.generate_referral_code()
FROM auth.users u
LEFT JOIN public.referral_codes rc ON rc.user_id = u.id
WHERE rc.user_id IS NULL; 