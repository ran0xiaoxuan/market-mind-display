
-- Simple INSERT to add Pro user to subscribers table
INSERT INTO public.subscribers (
  user_id,
  email,
  subscribed,
  subscription_end,
  subscription_tier,
  created_at,
  updated_at
) VALUES (
  '88b9aa6e-eb6c-42d4-870c-d7ba1cb52193',
  'ran0xiaoxuan@gmail.com',
  true,
  '2025-12-31 23:59:59+00',
  'pro',
  now(),
  now()
);
