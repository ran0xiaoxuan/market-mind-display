-- 修复策略评估记录，确保所有活跃策略可以立即被评估
-- 这个迁移解决了信号不生成的问题

-- 步骤 1: 重置所有现有评估记录的时间，使其立即可评估
UPDATE public.strategy_evaluations
SET 
  last_evaluated_at = NOW() - INTERVAL '2 hours',
  next_evaluation_due = NOW() - INTERVAL '1 minute',  -- 设为1分钟前，确保立即评估
  updated_at = NOW()
WHERE strategy_id IN (
  SELECT id FROM public.strategies WHERE is_active = true
);

-- 步骤 2: 为所有没有评估记录的活跃策略创建记录
INSERT INTO public.strategy_evaluations (
  strategy_id,
  timeframe,
  last_evaluated_at,
  next_evaluation_due,
  evaluation_count
)
SELECT 
  id,
  timeframe,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 minute',  -- 设为1分钟前，确保立即评估
  0
FROM public.strategies
WHERE is_active = true
  AND id NOT IN (SELECT strategy_id FROM public.strategy_evaluations)
ON CONFLICT (strategy_id) DO UPDATE SET
  next_evaluation_due = NOW() - INTERVAL '1 minute',
  last_evaluated_at = NOW() - INTERVAL '2 hours',
  updated_at = NOW();

-- 步骤 3: 创建触发器，在策略激活时自动初始化评估记录
CREATE OR REPLACE FUNCTION auto_initialize_strategy_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  -- 当策略被激活时，确保有评估记录
  IF NEW.is_active = true THEN
    INSERT INTO public.strategy_evaluations (
      strategy_id,
      timeframe,
      last_evaluated_at,
      next_evaluation_due,
      evaluation_count
    ) VALUES (
      NEW.id,
      NEW.timeframe,
      NOW() - INTERVAL '1 hour',
      NOW() - INTERVAL '1 minute',  -- 立即评估
      0
    )
    ON CONFLICT (strategy_id) DO UPDATE SET
      timeframe = NEW.timeframe,
      next_evaluation_due = NOW() - INTERVAL '1 minute',  -- 重置为立即评估
      last_evaluated_at = NOW() - INTERVAL '1 hour',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_auto_initialize_strategy_evaluation ON public.strategies;

-- 创建新触发器
CREATE TRIGGER trigger_auto_initialize_strategy_evaluation
  AFTER INSERT OR UPDATE OF is_active, timeframe
  ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_strategy_evaluation();

-- 添加注释
COMMENT ON FUNCTION auto_initialize_strategy_evaluation IS 
  'Automatically initializes or updates strategy evaluation records when a strategy is activated or its timeframe is changed. Ensures strategies can be evaluated immediately.';

-- 验证修复
DO $$
DECLARE
  active_count INTEGER;
  eval_count INTEGER;
  immediate_eval_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.strategies WHERE is_active = true;
  SELECT COUNT(*) INTO eval_count FROM public.strategy_evaluations;
  SELECT COUNT(*) INTO immediate_eval_count 
  FROM public.strategy_evaluations 
  WHERE next_evaluation_due <= NOW();
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '策略评估修复完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '活跃策略数量: %', active_count;
  RAISE NOTICE '评估记录数量: %', eval_count;
  RAISE NOTICE '可立即评估的策略: %', immediate_eval_count;
  RAISE NOTICE '========================================';
  
  IF immediate_eval_count < active_count THEN
    RAISE WARNING '警告: 仍有 % 个活跃策略无法立即评估！', (active_count - immediate_eval_count);
  ELSE
    RAISE NOTICE '✅ 所有活跃策略现在都可以立即评估';
  END IF;
END $$;

