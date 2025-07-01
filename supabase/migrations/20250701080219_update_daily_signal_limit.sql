
-- Update the check constraint to allow higher daily signal limits up to 390
ALTER TABLE public.strategies 
DROP CONSTRAINT IF EXISTS strategies_daily_signal_limit_check;

-- Add a new constraint with a higher maximum limit (390 for intraday strategies)
ALTER TABLE public.strategies 
ADD CONSTRAINT strategies_daily_signal_limit_check 
CHECK (daily_signal_limit >= 1 AND daily_signal_limit <= 390);
