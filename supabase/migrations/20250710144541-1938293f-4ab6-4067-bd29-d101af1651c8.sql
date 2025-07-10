
-- Remove the existing conflicting check constraint
ALTER TABLE public.strategies 
DROP CONSTRAINT IF EXISTS strategies_daily_signal_limit_check;

-- Add the correct constraint that allows up to 390 (matching the frontend validation)
ALTER TABLE public.strategies 
ADD CONSTRAINT strategies_daily_signal_limit_check 
CHECK (daily_signal_limit >= 1 AND daily_signal_limit <= 390);
