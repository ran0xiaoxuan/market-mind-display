# 部署说明 - 修复信号生成问题

## 📋 概述

本次修复解决了信号无法被自动生成的问题。修复涉及两部分：
1. ✅ 前端代码已修复（真实的 TAAPI API 集成）
2. ⚠️ Edge Function 需要重新部署（格式兼容性修复）

## 🚀 部署步骤

### 前提条件

1. **安装 Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **登录 Supabase**
   ```bash
   supabase login
   ```

3. **链接到你的项目**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   
   提示：你可以在 Supabase Dashboard → Project Settings → General 中找到 project-ref

### 选项A：使用自动部署脚本（推荐）

#### Windows (PowerShell)
```powershell
.\deploy-monitor-trading-signals.ps1
```

#### Mac/Linux (Bash)
```bash
chmod +x deploy-monitor-trading-signals.sh
./deploy-monitor-trading-signals.sh
```

### 选项B：手动部署

```bash
# 1. 进入项目目录
cd market-mind-display-main

# 2. 部署 Edge Function
supabase functions deploy monitor-trading-signals

# 3. 查看部署日志
supabase functions logs monitor-trading-signals --limit 50
```

### 选项C：通过 Supabase Dashboard

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Edge Functions**
4. 找到 `monitor-trading-signals`
5. 点击 **Deploy** 按钮
6. 选择 `supabase/functions/monitor-trading-signals/index.ts` 文件
7. 点击 **Deploy**

## ✅ 验证部署

### 1. 手动触发测试

使用以下命令测试 Edge Function：

```bash
curl -X POST "https://<your-project-ref>.supabase.co/functions/v1/monitor-trading-signals" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"optimized": true, "parallel_processing": true}'
```

**替换占位符：**
- `<your-project-ref>`: 你的项目引用ID
- `<your-anon-key>`: 你的匿名密钥（在 Project Settings → API 中找到）

### 2. 查看日志

```bash
supabase functions logs monitor-trading-signals --limit 100
```

**成功的日志应该包含：**
```
🚀 Starting OPTIMIZED signal monitoring at: ...
📋 Found X active strategies
✅ Strategy "策略名称": Due for evaluation
🎯 Processing Y strategies
[RuleGroup] Evaluating group ... (entry) with AND logic
[RuleGroup] Rule 1: RSI(67.4200) < 70(70.0000) = true
🚨 SIGNAL DETECTED: 策略名称
✅ Signal abc-123 created
```

### 3. 检查数据库

```sql
-- 查看最近的信号
SELECT 
  id,
  strategy_id,
  signal_type,
  signal_data->>'strategy_name' as strategy_name,
  signal_data->>'current_price' as price,
  created_at
FROM trading_signals
ORDER BY created_at DESC
LIMIT 10;

-- 查看策略评估记录
SELECT 
  s.name,
  se.last_evaluated_at,
  se.next_evaluation_due,
  se.evaluation_count
FROM strategies s
JOIN strategy_evaluations se ON s.id = se.strategy_id
WHERE s.is_active = true
ORDER BY s.name;
```

## 🔧 故障排查

### 问题1：部署失败

**错误信息**: `Error: Supabase CLI not found`

**解决方案**:
```bash
npm install -g supabase
```

**错误信息**: `Error: Not logged in`

**解决方案**:
```bash
supabase login
```

**错误信息**: `Error: Project not linked`

**解决方案**:
```bash
supabase link --project-ref <your-project-ref>
```

### 问题2：信号还是不生成

**检查步骤**:

1. **确认 Cron Job 正在运行**
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%signal%';
   ```

2. **检查活跃策略**
   ```sql
   SELECT id, name, is_active, target_asset, timeframe 
   FROM strategies 
   WHERE is_active = true;
   ```

3. **重置评估时间（强制立即评估）**
   ```sql
   UPDATE strategy_evaluations
   SET next_evaluation_due = NOW() - INTERVAL '1 minute'
   WHERE strategy_id IN (
     SELECT id FROM strategies WHERE is_active = true
   );
   ```

4. **手动触发一次**
   使用上面的 curl 命令手动触发一次信号监控

### 问题3：日志中看到错误

**错误**: `Unknown indicator: SuperTrend`

**原因**: Edge Function 不支持该指标

**解决方案**: 
- 短期：使用 Edge Function 支持的指标（SMA, EMA, WMA, RSI, MACD, CCI, Bollinger Bands, Stochastic, ATR, MFI）
- 长期：等待 TAAPI 集成到 Edge Function

**错误**: `Unknown condition: ...`

**原因**: 条件格式不匹配

**解决方案**: 检查数据库中的 condition 字段，应该是大写格式（如 `GREATER_THAN`）或符号（如 `>`）

### 问题4：市场时间问题

**症状**: 只在美国市场时间才生成信号

**原因**: Edge Function 检查美国股市交易时间（周一至周五 9:30 AM - 4:00 PM ET）

**解决方案**: 
如果需要24/7监控（如加密货币），修改 Edge Function 代码：

```typescript
// 在 index.ts 第1251行附近
// 注释掉市场时间检查
/*
if (!MarketHoursChecker.isMarketOpen()) {
  logInfo('Market is closed - exiting early');
  return new Response(...);
}
*/
```

## 📊 支持的指标

### Edge Function 本地支持（10个）
✅ SMA - 简单移动平均线  
✅ EMA - 指数移动平均线  
✅ WMA - 加权移动平均线  
✅ RSI - 相对强弱指标  
✅ MACD - 异同移动平均线  
✅ CCI - 商品通道指标  
✅ Bollinger Bands - 布林带  
✅ Stochastic - 随机指标  
✅ ATR - 平均真实波幅  
✅ MFI - 资金流量指标  

### 前端/TAAPI 支持（25个）
包括上述10个，另外还有：  
⚠️ DEMA - 双指数移动平均线  
⚠️ TEMA - 三指数移动平均线  
⚠️ HMA - 赫尔移动平均线  
⚠️ VWAP - 成交量加权平均价  
⚠️ Stochastic RSI - 随机相对强弱指标  
⚠️ ROC - 变动率  
⚠️ Williams %R - 威廉指标  
⚠️ CMO - 钱德动量摆动指标  
⚠️ ADX - 平均趋向指标  
⚠️ SuperTrend - 超级趋势  
⚠️ NATR - 标准化平均真实波幅  
⚠️ Keltner Channel - 肯特纳通道  
⚠️ Donchian Channel - 唐奇安通道  
⚠️ OBV - 能量潮  
⚠️ CMF - 蔡金资金流量  

**注意**: ⚠️ 标记的指标目前只在前端测试信号中可用，自动监控暂不支持。

## 📝 下一步

部署完成后：

1. **测试测试信号**（前端）
   - 进入策略详情页
   - 点击"测试信号生成"
   - 查看控制台日志

2. **等待自动信号**（Edge Function）
   - 系统每分钟自动检查一次
   - 根据 timeframe 过滤策略
   - 满足条件时生成信号

3. **查看生成的信号**
   - Dashboard → Signals 页面
   - 或查询数据库 `trading_signals` 表

4. **配置通知**（可选）
   - Settings → Notifications
   - 配置 Discord/Telegram/Email
   - 接收实时信号通知

## 📚 相关文档

- [Edge Function 修复说明](./EDGE_FUNCTION_FIX.md) - 技术细节
- [信号计算修复说明](./SIGNAL_CALCULATION_FIX.md) - 前端修复详情
- [测试指南](./TESTING_GUIDE.md) - 如何测试
- [README](./README.md) - 项目文档

## 💬 需要帮助？

如果部署后还有问题：

1. 查看 [Edge Function 修复说明](./EDGE_FUNCTION_FIX.md) 中的"故障排查"部分
2. 查看 Supabase Dashboard → Edge Functions → Logs
3. 检查数据库中的策略和规则配置
4. 提供完整的日志输出以便诊断

---

**修复日期**: 2025年10月10日  
**版本**: v1.1  
**状态**: ✅ 准备部署

