
-- Step 1: Update the strategies table RLS policy to remove reference to recommended_strategies
DROP POLICY IF EXISTS "Allow read access to recommended strategies" ON public.strategies;

-- Create a new policy that only allows users to read their own strategies
CREATE POLICY "Users can read their own strategies" ON public.strategies
FOR SELECT 
USING (user_id = auth.uid());

-- Step 2: Drop all RLS policies on the recommended_strategies table
DROP POLICY IF EXISTS "Admins can manage recommended strategies" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Allow admin to manage recommendations" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Allow read access to public recommendations" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Anyone can view recommendations" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Everyone can view public recommended strategies" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Only authorized users can create recommendations" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.recommended_strategies;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.recommended_strategies;

-- Step 3: Drop any foreign key constraints (if any exist)
-- Note: Based on the schema, there don't appear to be explicit foreign keys, but we'll check for any that might exist
ALTER TABLE public.recommended_strategies DROP CONSTRAINT IF EXISTS recommended_strategies_strategy_id_fkey;
ALTER TABLE public.recommended_strategies DROP CONSTRAINT IF EXISTS recommended_strategies_recommended_by_fkey;

-- Step 4: Drop the recommended_strategies table
DROP TABLE IF EXISTS public.recommended_strategies;

-- Step 5: Remove the strategy_applications table as well since it's also unused
DROP TABLE IF EXISTS public.strategy_applications;
