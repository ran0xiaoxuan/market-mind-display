# Edge Function 修复说明

## 问题诊断

用户报告信号无法被成功计算和发送，但在设置页中发送测试信号可以收到。

### 问题原因

系统有**两套不同的实现**：

1. **前端测试信号**（工作✅）
   - 使用 `src/services/tradingRuleEvaluationService.ts`
   - 调用 TAAPI API 获取指标数据
   - 从 FMP API 获取市场数据

2. **自动信号监控**（不工作❌）
   - 使用 `supabase/functions/monitor-trading-signals/index.ts`
   - 使用本地计算指标
   - 格式兼容性问题

### 具体问题

#### 问题1：格式不兼容
Edge Function 期望严格的大写格式：
- `left_type = 'INDICATOR'` (大写)
- `condition = 'GREATER_THAN'` (大写)

但可能有小写或其他格式的数据。

#### 问题2：指标支持有限
Edge Function 只支持10个指标：
- SMA, EMA, WMA, RSI, MACD, CCI, Bollinger Bands, Stochastic, ATR, MFI

而系统应该支持25个指标（通过TAAPI API）。

## 修复内容

### 1. 增强格式兼容性

**修改文件**: `supabase/functions/monitor-trading-signals/index.ts`

#### 修改1：`getIndicatorValue()` 方法（第785-815行）
```typescript
// 之前
if (type === 'PRICE') { ... }

// 修复后
const normalizedType = type?.toUpperCase();
if (normalizedType === 'PRICE') { ... }
```

**作用**: 自动将类型转换为大写，兼容小写输入。

#### 修改2：`evaluateCondition()` 方法（第817-852行）
```typescript
// 之前
switch (condition) {
  case 'GREATER_THAN': return leftValue > rightValue;
  case 'LESS_THAN': return leftValue < rightValue;
  ...
}

// 修复后
const normalizedCondition = condition?.toUpperCase().replace(/\s+/g, '_');
switch (normalizedCondition) {
  case 'GREATER_THAN':
  case '>':
    return leftValue > rightValue;
  case 'LESS_THAN':
  case '<':
    return leftValue < rightValue;
  ...
}
```

**作用**: 
- 支持大写格式：`GREATER_THAN`
- 支持符号格式：`>`, `<`, `>=`, `<=`, `==`, `!=`
- 自动标准化格式

#### 修改3：`evaluateRuleGroup()` 方法（第861-886行）
```typescript
// 之前
if (rule.left_type === 'VALUE') { ... }

// 修复后
const normalizedLeftType = rule.left_type?.toUpperCase();
if (normalizedLeftType === 'VALUE') { ... }
```

**作用**: 在评估规则组时也进行格式标准化。

### 2. 增强日志输出

```typescript
// 之前
logDebug(`[RuleGroup] Rule ${index + 1}: ${leftValue} ${rule.condition} ${rightValue} = ${result}`);

// 修复后
logDebug(`[RuleGroup] Rule ${index + 1}: ${rule.left_indicator || rule.left_value}(${leftValue.toFixed(4)}) ${rule.condition} ${rule.right_indicator || rule.right_value}(${rightValue.toFixed(4)}) = ${result}`);
```

**作用**: 提供更详细的调试信息，显示指标名称而不仅仅是数值。

## 部署步骤

### 方式1：使用 Supabase CLI（推荐）

```bash
# 1. 确保已安装 Supabase CLI
# 如果没有安装：npm install -g supabase

# 2. 进入项目目录
cd market-mind-display-main

# 3. 登录 Supabase
supabase login

# 4. 链接到你的项目
supabase link --project-ref <your-project-ref>

# 5. 部署 Edge Function
supabase functions deploy monitor-trading-signals

# 6. 验证部署
supabase functions logs monitor-trading-signals --limit 50
```

### 方式2：通过 Supabase Dashboard

1. 打开 Supabase Dashboard
2. 进入 Edge Functions 页面
3. 选择 `monitor-trading-signals` 函数
4. 点击 "Deploy" 或 "Redeploy"
5. 上传修改后的 `index.ts` 文件

### 方式3：使用部署脚本

```bash
# 使用项目中的部署脚本
./deploy-monitor-trading-signals.sh

# 或者如果使用 PowerShell (Windows)
.\deploy-monitor-trading-signals.ps1
```

## 验证修复

### 1. 手动触发测试

```bash
# 使用 curl 测试
curl -X POST "https://<your-project-ref>.supabase.co/functions/v1/monitor-trading-signals" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual_test",
    "optimized": true,
    "parallel_processing": true
  }'
```

### 2. 查看日志

```bash
# Supabase CLI
supabase functions logs monitor-trading-signals --limit 100

# 或在 Dashboard 中查看 Functions → monitor-trading-signals → Logs
```

### 3. 预期日志输出

**成功的日志应该显示：**
```
🚀 Starting OPTIMIZED signal monitoring at: 2025-10-10T...
📋 Found X active strategies
✅ Strategy "策略名称": Due for evaluation (1h)
🎯 Processing Y strategies (filtered by timeframe schedule)
[RuleGroup] Evaluating group ... (entry) with AND logic
[RuleGroup] Rule 1: RSI(67.4200) < 70(70.0000) = true
[RuleGroup] Group result: true
🚨 SIGNAL DETECTED: 策略名称
✅ Signal abc-123 created
📝 Updated evaluation record for 策略名称
```

**如果看到错误：**
```
❌ Error processing 策略名称: ...
[Condition] Unknown condition: ...
```

说明还有格式问题需要进一步调试。

## 已知限制

### 1. 指标支持有限

Edge Function 目前只支持10个指标的本地计算。如果策略使用了其他指标（如 VWAP, DEMA, TEMA, HMA, SuperTrend 等），会导致：

- 指标值为 0
- 规则评估失败
- 不会生成信号

**解决方案（未来改进）：**
1. 在 Edge Function 中也集成 TAAPI API
2. 对不支持的指标回退到 TAAPI API
3. 或者实现所有25个指标的本地计算

### 2. 市场时间检查

Edge Function 会检查美国股市交易时间：
- 交易时间：周一至周五 9:30 AM - 4:00 PM (美东时间)
- 非交易时间不会生成信号

如果需要24/7监控（如加密货币），需要修改或禁用市场时间检查。

### 3. Cron Job 频率

默认每分钟触发一次，但有 Timeframe 过滤：
- 5分钟策略：每5分钟评估一次
- 1小时策略：每小时评估一次
- 日线策略：每天收盘时评估一次

## 故障排查

### 问题1：信号还是不生成

**检查步骤：**

1. **确认策略已激活**
```sql
SELECT id, name, is_active, target_asset, timeframe 
FROM strategies 
WHERE user_id = '<your-user-id>' AND is_active = true;
```

2. **检查评估记录**
```sql
SELECT 
  s.name,
  se.next_evaluation_due,
  CASE 
    WHEN se.next_evaluation_due <= NOW() THEN '应该评估'
    ELSE CONCAT('等待 ', EXTRACT(EPOCH FROM (se.next_evaluation_due - NOW()))/60, ' 分钟')
  END as status
FROM strategies s
LEFT JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true;
```

3. **重置评估时间**
```sql
UPDATE strategy_evaluations
SET next_evaluation_due = NOW() - INTERVAL '1 minute'
WHERE strategy_id IN (
  SELECT id FROM strategies WHERE is_active = true
);
```

### 问题2：指标值为 0

**可能原因：**
- 指标名称不匹配
- 参数格式错误
- 不支持的指标

**检查方法：**
查看 Edge Function 日志中的 `[Indicator]` 行：
```
[Indicator] RSI(14, close): 67.42  ← 正常
[Indicator] Unknown indicator: SuperTrend  ← 不支持的指标
```

### 问题3：条件总是为 false

**可能原因：**
- 条件格式错误
- 左右值获取失败

**检查方法：**
查看日志中的 `[RuleGroup]` 行：
```
[RuleGroup] Rule 1: RSI(67.4200) < 70(70.0000) = true  ← 正常
[RuleGroup] Rule 1: (0.0000) > (0.0000) = false  ← 值获取失败
```

## 测试清单

部署后请验证：

- [ ] Edge Function 成功部署（无编译错误）
- [ ] 日志中看到策略被评估
- [ ] 规则条件被正确评估
- [ ] 满足条件时生成信号
- [ ] 信号数据完整（包含策略信息、价格等）
- [ ] 通知发送正常（如果配置）
- [ ] 评估记录被正确更新

## 相关文档

- [信号计算修复说明](./SIGNAL_CALCULATION_FIX.md) - 前端修复详情
- [测试指南](./TESTING_GUIDE.md) - 如何测试信号生成
- [README](./README.md) - 项目文档

## 下一步改进

1. **集成 TAAPI API 到 Edge Function**
   - 支持所有25个指标
   - 与前端实现保持一致

2. **统一代码库**
   - 将规则评估逻辑提取为共享模块
   - 前端和 Edge Function 使用相同的实现

3. **增强错误处理**
   - 更详细的错误信息
   - 自动降级机制

4. **性能优化**
   - 缓存指标计算结果
   - 批量处理优化

---

**修复日期**: 2025年10月10日  
**修复版本**: v1.1  
**影响范围**: Edge Function only

