
-- Add missing RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing policies for notification_logs
CREATE POLICY "Users can insert their own notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification logs" 
ON public.notification_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification logs" 
ON public.notification_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add policies for trading_signals if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trading_signals') THEN
    EXECUTE 'CREATE POLICY "Users can insert signals for their strategies" 
    ON public.trading_signals 
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.strategies 
        WHERE id = strategy_id AND user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Users can update signals for their strategies" 
    ON public.trading_signals 
    FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM public.strategies 
        WHERE id = strategy_id AND user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Users can delete signals for their strategies" 
    ON public.trading_signals 
    FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM public.strategies 
        WHERE id = strategy_id AND user_id = auth.uid()
      )
    )';
  END IF;
END
$$;
