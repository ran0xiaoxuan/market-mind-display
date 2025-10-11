# Edge Function 日志分析指南

## 📊 如何查看日志

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Edge Functions**
   - 左侧菜单 → **Edge Functions**
   - 点击 `monitor-trading-signals`

3. **查看日志**
   - 点击 **Logs** 标签
   - 查看最近的执行记录

---

## ✅ 正常日志应该显示什么

### 成功运行的完整日志：

```
🚀 Starting OPTIMIZED signal monitoring at: 2025-10-10T14:30:00Z
[MarketHours] Current EST time: Wednesday 09:35
[MarketHours] Market is OPEN
📋 Found 3 active strategies
✅ Strategy "RSI策略": Due for evaluation (1h)
⏭️ Strategy "MACD策略": Skipping - next check in 25 minutes
✅ Strategy "布林带策略": First evaluation (no record)
🎯 Processing 2 strategies (filtered by timeframe schedule)

[StrategyEvaluator] Calculating indicators for strategy: RSI策略
[StrategyEvaluator] Current prices - Close: 148.50, Open: 148.20
[Indicator] RSI(14, close): 67.42
[RuleGroup] Evaluating group abc-123 (entry) with AND logic
[Condition] Evaluating: 67.42 < 70
[RuleGroup] Rule 1: RSI(67.4200) < 70(70.0000) = true
[RuleGroup] Group result: true
[Strategy] Result - Entry: true, Exit: false

🚨 SIGNAL DETECTED: RSI策略
✅ Signal def-456 created
📝 Updated evaluation record for RSI策略
```

### 关键指标：
- ✅ 看到策略被检测到
- ✅ 看到指标被计算（实际数值）
- ✅ 看到规则被评估（具体比较）
- ✅ 看到信号被创建

---

## ❌ 问题日志及解决方案

### 问题1：根本没有日志

**日志：** (空的，什么都没有)

**原因：**
1. Edge Function 未部署或部署失败
2. Cron Job 未启用
3. Edge Function 在启动时就失败了

**解决方案：**
```sql
-- 检查 Cron Job
SELECT * FROM cron.job WHERE jobname LIKE '%signal%';

-- 如果 active = false，则需要激活
-- 或者手动部署 Edge Function
```

---

### 问题2：市场关闭

**日志：**
```
🚀 Starting OPTIMIZED signal monitoring at: 2025-10-10T02:30:00Z
[MarketHours] Current EST time: Saturday 21:30
[MarketHours] Market is CLOSED
Market is closed - exiting early
```

**原因：** 只在美股交易时间运行（周一至五 9:30 AM - 4:00 PM ET）

**解决方案：**
- 等待交易时间
- 或修改 Edge Function 禁用市场时间检查（告诉我，我帮你）

---

### 问题3：所有策略被跳过

**日志：**
```
📋 Found 3 active strategies
⏭️ Strategy "策略1": Skipping - next check in 45 minutes
⏭️ Strategy "策略2": Skipping - next check in 30 minutes
⏭️ Strategy "策略3": Skipping - next check in 15 minutes
🎯 Processing 0 strategies (filtered by timeframe schedule)
```

**原因：** Timeframe 过滤 - 策略的评估时间还没到

**解决方案：**
运行 `MANUAL_TEST_SIGNAL.sql` 重置评估时间

---

### 问题4：没有规则组

**日志：**
```
⚠️ Skipping 策略名 - no rule groups
```

**原因：** 策略没有添加交易规则

**解决方案：**
在前端为策略添加 entry 规则组和交易规则

---

### 问题5：没有标的资产

**日志：**
```
⚠️ Skipping 策略名 - no target asset
```

**原因：** 策略没有设置标的资产（股票代码）

**解决方案：**
```sql
UPDATE strategies 
SET target_asset = 'AAPL' 
WHERE id = '你的策略ID';
```

---

### 问题6：未知指标

**日志：**
```
[StrategyEvaluator] Unknown indicator: SuperTrend
❌ Error processing 策略名: Unknown indicator: SuperTrend
```

**原因：** 使用了 Edge Function 不支持的指标

**支持的指标（10个）：**
- SMA, EMA, WMA
- RSI, MACD, CCI
- Bollinger Bands, Stochastic
- ATR, MFI

**解决方案：**
- 方案A：改用支持的指标
- 方案B：使用前端测试信号（支持25个指标）
- 方案C：等待未来版本（TAAPI API 集成）

---

### 问题7：市场数据获取失败

**日志：**
```
❌ Error processing 策略名: FMP API error: 401 Unauthorized
```

**原因：** FMP API 密钥无效或配额用完

**解决方案：**
1. 检查 Supabase Secrets 中的 `FMP_API_KEY`
2. 验证 API Key 是否有效
3. 检查 FMP 账户配额

---

### 问题8：指标计算失败

**日志：**
```
[Indicator] RSI(14, close): undefined
[RuleGroup] Rule 1: (0.0000) < (70.0000) = false
```

**原因：** 
- 市场数据不足
- 指标参数错误
- 计算过程出错

**解决方案：**
1. 检查是否有足够的历史数据
2. 验证指标参数（period 不能太大）
3. 查看完整错误堆栈

---

### 问题9：规则全部为 false

**日志：**
```
[RuleGroup] Rule 1: RSI(67.4200) < 70(70.0000) = true
[RuleGroup] Rule 2: Close(148.5000) > EMA(145.0000) = true
[RuleGroup] Group result: false  ← 矛盾！
```

**原因：** AND/OR 逻辑问题

**解决方案：**
检查规则组的逻辑设置：
```sql
SELECT logic, required_conditions 
FROM rule_groups 
WHERE id = '规则组ID';
```

---

### 问题10：条件格式错误

**日志：**
```
[Condition] Unknown condition: greater_than
```

**原因：** 条件格式不匹配（应该是大写或符号）

**解决方案：**
这应该在修复后的代码中自动处理。如果还出现，检查数据库：
```sql
SELECT DISTINCT condition FROM trading_rules;
```

应该是：`GREATER_THAN` 或 `>` 等

---

## 🔍 深度分析步骤

### 步骤1：运行诊断SQL
```bash
运行文件：DIAGNOSE_NO_SIGNALS.sql
```

这会告诉你：
- 规则配置是否正确
- 使用的指标是否支持
- Cron Job 运行情况
- 评估历史

### 步骤2：手动触发测试
```bash
运行文件：MANUAL_TEST_SIGNAL.sql
```

这会：
- 重置所有策略的评估时间
- 强制下次 Cron 运行时评估
- 等待2分钟后检查结果

### 步骤3：分析日志

根据上面的"问题日志"部分找到匹配的问题

### 步骤4：如果还是没有日志

说明 Edge Function 可能根本没运行：

1. **检查部署状态**
   ```
   Supabase Dashboard → Edge Functions → monitor-trading-signals
   查看 "Status" 是否为 "Active"
   ```

2. **检查 Cron Job**
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%signal%';
   ```
   
   应该看到：
   ```
   jobname: optimized-signal-monitor
   active: true
   schedule: * * * * *  (每分钟)
   ```

3. **手动触发一次**
   - Dashboard → Edge Functions → monitor-trading-signals
   - 点击 "Invoke" 或 "Test"
   - 输入：`{"optimized": true, "parallel_processing": true}`
   - 点击 "Run"
   - 立即查看日志

---

## 📋 日志检查清单

当你查看日志时，按顺序检查：

- [ ] 有任何日志输出吗？
  - 如果没有 → Edge Function 未运行
  
- [ ] 看到 "Starting signal monitoring" 了吗？
  - 如果没有 → Function 启动失败
  
- [ ] 市场是否开放？
  - 如果关闭 → 等待交易时间或禁用检查
  
- [ ] 找到了策略吗（"Found X strategies"）？
  - 如果是 0 → 没有活跃策略
  
- [ ] 有策略被处理吗（"Processing X strategies"）？
  - 如果是 0 → 全部被 timeframe 过滤
  
- [ ] 看到指标计算吗（"[Indicator] RSI: XX.XX"）？
  - 如果没有 → 指标计算失败
  
- [ ] 看到规则评估吗（"[RuleGroup] Rule 1: ..."）？
  - 如果没有 → 规则组处理失败
  
- [ ] 规则评估结果是什么？
  - 如果全是 false → 条件不满足（这是正常的！）
  - 如果有 true → 应该生成信号

---

## 💡 最有可能的原因

根据你的情况（策略可以检测到，但没有信号），最可能是：

### 1. Edge Function 未部署 ⭐ **最可能**
- **症状**：没有日志，或日志是旧版本
- **验证**：查看日志中是否有详细的 `[Indicator]` 和 `[RuleGroup]` 输出
- **解决**：部署新版本 Edge Function

### 2. 指标不支持
- **症状**：日志显示 "Unknown indicator"
- **验证**：运行 `DIAGNOSE_NO_SIGNALS.sql` 第1个查询
- **解决**：使用支持的10个指标

### 3. 条件永远不满足
- **症状**：有评估，但规则总是 false
- **验证**：查看日志中的实际数值对比
- **解决**：调整阈值或条件

### 4. Timeframe 过滤
- **症状**：策略被跳过（"Skipping - next check in X minutes"）
- **验证**：查看日志
- **解决**：运行 `MANUAL_TEST_SIGNAL.sql`

---

## 🆘 需要帮助？

请提供：

1. **Edge Function 日志**（最近50行）
   ```
   复制 Logs 标签中的全部内容
   ```

2. **诊断SQL结果**
   ```
   运行 DIAGNOSE_NO_SIGNALS.sql 的结果
   ```

3. **你的策略配置**
   - 使用的指标
   - 设置的阈值
   - 预期触发条件

这样我可以精确定位问题！

