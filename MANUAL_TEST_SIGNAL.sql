-- 手动触发信号生成测试
-- 这个脚本会尝试手动评估策略并生成测试数据

-- ==========================================
-- 1. 强制重置所有活跃策略的评估时间
-- ==========================================
-- 这会让它们在下次 Cron 运行时立即被评估
UPDATE strategy_evaluations
SET 
  next_evaluation_due = NOW() - INTERVAL '1 minute',
  last_evaluated_at = NOW() - INTERVAL '2 hours',
  updated_at = NOW()
WHERE strategy_id IN (
  SELECT id FROM strategies WHERE is_active = true
);

-- 查看重置结果
SELECT 
  s.name as strategy_name,
  s.timeframe,
  se.next_evaluation_due,
  '✓ 已设置为立即评估' as status,
  '等待下次 Cron Job 运行（每分钟一次）' as next_step
FROM strategies s
JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY s.name;

-- ==========================================
-- 2. 为没有评估记录的策略创建记录
-- ==========================================
INSERT INTO strategy_evaluations (
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
  NOW() - INTERVAL '1 minute',
  0
FROM strategies
WHERE is_active = true
  AND id NOT IN (SELECT strategy_id FROM strategy_evaluations)
ON CONFLICT (strategy_id) DO NOTHING;

-- 查看新创建的记录
SELECT 
  s.name,
  '✓ 评估记录已创建' as status
FROM strategies s
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM strategy_evaluations se 
    WHERE se.strategy_id = s.id 
    AND se.created_at < NOW() - INTERVAL '1 minute'
  );

-- ==========================================
-- 3. 检查配置完整性
-- ==========================================
-- 检查每个策略是否有完整的配置
WITH strategy_check AS (
  SELECT 
    s.id,
    s.name,
    s.target_asset,
    s.timeframe,
    s.is_active,
    COUNT(DISTINCT rg.id) FILTER (WHERE rg.rule_type = 'entry') as entry_groups,
    COUNT(tr.id) FILTER (WHERE rg.rule_type = 'entry') as entry_rules
  FROM strategies s
  LEFT JOIN rule_groups rg ON s.id = rg.strategy_id
  LEFT JOIN trading_rules tr ON rg.id = tr.rule_group_id
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.target_asset, s.timeframe, s.is_active
)
SELECT 
  name,
  target_asset,
  timeframe,
  entry_groups,
  entry_rules,
  CASE 
    WHEN target_asset IS NULL THEN '✗ 缺少标的资产'
    WHEN entry_groups = 0 THEN '✗ 缺少entry规则组'
    WHEN entry_rules = 0 THEN '✗ 缺少entry规则'
    ELSE '✓ 配置完整'
  END as config_status
FROM strategy_check
ORDER BY name;

-- ==========================================
-- 4. 显示下一步操作
-- ==========================================
SELECT 
  '下一步操作' as step,
  '说明' as description
UNION ALL
SELECT 
  '1',
  '等待1-2分钟，让 Cron Job 运行'
UNION ALL
SELECT 
  '2',
  '检查 Edge Function 日志（Supabase Dashboard → Edge Functions → Logs）'
UNION ALL
SELECT 
  '3',
  '如果看到错误，复制错误信息'
UNION ALL
SELECT 
  '4',
  '运行下面的查询检查是否有新信号';

-- ==========================================
-- 5. 检查是否有新信号生成（等待2分钟后运行）
-- ==========================================
-- 等待 2 分钟后运行这个查询
/*
SELECT 
  id,
  signal_type,
  signal_data->>'strategy_name' as strategy,
  signal_data->>'current_price' as price,
  created_at,
  AGE(NOW(), created_at) as age
FROM trading_signals
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
*/

-- ==========================================
-- 提示信息
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '策略评估时间已重置';
  RAISE NOTICE '========================================';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '1. 等待 1-2 分钟';
  RAISE NOTICE '2. 检查 Supabase Dashboard → Edge Functions → monitor-trading-signals → Logs';
  RAISE NOTICE '3. 查找日志中的评估信息和错误';
  RAISE NOTICE '4. 如果没有日志，说明 Edge Function 可能没有运行或未部署';
  RAISE NOTICE '========================================';
END $$;

