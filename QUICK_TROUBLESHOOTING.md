# 快速故障排查指南

## 🚨 问题：还是收不到真实信号

按照以下步骤逐一排查：

---

## 第1步：检查 Edge Function 是否已部署 ⚠️ **最关键**

### 问题症状
- 测试信号可以收到 ✅
- 自动信号收不到 ❌

### 原因
**Edge Function 的修复代码还没有部署到线上！**

代码修改只是在你的本地文件中，需要上传到 Supabase 才能生效。

### 解决方法（选一个）

#### 方法A：通过 Supabase Dashboard（最简单，不需要安装）

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 左侧菜单 → **Edge Functions**
4. 找到 `monitor-trading-signals`
5. 点击 **Deploy** 或 **Update**
6. 上传文件：`supabase/functions/monitor-trading-signals/index.ts`
7. 等待部署完成（1-2分钟）

#### 方法B：使用 Supabase CLI

```bash
# 1. 安装 CLI
npm install -g supabase

# 2. 登录
supabase login

# 3. 部署
cd market-mind-display-main
supabase functions deploy monitor-trading-signals
```

---

## 第2步：检查数据库配置

### 2.1 运行诊断查询

1. 打开 Supabase Dashboard → **SQL Editor**
2. 打开项目中的文件：`CHECK_SIGNAL_STATUS.sql`
3. 复制所有 SQL 查询
4. 在 SQL Editor 中逐个运行
5. 查看结果，找出问题

### 2.2 关键检查点

**检查1：是否有活跃策略？**
```sql
SELECT COUNT(*) FROM strategies WHERE is_active = true;
```
- 如果是 0 → 需要激活策略

**检查2：策略是否有规则？**
```sql
SELECT s.name, COUNT(tr.id) as rule_count
FROM strategies s
LEFT JOIN rule_groups rg ON s.id = rg.strategy_id
LEFT JOIN trading_rules tr ON rg.id = tr.rule_group_id
WHERE s.is_active = true
GROUP BY s.id, s.name;
```
- 如果 rule_count = 0 → 需要添加规则

**检查3：策略是否可以被评估？**
```sql
SELECT 
  s.name,
  se.next_evaluation_due,
  CASE 
    WHEN se.next_evaluation_due IS NULL THEN '应该评估'
    WHEN se.next_evaluation_due <= NOW() THEN '应该评估'
    ELSE '等待中'
  END as status
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true;
```
- 如果状态是"等待中" → 运行重置查询（见下面）

**检查4：Cron Job 是否在运行？**
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%signal%';
```
- 如果 active = false → Cron Job 没启用
- 如果没有记录 → Cron Job 不存在

---

## 第3步：强制重置（如果需要）

如果策略配置都正确，但还是不评估，运行以下SQL：

```sql
-- 重置所有活跃策略的评估时间
UPDATE strategy_evaluations
SET 
  next_evaluation_due = NOW() - INTERVAL '1 minute',
  last_evaluated_at = NOW() - INTERVAL '2 hours'
WHERE strategy_id IN (
  SELECT id FROM strategies WHERE is_active = true
);

-- 确认重置成功
SELECT 
  s.name,
  se.next_evaluation_due,
  '已重置 - 下次Cron运行时会评估' as status
FROM strategies s
JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true;
```

---

## 第4步：手动触发测试

如果你已经部署了 Edge Function，可以手动触发一次测试：

### 方法A：使用 Supabase Dashboard

1. Dashboard → **Edge Functions** → `monitor-trading-signals`
2. 点击 **Invoke** 或 **Test** 按钮
3. 输入 JSON：
```json
{
  "optimized": true,
  "parallel_processing": true
}
```
4. 点击 **Run**
5. 查看响应和日志

### 方法B：使用 curl（如果有）

```bash
curl -X POST "https://<your-project-ref>.supabase.co/functions/v1/monitor-trading-signals" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"optimized": true, "parallel_processing": true}'
```

---

## 第5步：查看日志

### 在 Supabase Dashboard 中：

1. **Edge Functions** → `monitor-trading-signals`
2. 点击 **Logs** 标签
3. 查找以下信息：

**成功的日志：**
```
🚀 Starting OPTIMIZED signal monitoring at: ...
📋 Found X active strategies
✅ Strategy "策略名": Due for evaluation
[RuleGroup] Evaluating group ... (entry)
[RuleGroup] Rule 1: RSI(67.42) < 70(70.00) = true
🚨 SIGNAL DETECTED: 策略名
✅ Signal abc-123 created
```

**问题日志：**
```
Market is closed - exiting early
→ 问题：非交易时间（只在美股交易时间运行）

⏭️ Strategy "策略名": Skipping - next check in X minutes
→ 问题：时间还没到（根据timeframe过滤）

⚠️ Skipping 策略名 - no target asset
→ 问题：策略没有设置标的资产

⚠️ Skipping 策略名 - no rule groups
→ 问题：策略没有规则组

❌ Error processing 策略名: Unknown indicator: ...
→ 问题：使用了不支持的指标
```

---

## 常见问题解答

### Q1: 为什么测试信号可以，但自动信号不行？

**A:** 因为它们是两套不同的代码：
- **测试信号**：使用前端代码（已修复）
- **自动信号**：使用 Edge Function（需要部署）

**解决**：按照第1步部署 Edge Function

### Q2: 部署后还是不行？

**A:** 可能是以下原因：
1. **市场时间**：只在美股交易时间运行（周一至五 9:30 AM - 4:00 PM ET）
2. **Timeframe 过滤**：策略还没到评估时间
3. **策略配置**：使用了不支持的指标

**解决**：
- 查看日志确认问题
- 运行 `CHECK_SIGNAL_STATUS.sql` 诊断
- 使用支持的10个指标

### Q3: 支持哪些指标？

**Edge Function 支持（10个）：**
- SMA, EMA, WMA
- RSI, MACD, CCI
- Bollinger Bands, Stochastic
- ATR, MFI

**暂不支持：**
- VWAP, DEMA, TEMA, HMA
- SuperTrend, ADX
- 等其他指标

**解决**：
- 使用支持的指标
- 或等待未来更新（TAAPI API集成）

### Q4: 如何强制立即生成信号？

**A:** 两个方法：
1. **重置评估时间**（见第3步的SQL）
2. **手动触发**（见第4步）

### Q5: 生成了信号但没收到通知？

**A:** 通知系统是独立的，需要：
1. Pro 订阅
2. 配置通知设置（Discord/Telegram/Email）
3. 没超过每日信号限制

---

## 🎯 快速检查清单

按顺序检查：

- [ ] **Edge Function 已部署**（最关键！）
- [ ] 有活跃的策略（`is_active = true`）
- [ ] 策略有规则组和交易规则
- [ ] 策略使用支持的指标
- [ ] 策略评估时间已到或已重置
- [ ] Cron Job 正在运行
- [ ] 在美股交易时间内（或已禁用检查）
- [ ] 查看 Edge Function 日志确认

---

## 🆘 还是不行？

如果按照以上步骤还是不行，请提供：

1. **`CHECK_SIGNAL_STATUS.sql` 的运行结果**（所有查询）
2. **Edge Function 日志**（最近的50行）
3. **你的策略配置**（截图或SQL查询结果）
4. **使用的指标名称**

这样我可以帮你精确诊断问题！

---

**最可能的问题**: Edge Function 还没部署 ⚠️  
**最快的解决方法**: 通过 Dashboard 手动部署（2分钟）

