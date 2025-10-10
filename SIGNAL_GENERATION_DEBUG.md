# 交易信号不生成问题 - 诊断和修复

## 问题描述

交易策略的信号没有被成功生成。

## 可能的原因

### 1. Timeframe 调度过滤问题 ⚠️

我们刚刚添加的智能 Timeframe 调度功能可能过滤掉了所有策略。

**检查方法：**

```sql
-- 查看活跃策略数量
SELECT COUNT(*) as active_strategies 
FROM strategies 
WHERE is_active = true;

-- 查看策略评估记录
SELECT 
  s.name,
  s.timeframe,
  se.last_evaluated_at,
  se.next_evaluation_due,
  CASE 
    WHEN se.next_evaluation_due IS NULL THEN '应该立即评估（无记录）'
    WHEN se.next_evaluation_due <= NOW() THEN '应该评估（时间已到）'
    ELSE '跳过（时间未到）'
  END as evaluation_status,
  EXTRACT(EPOCH FROM (se.next_evaluation_due - NOW()))/60 as minutes_until_due
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY s.name;
```

### 2. 市场时间检查

Edge Function 会检查市场是否开放（美东时间 9:30 AM - 4:00 PM）。

**检查当前是否在市场时间：**

```sql
-- 查看当前时间（UTC）
SELECT NOW() as utc_time;

-- 查看当前美东时间（需要考虑冬夏令时）
-- 冬令时(11月-3月): UTC-5
-- 夏令时(4月-10月): UTC-4
```

### 3. Cron Job 配置

确认 cron job 是否正常运行。

```sql
-- 查看已调度的 cron jobs
SELECT * FROM cron.job ORDER BY jobid;

-- 查看 cron job 运行历史
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### 4. Edge Function 部署状态

确认最新的 Edge Function 是否已部署。

```bash
# 查看部署历史
supabase functions list

# 查看函数日志
supabase functions logs monitor-trading-signals --limit 50
```

## 快速修复方案

### 方案 1: 重置策略评估时间（推荐）

如果 `strategy_evaluations` 表有旧记录导致策略被跳过：

```sql
-- 方法A: 删除所有评估记录，让系统重新初始化
DELETE FROM strategy_evaluations;

-- 方法B: 将所有策略的下次评估时间设置为现在（立即评估）
UPDATE strategy_evaluations 
SET next_evaluation_due = NOW() - INTERVAL '1 minute',
    last_evaluated_at = NOW() - INTERVAL '1 hour';
```

### 方案 2: 临时禁用 Timeframe 过滤

如果需要立即恢复信号生成，可以临时修改代码跳过 timeframe 检查。

**在 `monitor-trading-signals/index.ts` 中：**

找到这段代码（约 1299-1305 行）：

```typescript
// Filter strategies based on timeframe schedule
const currentTime = new Date();
const strategiesToProcess = strategies?.filter(strategy => {
  const evaluation = evaluationMap.get(strategy.id);
  return TimeframeEvaluationManager.shouldEvaluateNow(strategy, evaluation, currentTime);
}) || [];
```

**临时修改为：**

```typescript
// TEMPORARY: Skip timeframe filtering for debugging
const currentTime = new Date();
const strategiesToProcess = strategies || [];  // 处理所有策略
logWarn('⚠️ TEMPORARY: Timeframe filtering disabled for debugging');
```

### 方案 3: 初始化策略评估记录

确保所有活跃策略都有评估记录：

```sql
-- 为所有没有评估记录的活跃策略创建记录
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
  NOW() - INTERVAL '1 hour',  -- 上次评估设为1小时前
  NOW() - INTERVAL '1 minute', -- 下次评估设为现在（立即评估）
  0
FROM strategies
WHERE is_active = true
  AND id NOT IN (SELECT strategy_id FROM strategy_evaluations)
ON CONFLICT (strategy_id) DO NOTHING;
```

## 诊断步骤

### Step 1: 检查活跃策略

```sql
SELECT COUNT(*) FROM strategies WHERE is_active = true;
```

**预期结果：** 应该有 > 0 个活跃策略

### Step 2: 检查策略评估状态

```sql
SELECT 
  s.name,
  s.timeframe,
  s.is_active,
  se.next_evaluation_due,
  CASE 
    WHEN se.id IS NULL THEN '无评估记录（应立即评估）'
    WHEN se.next_evaluation_due <= NOW() THEN '时间已到（应评估）'
    ELSE CONCAT('等待中（', ROUND(EXTRACT(EPOCH FROM (se.next_evaluation_due - NOW()))/60), '分钟后）')
  END as status
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true;
```

**预期结果：** 至少应该有一些策略显示"应立即评估"或"时间已到"

### Step 3: 检查最近的信号

```sql
SELECT 
  created_at,
  signal_type,
  signal_data->>'strategy_name' as strategy_name
FROM trading_signals
ORDER BY created_at DESC
LIMIT 10;
```

**预期结果：** 应该有最近的信号记录

### Step 4: 检查 Cron Job 运行

```sql
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname LIKE '%signal%'
ORDER BY jobid;
```

**预期结果：** 应该有 `optimized-signal-monitor` job，且 `active = true`

### Step 5: 手动触发测试

使用 Supabase Dashboard 或 API 手动触发函数：

```bash
# 使用 curl 测试
curl -X POST "https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual_test",
    "optimized": true,
    "parallel_processing": true
  }'
```

## 永久解决方案

### 添加自动初始化触发器

创建一个触发器，在策略激活时自动创建评估记录：

```sql
CREATE OR REPLACE FUNCTION auto_initialize_strategy_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  -- 当策略被激活时，确保有评估记录
  IF NEW.is_active = true THEN
    INSERT INTO strategy_evaluations (
      strategy_id,
      timeframe,
      last_evaluated_at,
      next_evaluation_due,
      evaluation_count
    ) VALUES (
      NEW.id,
      NEW.timeframe,
      NOW() - INTERVAL '1 hour',
      NOW(),  -- 立即评估
      0
    )
    ON CONFLICT (strategy_id) DO UPDATE SET
      timeframe = NEW.timeframe,
      next_evaluation_due = NOW(),  -- 重置为立即评估
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_initialize_strategy_evaluation
  AFTER INSERT OR UPDATE OF is_active, timeframe
  ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_strategy_evaluation();
```

## 监控和日志

### 查看 Edge Function 日志

在 Supabase Dashboard:
1. 进入 Functions → monitor-trading-signals
2. 查看 Logs 标签
3. 查找以下关键日志：
   - `📋 Found X active strategies`
   - `🎯 Processing Y strategies (filtered by timeframe schedule)`
   - `✅ Strategy "XXX": Due for evaluation`
   - `⏭️ Strategy "XXX": Skipping - next check in X minutes`

### 预期的正常日志输出

```
🚀 Starting OPTIMIZED signal monitoring at: 2025-01-15T14:30:00Z
📋 Found 10 active strategies
✅ Strategy "RSI 5min": First evaluation (no record)
✅ Strategy "MACD 15min": Due for evaluation (15m)
⏭️ Strategy "Daily Trend": Skipping - next check in 360 minutes
🎯 Processing 5 strategies (filtered by timeframe schedule)
🚨 SIGNAL DETECTED: RSI 5min
✅ Signal abc-123 created (parallel)
📝 Updated evaluation record for RSI 5min
```

## 总结

最可能的问题是 **Timeframe 过滤导致所有策略被跳过**。

**立即行动：**
1. 运行诊断 SQL 检查策略评估状态
2. 如果所有策略都被跳过，运行快速修复方案 1
3. 添加自动初始化触发器防止未来出现同样问题

