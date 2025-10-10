# 数据库迁移部署顺序

## ⚠️ 重要：必须按顺序执行

由于 `strategy_evaluations` 表不存在，你需要按照以下顺序执行迁移：

---

## 第一步：创建 strategy_evaluations 表

**文件：** `supabase/migrations/20250627154858-cc37d108-9240-4a0e-9c86-106237eb0266.sql`

这个文件会：
- 创建 `strategy_evaluations` 表
- 添加索引和 RLS 策略
- 初始化现有策略的评估记录

**执行方法：**

在 Supabase Dashboard 的 SQL Editor 中运行此文件的内容。

---

## 第二步：创建每日信号计数递增函数

**文件：** `supabase/migrations/20250111000000_create_increment_daily_signal_count_function.sql`

这个文件会：
- 创建原子递增函数 `increment_daily_signal_count`
- 修复 Daily Signal Limit 计数问题

---

## 第三步：修复策略评估时间

**文件：** `supabase/migrations/20250111000001_fix_strategy_evaluations_immediate.sql`

这个文件会：
- 重置所有评估记录的时间，确保立即评估
- 添加自动初始化触发器

---

## 快速部署脚本

复制以下内容到 Supabase Dashboard 的 SQL Editor 并一次性执行：

```sql
-- ============================================
-- 第一步：创建 strategy_evaluations 表
-- ============================================

-- Create table to track strategy evaluations and timing
CREATE TABLE IF NOT EXISTS public.strategy_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  next_evaluation_due TIMESTAMP WITH TIME ZONE,
  timeframe TEXT NOT NULL,
  evaluation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(strategy_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_strategy_id ON public.strategy_evaluations(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_timeframe ON public.strategy_evaluations(timeframe);
CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_next_due ON public.strategy_evaluations(next_evaluation_due);
CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_combined ON public.strategy_evaluations(timeframe, next_evaluation_due);

-- Enable RLS
ALTER TABLE public.strategy_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own strategy evaluations" ON public.strategy_evaluations;
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

DROP POLICY IF EXISTS "System can manage strategy evaluations" ON public.strategy_evaluations;
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

DROP TRIGGER IF EXISTS update_strategy_evaluations_updated_at_trigger ON public.strategy_evaluations;
CREATE TRIGGER update_strategy_evaluations_updated_at_trigger
  BEFORE UPDATE ON public.strategy_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_evaluations_updated_at();

-- ============================================
-- 第二步：创建每日信号计数递增函数
-- ============================================

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_daily_signal_count(UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_signal_count(UUID, UUID, DATE) TO service_role;

-- ============================================
-- 第三步：初始化和修复策略评估记录
-- ============================================

-- 为所有活跃策略创建评估记录（设置为立即评估）
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
  NOW() - INTERVAL '2 hours',  -- 上次评估设为2小时前
  NOW() - INTERVAL '1 minute', -- 下次评估设为1分钟前（立即评估）
  0
FROM public.strategies
WHERE is_active = true
ON CONFLICT (strategy_id) DO UPDATE SET
  next_evaluation_due = NOW() - INTERVAL '1 minute',
  last_evaluated_at = NOW() - INTERVAL '2 hours',
  updated_at = NOW();

-- 创建自动初始化触发器
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
      next_evaluation_due = NOW() - INTERVAL '1 minute',
      last_evaluated_at = NOW() - INTERVAL '1 hour',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_initialize_strategy_evaluation ON public.strategies;
CREATE TRIGGER trigger_auto_initialize_strategy_evaluation
  AFTER INSERT OR UPDATE OF is_active, timeframe
  ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_strategy_evaluation();

-- ============================================
-- 验证部署结果
-- ============================================

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
  RAISE NOTICE '数据库迁移完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '活跃策略数量: %', active_count;
  RAISE NOTICE '评估记录数量: %', eval_count;
  RAISE NOTICE '可立即评估的策略: %', immediate_eval_count;
  RAISE NOTICE '========================================';
  
  IF immediate_eval_count < active_count THEN
    RAISE WARNING '警告: 仍有 % 个活跃策略无法立即评估！', (active_count - immediate_eval_count);
  ELSIF active_count > 0 THEN
    RAISE NOTICE '✅ 所有活跃策略现在都可以立即评估！';
    RAISE NOTICE '✅ 信号生成功能已恢复正常！';
  ELSE
    RAISE NOTICE 'ℹ️  当前没有活跃策略';
  END IF;
END $$;
```

---

## 部署后验证

运行以下查询确认一切正常：

```sql
-- 1. 检查表是否存在
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'strategy_evaluations';

-- 2. 检查所有活跃策略的评估状态
SELECT 
  s.name,
  s.timeframe,
  s.is_active,
  se.next_evaluation_due,
  CASE 
    WHEN se.id IS NULL THEN '❌ 无评估记录'
    WHEN se.next_evaluation_due <= NOW() THEN '✅ 可立即评估'
    ELSE CONCAT('⏳ 等待 ', ROUND(EXTRACT(EPOCH FROM (se.next_evaluation_due - NOW()))/60), ' 分钟')
  END as status
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY s.name;

-- 3. 检查函数是否创建
SELECT proname, prosrc FROM pg_proc WHERE proname = 'increment_daily_signal_count';
```

**预期结果：**
- 所有活跃策略应该显示 "✅ 可立即评估"
- 函数应该存在

---

## 常见问题

### Q: 为什么表不存在？
A: 之前的迁移文件可能没有被执行到数据库。现在通过上面的脚本一次性完成所有设置。

### Q: 执行后信号还是不生成？
A: 
1. 等待 1-2 分钟让 cron job 运行
2. 检查 Edge Function 日志
3. 确认策略是 `is_active = true`
4. 确认市场处于开放时间

### Q: 如何查看信号是否生成？
A:
```sql
SELECT 
  created_at,
  signal_type,
  signal_data->>'strategy_name' as strategy_name,
  signal_data->>'current_price' as price
FROM trading_signals
ORDER BY created_at DESC
LIMIT 10;
```

---

## 总结

✅ 一键脚本包含了所有必要的迁移  
✅ 自动初始化所有活跃策略  
✅ 添加了自动化触发器  
✅ 包含验证步骤确认成功  

**执行这个脚本后，信号生成功能应该立即恢复！** 🎉

