# 🔥 关键Bug修复 - Edge Function

## 修复时间
**2025年10月10日**

---

## 🐛 发现的问题

### 1. ⚠️ **致命错误**: Promise链错误
```
TypeError: supabase.from(...).upsert(...).catch is not a function
```

**问题原因**：
Supabase JS v2 客户端的 `.upsert()` 方法返回的Promise不支持直接的 `.then().catch()` 链式调用。

**错误代码示例**：
```typescript
supabase
  .from('strategy_evaluations')
  .upsert({...})
  .then(() => logDebug(...))
  .catch(err => logWarn(...))  // ❌ 这里会报错
```

**修复后**：
```typescript
supabase
  .from('strategy_evaluations')
  .upsert({...})
  .then(({ error }) => {
    if (error) {
      logWarn(`⚠️ Failed: ${error.message}`);
    } else {
      logDebug(`✅ Success`);
    }
  })  // ✅ 正确的处理方式
```

---

### 2. 🏷️ **指标名称错误**: "Bollinger Bands" 无法识别
```
Error: Unknown indicator: Bollinger Bands
```

**问题原因**：
- 数据库中存储的是 `"Bollinger Bands"`（带空格）
- 代码使用 `configKey.split('_')[0]` 提取指标名称
- 结果：`"Bollinger Bands_{params}"` → split 后 → `"Bollinger"` ❌
- Switch case 匹配失败！

**修复后**：
```typescript
// 正确提取完整的指标名称（包括空格）
const lastJsonStart = configKey.lastIndexOf('_{');
const indicatorName = lastJsonStart > 0 
  ? configKey.substring(0, lastJsonStart)  // "Bollinger Bands"
  : configKey.split('_')[0];

// 移除所有空格后进行匹配
switch (indicatorName.toLowerCase().replace(/\s+/g, '')) {
  case 'bollingerbands':  // ✅ 可以匹配 "Bollinger Bands", "BollingerBands", "bollinger bands" 等
  case 'bbands':
    // ...
}
```

---

## 📝 修复位置

### 文件：`supabase/functions/monitor-trading-signals/index.ts`

#### **修复1**: Promise链错误（5处）
1. **第1449-1464行** - 并行模式，有信号时更新评估记录
2. **第1485-1500行** - 并行模式，无信号时更新评估记录
3. **第1523-1536行** - 并行模式，finally块中的更新
4. **第1652-1666行** - 顺序模式，有信号时更新评估记录
5. **第1686-1700行** - 顺序模式，无信号时更新评估记录
6. **第1723-1736行** - 顺序模式，finally块中的更新

#### **修复2**: 指标名称提取（1处）
- **第664-672行** - 改进指标名称提取逻辑

---

## 🚀 部署步骤

### 方法1：使用Supabase Dashboard（推荐）

1. **登录** [Supabase Dashboard](https://supabase.com/dashboard)

2. **进入Edge Functions页面**
   - 选择你的项目
   - 左侧菜单：Edge Functions

3. **找到 `monitor-trading-signals` 函数**
   - 点击进入

4. **更新代码**
   - 点击 "Deploy new version"
   - 复制整个修复后的 `index.ts` 文件内容
   - 粘贴到编辑器
   - 点击 "Deploy"

5. **验证部署**
   ```sql
   -- 在SQL Editor中运行
   SELECT * FROM cron.job 
   WHERE jobname = 'monitor-trading-signals-auto';
   ```

---

### 方法2：使用CLI（如果已安装）

```powershell
# 1. 确保在项目根目录
cd market-mind-display-main

# 2. 登录Supabase
supabase login

# 3. 链接项目
supabase link --project-ref your-project-ref

# 4. 部署函数
supabase functions deploy monitor-trading-signals

# 5. 验证
supabase functions list
```

---

## ✅ 验证修复

### 1. 检查日志
```sql
-- 在Supabase Dashboard > Logs 中查看
-- 应该不再看到这些错误：
-- ❌ "TypeError: supabase.from(...).upsert(...).catch is not a function"
-- ❌ "Unknown indicator: Bollinger Bands"
```

### 2. 手动触发测试
在SQL Editor中运行：
```sql
SELECT
  net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/monitor-trading-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims')::json->>'sub'
    ),
    body := jsonb_build_object(
      'optimized', true,
      'parallel_processing', true
    )
  ) AS result;
```

### 3. 检查策略评估记录
```sql
SELECT 
  strategy_id,
  timeframe,
  last_evaluated_at,
  next_evaluation_due,
  evaluation_count
FROM strategy_evaluations
ORDER BY last_evaluated_at DESC
LIMIT 10;
```

---

## 🎯 预期结果

修复后，你应该能看到：

✅ **信号成功生成**
```sql
SELECT * FROM trading_signals 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

✅ **评估记录正常更新**
```sql
SELECT * FROM strategy_evaluations 
WHERE last_evaluated_at > NOW() - INTERVAL '1 hour';
```

✅ **日志中无错误信息**
- 在 Supabase Dashboard > Logs > Edge Functions
- 选择 `monitor-trading-signals`
- 查看最新日志，应该只有正常的INFO和DEBUG消息

---

## 📞 如果还有问题

如果修复后仍然有问题：

1. **查看完整日志**
   ```
   Supabase Dashboard > Logs > Edge Functions > monitor-trading-signals
   ```

2. **运行诊断脚本**
   ```sql
   -- 运行 DIAGNOSE_NO_SIGNALS.sql
   ```

3. **检查API密钥**
   ```sql
   SELECT key, substring(value, 1, 10) || '...' as value_preview
   FROM vault.secrets
   WHERE key IN ('FMP_API_KEY', 'TAAPI_API_KEY');
   ```

---

## 📋 修复总结

| 问题 | 影响 | 状态 |
|------|------|------|
| Promise链错误 | ⚠️ **致命** - 导致Edge Function崩溃 | ✅ **已修复** |
| Bollinger Bands不识别 | ⚠️ **严重** - 使用该指标的策略无法评估 | ✅ **已修复** |

**修复时间**：约10分钟（使用Dashboard方法）

---

**重要提醒**：修复后，Edge Function会立即生效。下次cron任务运行时（每5分钟），你应该能看到信号被正确生成和发送。

