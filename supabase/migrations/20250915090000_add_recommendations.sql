-- Create recommendations table to publish strategies publicly (readable by all authenticated users)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  original_user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  timeframe text NOT NULL,
  target_asset text,
  target_asset_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(original_strategy_id)
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Policies: allow anyone (authenticated) to read; no insert/update/delete from client by default
DROP POLICY IF EXISTS "Anyone can read recommendations" ON public.recommendations;
CREATE POLICY "Anyone can read recommendations" ON public.recommendations
FOR SELECT USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recommendations_updated_at ON public.recommendations;
CREATE TRIGGER update_recommendations_updated_at
BEFORE UPDATE ON public.recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_recommendations_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_updated_at ON public.recommendations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_original_strategy_id ON public.recommendations(original_strategy_id); 