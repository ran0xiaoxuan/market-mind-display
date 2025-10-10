-- Create atomic increment function for daily signal counts
-- This prevents race conditions when multiple signals are generated simultaneously

CREATE OR REPLACE FUNCTION public.increment_daily_signal_count(
  p_strategy_id UUID,
  p_user_id UUID,
  p_signal_date DATE
)
RETURNS void AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT for atomic upsert with increment
  INSERT INTO public.daily_signal_counts (
    strategy_id,
    user_id,
    signal_date,
    notification_count,
    created_at,
    updated_at
  ) VALUES (
    p_strategy_id,
    p_user_id,
    p_signal_date,
    1,  -- Start at 1 for new record
    NOW(),
    NOW()
  )
  ON CONFLICT (strategy_id, signal_date)
  DO UPDATE SET
    notification_count = daily_signal_counts.notification_count + 1,  -- Increment existing count
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_daily_signal_count(UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_signal_count(UUID, UUID, DATE) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.increment_daily_signal_count IS 
  'Atomically increments the daily signal count for a strategy. Creates a new record if it doesn''t exist, or increments the existing count.';

