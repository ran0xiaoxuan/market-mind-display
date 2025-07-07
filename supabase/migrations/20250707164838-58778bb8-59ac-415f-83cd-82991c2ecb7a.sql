
-- Allow users to insert trading signals for their own strategies
CREATE POLICY "Users can create signals for their strategies" ON public.trading_signals
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE strategies.id = trading_signals.strategy_id 
    AND strategies.user_id = auth.uid()
  )
);

-- Also allow users to update signals for their strategies (needed for marking as processed)
CREATE POLICY "Users can update signals for their strategies" ON public.trading_signals
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE strategies.id = trading_signals.strategy_id 
    AND strategies.user_id = auth.uid()
  )
);

-- Allow service role to insert notification logs
CREATE POLICY "Service role can insert notification logs" ON public.notification_logs
FOR INSERT 
WITH CHECK (true);
