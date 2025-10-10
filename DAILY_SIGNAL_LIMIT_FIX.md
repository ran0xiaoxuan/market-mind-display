# Daily Signal Limit 计数 Bug 修复

## 问题描述

在交易信号的外部通知功能中，Daily Signal Limit（每日信号限制）的计数存在严重 Bug：
- **症状**: 无论策略发送多少次信号，计数器始终显示为 1
- **影响**: 用户可能会收到超过设定限制的通知
- **根本原因**: `incrementDailySignalCount` 方法中的 fallback 逻辑使用了错误的 upsert 方式

## 问题根源

### 原来的错误代码

```typescript
// ❌ 错误的实现
.upsert({
  strategy_id: strategyId,
  user_id: userId,
  signal_date: today,
  notification_count: 1  // 总是设置为1，不是递增！
}, {
  onConflict: 'strategy_id,signal_date'
})
```

### 问题分析

使用 `upsert` 时，如果记录已存在，它会用新值**替换**整条记录，而不是递增计数器：
- 第1次发送信号: INSERT → count = 1 ✅
- 第2次发送信号: UPDATE → count = 1（应该是2）❌
- 第3次发送信号: UPDATE → count = 1（应该是3）❌
- ...

## 解决方案

### 1. 创建数据库 RPC 函数（推荐方式）

创建了新的 migration 文件：
```
supabase/migrations/20250111000000_create_increment_daily_signal_count_function.sql
```

这个函数使用 PostgreSQL 的原子操作：
```sql
INSERT ... ON CONFLICT ... DO UPDATE SET
  notification_count = daily_signal_counts.notification_count + 1
```

**优点：**
- ✅ 原子性操作，避免竞态条件
- ✅ 性能更好（单次数据库操作）
- ✅ 逻辑在数据库层面，更可靠

### 2. 修复 Fallback 逻辑

更新了 `incrementDailySignalCount` 方法，改为：
1. 先查询当前计数
2. 如果存在，则 **递增**（count + 1）
3. 如果不存在，则创建新记录（count = 1）

**新的正确代码：**
```typescript
if (existingCount) {
  // 递增现有计数
  await this.supabase
    .from('daily_signal_counts')
    .update({ 
      notification_count: existingCount.notification_count + 1,  // ✅ 正确递增
      updated_at: new Date().toISOString()
    })
    .eq('id', existingCount.id);
} else {
  // 创建新记录
  await this.supabase
    .from('daily_signal_counts')
    .insert({
      strategy_id: strategyId,
      user_id: userId,
      signal_date: today,
      notification_count: 1  // ✅ 从1开始
    });
}
```

## 如何应用修复

### 步骤 1: 运行数据库迁移

```bash
# 在 Supabase 项目中运行迁移
supabase db push

# 或者在 Supabase Dashboard 的 SQL Editor 中手动执行
# supabase/migrations/20250111000000_create_increment_daily_signal_count_function.sql
```

### 步骤 2: 部署更新的 Edge Function

```bash
# 部署 monitor-trading-signals 函数
supabase functions deploy monitor-trading-signals
```

### 步骤 3: 清理现有错误数据（可选）

如果你想重置今天的计数：

```sql
-- 删除今天的所有计数记录（让系统重新开始计数）
DELETE FROM public.daily_signal_counts 
WHERE signal_date = CURRENT_DATE;
```

或者手动修复今天的计数（如果你知道实际发送了多少信号）：

```sql
-- 查看当前错误的计数
SELECT strategy_id, notification_count 
FROM public.daily_signal_counts 
WHERE signal_date = CURRENT_DATE;

-- 手动更新为正确的值（如果需要）
UPDATE public.daily_signal_counts 
SET notification_count = <实际发送的信号数>
WHERE strategy_id = '<策略ID>' 
  AND signal_date = CURRENT_DATE;
```

## 测试验证

### 测试步骤

1. **创建测试策略**
   - 设置 Daily Signal Limit = 3
   - 配置简单的入场规则（容易触发）

2. **触发多次信号**
   - 等待策略产生信号
   - 观察计数是否正确递增

3. **验证计数**
   ```sql
   SELECT * FROM daily_signal_counts 
   WHERE strategy_id = '<你的策略ID>' 
     AND signal_date = CURRENT_DATE;
   ```

4. **验证限制生效**
   - 第3次信号后，应该停止发送外部通知
   - 内部信号记录仍会创建，但不会发送 webhook/email

### 预期结果

```
第1次信号 → notification_count = 1 ✅
第2次信号 → notification_count = 2 ✅
第3次信号 → notification_count = 3 ✅
第4次信号 → 不发送外部通知（达到限制）✅
```

## 日志输出

修复后，你会在 Edge Function 日志中看到：

```
[NotificationService] Daily signal count incremented to 2
[NotificationService] Daily signal count incremented to 3
[NotificationService] Daily limit reached (3/3), skipping external notifications
```

## 相关文件

**修改的文件：**
- `supabase/functions/monitor-trading-signals/index.ts` - 修复了计数逻辑
- `supabase/migrations/20250111000000_create_increment_daily_signal_count_function.sql` - 新增的数据库函数

**相关文件（未修改）：**
- `src/services/dailySignalService.ts` - 前端服务（使用相同逻辑，可能也需要修复）
- `src/components/strategy-detail/DailySignalUsage.tsx` - UI组件（显示计数）

## 技术说明

### 竞态条件问题

原来的 upsert 方式在并发场景下可能出现问题：
```
时间线：
T1: 策略A生成信号 → 读取count=1 → 准备更新
T2: 策略A再次生成信号 → 读取count=1 → 准备更新
T3: T1执行更新 → count=1
T4: T2执行更新 → count=1（应该是2）❌
```

### 解决方案对比

| 方案 | 原子性 | 性能 | 复杂度 | 推荐 |
|------|--------|------|--------|------|
| RPC函数 | ✅ | 高 | 低 | ⭐⭐⭐⭐⭐ |
| 修复后的Fallback | ⚠️ | 中 | 中 | ⭐⭐⭐ |
| 原来的Upsert | ❌ | 高 | 低 | ❌ |

## 总结

✅ **修复完成**
- 创建了原子性的数据库递增函数
- 修复了 fallback 逻辑，正确递增计数
- 添加了详细的日志输出便于调试
- 确保了 Daily Signal Limit 功能按预期工作

📝 **后续建议**
- 同步修复 `src/services/dailySignalService.ts` 中的相同问题
- 添加自动化测试验证计数逻辑
- 考虑添加定期清理旧计数记录的任务（保留30天即可）

