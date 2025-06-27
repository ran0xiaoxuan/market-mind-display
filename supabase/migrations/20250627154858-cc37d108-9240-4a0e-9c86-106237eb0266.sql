
-- Create table to track strategy evaluations and timing
CREATE TABLE public.strategy_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  next_evaluation_due TIMESTAMP WITH TIME ZONE,
  timeframe TEXT NOT NULL,
  evaluation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_strategy_evaluations_strategy_id ON public.strategy_evaluations(strategy_id);
CREATE INDEX idx_strategy_evaluations_timeframe ON public.strategy_evaluations(timeframe);
CREATE INDEX idx_strategy_evaluations_next_due ON public.strategy_evaluations(next_evaluation_due);
CREATE INDEX idx_strategy_evaluations_combined ON public.strategy_evaluations(timeframe, next_evaluation_due);

-- Enable RLS
ALTER TABLE public.strategy_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own strategy evaluations" 
  ON public.strategy_evaluations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies 
      WHERE strategies.id = strategy_evaluations.strategy_id 
      AND strategies.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage strategy evaluations" 
  ON public.strategy_evaluations 
  FOR ALL 
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_strategy_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_strategy_evaluations_updated_at_trigger
  BEFORE UPDATE ON public.strategy_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_evaluations_updated_at();

-- Initialize strategy_evaluations for existing strategies
INSERT INTO public.strategy_evaluations (strategy_id, timeframe, last_evaluated_at, next_evaluation_due)
SELECT 
  id,
  timeframe,
  NOW() - INTERVAL '1 hour', -- Set last evaluation in the past
  CASE 
    WHEN timeframe = '1m' THEN NOW()
    WHEN timeframe = '5m' THEN DATE_TRUNC('minute', NOW()) + INTERVAL '5 minutes' * ((EXTRACT(MINUTE FROM NOW())::integer / 5) + 1)
    WHEN timeframe = '15m' THEN DATE_TRUNC('minute', NOW()) + INTERVAL '15 minutes' * ((EXTRACT(MINUTE FROM NOW())::integer / 15) + 1)
    WHEN timeframe = '1h' THEN DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour'
    WHEN timeframe = '4h' THEN DATE_TRUNC('hour', NOW()) + INTERVAL '4 hours' * ((EXTRACT(HOUR FROM NOW())::integer / 4) + 1)
    WHEN timeframe = 'Daily' THEN DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') + INTERVAL '1 day' + INTERVAL '16 hours' -- 4 PM ET next day
    WHEN timeframe = 'Weekly' THEN DATE_TRUNC('week', NOW() AT TIME ZONE 'America/New_York') + INTERVAL '1 week' + INTERVAL '4 days' + INTERVAL '16 hours' -- Friday 4 PM ET
    ELSE NOW() + INTERVAL '1 hour'
  END
FROM public.strategies
WHERE is_active = true
ON CONFLICT DO NOTHING;
