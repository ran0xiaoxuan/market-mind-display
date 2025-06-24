
-- Update the delete_strategy_cascade function to include trading_signals and notification_logs cleanup
CREATE OR REPLACE FUNCTION public.delete_strategy_cascade(strategy_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if strategy can be deleted first
  IF EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE id = strategy_uuid 
    AND can_be_deleted = false 
    AND EXISTS (
      SELECT 1 FROM public.strategy_recommendations 
      WHERE recommended_strategy_id = strategy_uuid
    )
  ) THEN
    RAISE EXCEPTION 'This strategy cannot be deleted as it is published in recommendations';
  END IF;

  -- Delete in the correct order to avoid foreign key violations
  
  -- 1. Delete notification logs first (they reference trading signals)
  DELETE FROM public.notification_logs 
  WHERE signal_id IN (
    SELECT id FROM public.trading_signals WHERE strategy_id = strategy_uuid
  );
  
  -- 2. Delete trading signals that belong to this strategy
  DELETE FROM public.trading_signals WHERE strategy_id = strategy_uuid;
  
  -- 3. Delete backtest trades first (they reference backtests)
  DELETE FROM public.backtest_trades 
  WHERE backtest_id IN (
    SELECT id FROM public.backtests WHERE strategy_id = strategy_uuid
  );
  
  -- 4. Delete backtests that reference this strategy
  DELETE FROM public.backtests WHERE strategy_id = strategy_uuid;
  
  -- 5. Delete trading rules that belong to rule groups of this strategy
  DELETE FROM public.trading_rules 
  WHERE rule_group_id IN (
    SELECT id FROM public.rule_groups WHERE strategy_id = strategy_uuid
  );
  
  -- 6. Delete rule groups that belong to this strategy
  DELETE FROM public.rule_groups WHERE strategy_id = strategy_uuid;
  
  -- 7. Delete strategy applications for this strategy
  DELETE FROM public.strategy_applications WHERE strategy_id = strategy_uuid;
  
  -- 8. Delete strategy copies where this is either source or copied strategy
  DELETE FROM public.strategy_copies 
  WHERE source_strategy_id = strategy_uuid OR copied_strategy_id = strategy_uuid;
  
  -- 9. Delete strategy recommendations where this is involved
  DELETE FROM public.strategy_recommendations 
  WHERE original_strategy_id = strategy_uuid OR recommended_strategy_id = strategy_uuid;
  
  -- 10. Delete strategy versions for this strategy
  DELETE FROM public.strategy_versions WHERE strategy_id = strategy_uuid;
  
  -- 11. Update any strategies that reference this one as source to remove the reference
  UPDATE public.strategies 
  SET source_strategy_id = NULL 
  WHERE source_strategy_id = strategy_uuid;
  
  -- 12. Finally delete the strategy itself
  DELETE FROM public.strategies WHERE id = strategy_uuid;
END;
$function$
