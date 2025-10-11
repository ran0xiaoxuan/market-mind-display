# Alpaca 集成部署指南

## ✅ 已完成的开发工作

所有 Alpaca 集成功能已经开发完成，包括：

1. ✅ 数据库表结构（存储 API 配置和交易记录）
2. ✅ 前端设置页面（Live Trading 标签页）
3. ✅ API 配置管理组件
4. ✅ 交易历史查看页面
5. ✅ Edge Functions（交易执行逻辑）
6. ✅ 自动交易触发机制
7. ✅ 完整的 README 文档

---

## 🚀 部署步骤

### 步骤 1：部署数据库迁移

需要在 Supabase 中运行数据库迁移文件：

```bash
# 方法 1：使用 Supabase CLI（推荐）
cd market-mind-display-main
supabase db push

# 方法 2：在 Supabase Dashboard 手动执行
# 1. 登录 Supabase Dashboard
# 2. 选择你的项目
# 3. 进入 SQL Editor
# 4. 复制并执行 supabase/migrations/20251012000000_create_alpaca_integration.sql 的内容
```

这个迁移会创建两个新表：
- `alpaca_configurations` - 存储用户的 Alpaca API 配置
- `alpaca_trade_executions` - 记录所有交易执行历史

### 步骤 2：部署 Edge Functions

需要部署两个新的 Edge Functions：

```bash
# 部署 alpaca-execute-trade 函数（手动交易）
supabase functions deploy alpaca-execute-trade

# 部署 alpaca-auto-trade 函数（自动交易）
supabase functions deploy alpaca-auto-trade
```

**或者在 Supabase Dashboard 中：**
1. 进入 Functions 部分
2. 点击 "Create a new function"
3. 分别创建 `alpaca-execute-trade` 和 `alpaca-auto-trade`
4. 复制对应的 TypeScript 代码

### 步骤 3：部署前端代码

```bash
# 安装依赖（如果还没安装）
npm install

# 构建前端
npm run build

# 部署到你的托管平台（Netlify/Vercel 等）
# 或者提交代码到 GitHub，触发自动部署
git add .
git commit -m "feat: Add Alpaca trading integration"
git push
```

### 步骤 4：验证部署

1. **检查数据库表**：
   ```sql
   SELECT * FROM alpaca_configurations LIMIT 1;
   SELECT * FROM alpaca_trade_executions LIMIT 1;
   ```

2. **检查 Edge Functions**：
   - 访问 Supabase Dashboard > Functions
   - 确认 `alpaca-execute-trade` 和 `alpaca-auto-trade` 都已部署

3. **检查前端**：
   - 登录系统
   - 进入 Settings > Live Trading
   - 确认可以看到 Alpaca 配置页面

---

## 🧪 测试流程

### 1. PRO 用户测试

首先确保你的测试账号是 PRO 用户：

```sql
-- 在 Supabase SQL Editor 中执行
UPDATE profiles 
SET subscription_tier = 'pro' 
WHERE id = 'YOUR_USER_ID';
```

### 2. 获取 Alpaca Paper Trading API

1. 访问 https://alpaca.markets
2. 注册账号
3. 生成 Paper Trading API 密钥
4. 记录 API Key 和 Secret Key

### 3. 配置测试

1. 登录系统
2. 进入 Settings > Live Trading
3. 输入 Paper Trading API 密钥
4. 确保 "Paper Trading Mode" 开关是开启的
5. 点击 "Save Configuration"
6. 点击 "Test Connection" 验证连接

### 4. 自动交易测试

1. 创建一个简单的测试策略
2. 确保策略会很快产生信号（例如：RSI < 100，保证条件总是满足）
3. 激活策略
4. 在 Live Trading 页面打开自动交易开关
5. 等待策略生成信号
6. 检查 `/alpaca-trades` 页面查看交易记录

### 5. 查看日志

在 Supabase Dashboard > Functions > alpaca-auto-trade > Logs 中可以看到：
- 🤖 Alpaca trade executed - 成功执行
- ⏭️ Alpaca trade skipped - 跳过（没有配置或未激活）
- ⚠️ 错误信息

---

## 🔧 常见问题排查

### 问题 1：Live Trading 标签页不显示

**原因**：用户不是 PRO 用户

**解决**：
```sql
UPDATE profiles 
SET subscription_tier = 'pro' 
WHERE email = 'user@example.com';
```

### 问题 2：Test Connection 失败

**可能原因**：
- API 密钥错误
- 选错了 Paper/Live Trading 模式
- Alpaca API 服务暂时不可用

**解决**：
1. 检查 API 密钥是否正确复制
2. 确认 Paper Trading 模式与 API 密钥类型匹配
3. 查看 Edge Function 日志获取详细错误信息

### 问题 3：信号产生了但没有执行交易

**可能原因**：
- Live Trading 开关未打开
- Edge Function 调用失败

**排查步骤**：
1. 检查 Settings > Live Trading 开关状态
2. 检查 `monitor-trading-signals` 函数日志
3. 检查 `alpaca-auto-trade` 函数日志
4. 查看 `alpaca_trade_executions` 表是否有记录

### 问题 4：交易执行失败

**可能原因**：
- 资金不足
- 股票代码错误
- 市场休市

**解决**：
1. 检查 Alpaca 账户余额
2. 确认策略中的股票代码正确
3. 检查交易时间（美股交易时间：周一至周五 9:30-16:00 EST）

---

## 📊 监控和维护

### 1. 数据库监控

定期检查交易记录：

```sql
-- 查看最近的交易
SELECT * FROM alpaca_trade_executions 
ORDER BY created_at DESC 
LIMIT 10;

-- 统计交易状态
SELECT status, COUNT(*) as count 
FROM alpaca_trade_executions 
GROUP BY status;

-- 查看失败的交易
SELECT * FROM alpaca_trade_executions 
WHERE status IN ('failed', 'rejected')
ORDER BY created_at DESC;
```

### 2. Edge Function 日志

在 Supabase Dashboard 中：
- Functions > monitor-trading-signals > Logs
- Functions > alpaca-auto-trade > Logs

关键日志标识：
- `🤖 Alpaca trade executed` - 成功
- `⏭️ Alpaca trade skipped` - 跳过
- `⚠️` - 警告
- `❌` - 错误

### 3. 性能监控

监控 Edge Function 的执行时间和成功率，确保：
- 交易执行延迟 < 5 秒
- 成功率 > 95%

---

## 🔐 安全建议

1. **API 密钥管理**：
   - 不要在代码中硬编码 API 密钥
   - 定期轮换 API 密钥
   - 使用 Paper Trading 进行充分测试

2. **权限控制**：
   - 确保 RLS 策略正确配置
   - 只有 PRO 用户可以访问 Live Trading
   - 用户只能看到自己的交易记录

3. **监控和告警**：
   - 设置交易失败率告警
   - 监控异常交易量
   - 定期审查交易日志

---

## 📝 后续优化建议

1. **订单类型扩展**：
   - 支持限价单（Limit Order）
   - 支持止损单（Stop Loss Order）
   - 支持止盈单（Take Profit Order）

2. **风险控制**：
   - 添加每日最大交易次数限制
   - 添加单笔交易最大金额限制
   - 添加总持仓限制

3. **通知增强**：
   - 交易执行后发送邮件通知
   - 集成 Discord/Telegram 通知
   - 添加交易报告功能

4. **数据分析**：
   - 添加交易统计图表
   - 计算策略收益率
   - 生成交易分析报告

---

## 🎯 用户需要做的准备工作

在使用 Alpaca 集成前，用户需要：

1. ✅ 升级到 PRO 订阅（如果还不是）
2. ✅ 注册 Alpaca 账号（免费）
3. ✅ 获取 Paper Trading API 密钥
4. ✅ 在 Settings > Live Trading 配置 API 密钥
5. ✅ 测试连接确保配置正确
6. ✅ 创建并激活交易策略
7. ✅ 开启自动交易开关

---

## 📞 技术支持

如果在部署或使用过程中遇到问题：

1. 查看 README 中的 FAQ 部分
2. 检查 Supabase Dashboard 中的日志
3. 查看交易历史页面的错误信息
4. 通过 Settings > Contact Us 联系支持团队

---

## 📄 相关文档

- [README.md](./README.md) - 完整项目文档和 Alpaca 使用指南
- [Alpaca API 文档](https://alpaca.markets/docs/)
- [Supabase 文档](https://supabase.com/docs)

---

**祝部署顺利！** 🎉

