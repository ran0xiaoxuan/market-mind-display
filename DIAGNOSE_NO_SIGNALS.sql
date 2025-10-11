-- 深度诊断：为什么没有生成信号
-- 在 Supabase SQL Editor 中运行

-- ==========================================
-- 1. 详细检查第一个活跃策略的规则配置
-- ==========================================
WITH first_strategy AS (
  SELECT id, name FROM strategies WHERE is_active = true LIMIT 1
)
SELECT 
  s.name as strategy_name,
  s.target_asset,
  s.timeframe,
  rg.rule_type,
  rg.logic,
  rg.required_conditions,
  tr.left_type,
  tr.left_indicator,
  tr.left_parameters,
  tr.left_value,
  tr.condition,
  tr.right_type,
  tr.right_indicator,
  tr.right_parameters,
  tr.right_value,
  -- 检查格式是否正确
  CASE 
    WHEN tr.left_type IN ('INDICATOR', 'PRICE', 'VALUE') THEN '✓ 格式正确'
    ELSE '✗ 格式错误: ' || tr.left_type
  END as left_type_check,
  CASE 
    WHEN tr.right_type IN ('INDICATOR', 'PRICE', 'VALUE') THEN '✓ 格式正确'
    ELSE '✗ 格式错误: ' || tr.right_type
  END as right_type_check,
  -- 检查指标是否支持
  CASE 
    WHEN tr.left_indicator IS NOT NULL THEN
      CASE 
        WHEN LOWER(tr.left_indicator) IN ('sma', 'ema', 'wma', 'rsi', 'macd', 'cci', 'bollingerbands', 'bbands', 'stochastic', 'atr', 'mfi') 
        THEN '✓ 支持'
        ELSE '⚠ 不支持: ' || tr.left_indicator
      END
    ELSE '-'
  END as left_indicator_support,
  CASE 
    WHEN tr.right_indicator IS NOT NULL THEN
      CASE 
        WHEN LOWER(tr.right_indicator) IN ('sma', 'ema', 'wma', 'rsi', 'macd', 'cci', 'bollingerbands', 'bbands', 'stochastic', 'atr', 'mfi') 
        THEN '✓ 支持'
        ELSE '⚠ 不支持: ' || tr.right_indicator
      END
    ELSE '-'
  END as right_indicator_support
FROM first_strategy fs
JOIN strategies s ON s.id = fs.id
JOIN rule_groups rg ON rg.strategy_id = s.id
JOIN trading_rules tr ON tr.rule_group_id = rg.id
ORDER BY rg.rule_type, tr.created_at;

-- ==========================================
-- 2. 检查最近的 Cron Job 运行记录
-- ==========================================
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) as duration_seconds
FROM cron.job j
JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname LIKE '%signal%'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- ==========================================
-- 3. 检查是否有任何信号生成尝试的记录
-- ==========================================
SELECT 
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24_hours,
  MAX(created_at) as latest_signal
FROM trading_signals;

-- ==========================================
-- 4. 检查策略评估的实际运行情况
-- ==========================================
SELECT 
  s.name,
  s.timeframe,
  se.evaluation_count,
  se.last_evaluated_at,
  se.next_evaluation_due,
  AGE(NOW(), se.last_evaluated_at) as time_since_last_eval,
  CASE 
    WHEN se.last_evaluated_at IS NULL THEN '从未评估过'
    WHEN AGE(NOW(), se.last_evaluated_at) > INTERVAL '1 hour' THEN '⚠ 很久没评估了'
    WHEN AGE(NOW(), se.last_evaluated_at) > INTERVAL '10 minutes' THEN '可能正常'
    ELSE '✓ 最近刚评估'
  END as eval_status
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY se.last_evaluated_at DESC NULLS LAST;

-- ==========================================
-- 5. 生成测试用例 - 检查规则是否合理
-- ==========================================
-- 这会显示第一个策略的规则，以及它需要什么条件
WITH first_strategy AS (
  SELECT id, name FROM strategies WHERE is_active = true LIMIT 1
)
SELECT 
  s.name as strategy_name,
  rg.rule_type,
  STRING_AGG(
    CASE 
      WHEN tr.left_type = 'INDICATOR' THEN tr.left_indicator || '(' || COALESCE(tr.left_parameters::text, '{}') || ')'
      WHEN tr.left_type = 'PRICE' THEN 'Price(' || COALESCE(tr.left_value, 'close') || ')'
      WHEN tr.left_type = 'VALUE' THEN tr.left_value
      ELSE tr.left_type
    END || ' ' || tr.condition || ' ' ||
    CASE 
      WHEN tr.right_type = 'INDICATOR' THEN tr.right_indicator || '(' || COALESCE(tr.right_parameters::text, '{}') || ')'
      WHEN tr.right_type = 'PRICE' THEN 'Price(' || COALESCE(tr.right_value, 'close') || ')'
      WHEN tr.right_type = 'VALUE' THEN tr.right_value
      ELSE tr.right_type
    END,
    ' ' || rg.logic || ' '
  ) as rules_summary,
  COUNT(tr.id) as rule_count,
  rg.logic,
  rg.required_conditions
FROM first_strategy fs
JOIN strategies s ON s.id = fs.id
JOIN rule_groups rg ON rg.strategy_id = s.id
JOIN trading_rules tr ON tr.rule_group_id = rg.id
GROUP BY s.name, rg.id, rg.rule_type, rg.logic, rg.required_conditions
ORDER BY rg.rule_type;

-- ==========================================
-- 6. 检查是否有错误日志
-- ==========================================
SELECT 
  webhook_type,
  event_type,
  error_message,
  created_at
FROM webhook_errors
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- ==========================================
-- 7. 检查市场数据是否可用（通过最近的信号）
-- ==========================================
SELECT 
  signal_data->>'asset' as asset,
  signal_data->>'current_price' as price,
  signal_data->>'timestamp' as data_timestamp,
  created_at as signal_created
FROM trading_signals
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- 总结报告
-- ==========================================
SELECT 
  '诊断报告' as section,
  '' as detail
UNION ALL
SELECT 
  '活跃策略数',
  COUNT(*)::TEXT
FROM strategies WHERE is_active = true
UNION ALL
SELECT 
  '有entry规则的策略数',
  COUNT(DISTINCT s.id)::TEXT
FROM strategies s
JOIN rule_groups rg ON s.id = rg.strategy_id
WHERE s.is_active = true AND rg.rule_type = 'entry'
UNION ALL
SELECT 
  'entry规则总数',
  COUNT(tr.id)::TEXT
FROM strategies s
JOIN rule_groups rg ON s.id = rg.strategy_id
JOIN trading_rules tr ON rg.id = tr.rule_group_id
WHERE s.is_active = true AND rg.rule_type = 'entry'
UNION ALL
SELECT 
  '最近一次评估时间',
  TO_CHAR(MAX(last_evaluated_at), 'YYYY-MM-DD HH24:MI:SS')
FROM strategy_evaluations
WHERE strategy_id IN (SELECT id FROM strategies WHERE is_active = true)
UNION ALL
SELECT 
  '总评估次数',
  SUM(evaluation_count)::TEXT
FROM strategy_evaluations
WHERE strategy_id IN (SELECT id FROM strategies WHERE is_active = true)
UNION ALL
SELECT 
  '今天生成的信号数',
  COUNT(*)::TEXT
FROM trading_signals
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
  '使用不支持指标的规则数',
  COUNT(*)::TEXT
FROM trading_rules tr
WHERE tr.left_indicator IS NOT NULL 
  AND LOWER(tr.left_indicator) NOT IN ('sma', 'ema', 'wma', 'rsi', 'macd', 'cci', 'bollingerbands', 'bbands', 'stochastic', 'atr', 'mfi')
UNION ALL
SELECT 
  'Cron Job 活跃数',
  COUNT(*)::TEXT
FROM cron.job
WHERE jobname LIKE '%signal%' AND active = true;

