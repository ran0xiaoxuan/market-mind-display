-- Add account capital and risk tolerance fields to strategies table
-- This allows users to specify their investment amount and risk preference

-- Add new columns to the strategies table
ALTER TABLE public.strategies 
ADD COLUMN IF NOT EXISTS account_capital numeric DEFAULT 10000 CHECK (account_capital >= 100),
ADD COLUMN IF NOT EXISTS risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive'));

-- Add comments for documentation
COMMENT ON COLUMN public.strategies.account_capital IS 'Total capital allocated to this strategy (minimum $100)';
COMMENT ON COLUMN public.strategies.risk_tolerance IS 'Risk preference: conservative (defensive), moderate (balanced), aggressive (offensive)';

-- Update existing strategies with default values if they don't have them
UPDATE public.strategies 
SET account_capital = 10000 
WHERE account_capital IS NULL;

UPDATE public.strategies 
SET risk_tolerance = 'moderate' 
WHERE risk_tolerance IS NULL;

