-- 检查信号生成状态的 SQL 查询
-- 请在 Supabase Dashboard → SQL Editor 中运行这些查询

-- ==========================================
-- 1. 检查活跃的策略
-- ==========================================
SELECT 
  id,
  name,
  target_asset,
  timeframe,
  is_active,
  created_at
FROM strategies 
WHERE is_active = true
ORDER BY created_at DESC;

-- ==========================================
-- 2. 检查策略的规则配置
-- ==========================================
SELECT 
  s.name as strategy_name,
  rg.rule_type,
  rg.logic,
  COUNT(tr.id) as rule_count
FROM strategies s
JOIN rule_groups rg ON s.id = rg.strategy_id
LEFT JOIN trading_rules tr ON rg.id = tr.rule_group_id
WHERE s.is_active = true
GROUP BY s.id, s.name, rg.id, rg.rule_type, rg.logic
ORDER BY s.name, rg.rule_type;

-- ==========================================
-- 3. 检查交易规则的详细配置
-- ==========================================
SELECT 
  s.name as strategy_name,
  rg.rule_type,
  tr.left_type,
  tr.left_indicator,
  tr.left_value,
  tr.condition,
  tr.right_type,
  tr.right_indicator,
  tr.right_value
FROM strategies s
JOIN rule_groups rg ON s.id = rg.strategy_id
JOIN trading_rules tr ON rg.id = tr.rule_group_id
WHERE s.is_active = true
ORDER BY s.name, rg.rule_type, tr.created_at;

-- ==========================================
-- 4. 检查策略评估记录
-- ==========================================
SELECT 
  s.name as strategy_name,
  s.timeframe,
  se.last_evaluated_at,
  se.next_evaluation_due,
  CASE 
    WHEN se.next_evaluation_due IS NULL THEN '无评估记录 - 应该立即评估'
    WHEN se.next_evaluation_due <= NOW() THEN '时间已到 - 应该评估'
    ELSE CONCAT('等待中 - 还需 ', 
                ROUND(EXTRACT(EPOCH FROM (se.next_evaluation_due - NOW()))/60), 
                ' 分钟')
  END as evaluation_status,
  se.evaluation_count
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY s.name;

-- ==========================================
-- 5. 检查最近的信号
-- ==========================================
SELECT 
  ts.id,
  ts.signal_type,
  ts.signal_data->>'strategy_name' as strategy_name,
  ts.signal_data->>'asset' as asset,
  ts.signal_data->>'current_price' as price,
  ts.created_at,
  AGE(NOW(), ts.created_at) as time_ago
FROM trading_signals ts
ORDER BY ts.created_at DESC
LIMIT 20;

-- ==========================================
-- 6. 检查 Cron Job 状态
-- ==========================================
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%signal%'
ORDER BY jobname;

-- ==========================================
-- 7. 检查 Cron Job 运行历史
-- ==========================================
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE '%signal%'
)
ORDER BY start_time DESC
LIMIT 10;

-- ==========================================
-- 8. 强制重置评估时间（如果需要）
-- ==========================================
-- 取消注释以下代码来强制所有策略立即评估
/*
UPDATE strategy_evaluations
SET 
  next_evaluation_due = NOW() - INTERVAL '1 minute',
  last_evaluated_at = NOW() - INTERVAL '2 hours'
WHERE strategy_id IN (
  SELECT id FROM strategies WHERE is_active = true
);

SELECT 
  s.name,
  '已重置为立即评估' as status
FROM strategies s
WHERE s.is_active = true;
*/

-- ==========================================
-- 9. 检查是否有任何错误日志
-- ==========================================
SELECT 
  *
FROM webhook_errors
WHERE webhook_type LIKE '%signal%' 
  OR event_type LIKE '%signal%'
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- 总结
-- ==========================================
SELECT 
  '活跃策略数' as metric,
  COUNT(*)::TEXT as value
FROM strategies 
WHERE is_active = true

UNION ALL

SELECT 
  '有评估记录的策略',
  COUNT(DISTINCT strategy_id)::TEXT
FROM strategy_evaluations

UNION ALL

SELECT 
  '可立即评估的策略',
  COUNT(*)::TEXT
FROM strategy_evaluations 
WHERE next_evaluation_due <= NOW()

UNION ALL

SELECT 
  '今天生成的信号',
  COUNT(*)::TEXT
FROM trading_signals
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT 
  '最近1小时的信号',
  COUNT(*)::TEXT
FROM trading_signals
WHERE created_at >= NOW() - INTERVAL '1 hour';

