# 信号生成功能测试指南

## 快速测试步骤

修复完成后，请按以下步骤测试系统是否正常工作：

## 1. 准备工作

### 确认API密钥已配置
- FMP API Key（用于获取价格数据）
- TAAPI API Key（用于计算技术指标）

这些密钥应该在 Supabase Edge Functions 的 Secrets 中配置。

## 2. 创建测试策略

### 测试案例1：简单RSI策略

**目的：** 验证系统能正确获取RSI指标并评估条件

**步骤：**
1. 登录系统
2. 创建新策略：
   - 名称: "测试RSI策略"
   - 标的资产: AAPL
   - 时间周期: 1h
   
3. 添加Entry规则组：
   - 规则1: RSI(14) < 70
   - 类型: indicator vs value
   - 左侧: RSI, period=14
   - 条件: <
   - 右侧: 70 (常量)

4. 保存策略并激活

5. 点击"测试信号生成"按钮

### 预期结果：

**控制台日志应该显示：**
```
[RuleGroupEvaluator] Evaluating rule group ... (entry) for AAPL
[RuleGroupEvaluator] Logic: AND, Required conditions: null
[EvaluateSingleRule] Evaluating rule ...
[GetRuleValue] Type: indicator, Indicator: RSI, Value: null
[GetRuleValue] Fetching indicator: rsi for AAPL
[GetRuleValue] TAAPI params: { symbol: 'AAPL', interval: '1h', period: 14 }
[TaapiService] Making request to TAAPI for rsi with params: ...
[TaapiService] Successful request for rsi
[GetRuleValue] Indicator rsi value: 67.42  (实际值会变化)
[GetRuleValue] Using constant value: 70
[EvaluateSingleRule] RSI (67.4200) < 70 (70.0000) = true
[RuleGroupEvaluator] AND logic: 1/1 rules passed. Result: true
[RuleGroupEvaluator] Group ... result: true
Signal Details for Strategy 测试RSI策略 (...):
  Signal Generated: true
  Reason: entry signal generated successfully
  Processing Time: 1234ms
```

**关键验证点：**
- ✅ 看到 `Making request to TAAPI for rsi` - 确认TAAPI API被调用
- ✅ 看到 `Indicator rsi value: XX.XX` - 确认获取到真实RSI值
- ✅ 看到条件评估结果 `RSI (XX.XX) < 70 (70.00) = true/false` - 确认条件被正确评估
- ✅ 信号生成结果符合实际RSI值

### 测试案例2：MACD金叉策略

**目的：** 验证系统能处理多值指标（MACD有主线、信号线、柱状图）

**步骤：**
1. 创建新策略：
   - 名称: "测试MACD策略"
   - 标的资产: TSLA
   - 时间周期: 4h

2. 添加Entry规则组：
   - 规则1: MACD Value > MACD Signal Value
   - 左侧: MACD, fast=12, slow=26, signal=9, valueType="MACD Value"
   - 条件: >
   - 右侧: MACD, fast=12, slow=26, signal=9, valueType="Signal Value"

3. 保存并测试

### 预期结果：

```
[GetRuleValue] Fetching indicator: macd for TSLA
[GetRuleValue] Indicator macd value: 2.34  (MACD主线)
[GetRuleValue] Indicator macd value: 1.87  (MACD信号线)
[EvaluateSingleRule] MACD (2.3400) > MACD (1.8700) = true
```

### 测试案例3：多条件AND策略

**目的：** 验证AND逻辑和多个API调用

**步骤：**
1. 创建策略：
   - 名称: "测试多条件策略"
   - 标的资产: MSFT
   - 时间周期: Daily

2. 添加Entry规则组（AND逻辑）：
   - 规则1: RSI(14) < 40
   - 规则2: Close > EMA(50)
   - 规则3: Volume > 1000000
   - Logic: AND

3. 保存并测试

### 预期结果：

```
[RuleGroupEvaluator] Evaluating rule group ... (entry) for MSFT
[RuleGroupEvaluator] Logic: AND, Required conditions: null

Rule 1:
[GetRuleValue] Indicator rsi value: 37.23
[EvaluateSingleRule] RSI (37.2300) < 40 (40.0000) = true

Rule 2:
[GetRuleValue] Using close price: 412.50
[GetRuleValue] Indicator ema value: 405.30
[EvaluateSingleRule] Close (412.5000) > EMA (405.3000) = true

Rule 3:
[GetRuleValue] Using volume: 23456789
[EvaluateSingleRule] Volume (23456789.0000) > 1000000 (1000000.0000) = true

[RuleGroupEvaluator] AND logic: 3/3 rules passed. Result: true
Signal Generated: true
```

## 3. 检查点

### ✅ API调用验证
- 在浏览器控制台中查看网络请求
- 应该看到对 TAAPI API 的请求
- 应该看到对 FMP API 的请求（获取市场数据）

### ✅ 日志验证
- 看到 `[GetRuleValue]` 日志表示值获取逻辑被执行
- 看到 `[TaapiService]` 日志表示TAAPI API被调用
- 看到实际的数值（不是随机数）

### ✅ 结果验证
- 多次测试同一策略，如果市场条件未变，结果应该一致
- 不应该看到随机的true/false结果
- 信号生成应该符合实际的市场数据和指标值

## 4. 常见问题排查

### 问题1：看到 "Failed to fetch indicator data"

**可能原因：**
- TAAPI API密钥未配置或无效
- 网络请求失败
- 速率限制

**解决方法：**
1. 检查 Supabase Secrets 中的 TAAPI_API_KEY
2. 检查网络连接
3. 等待一段时间后重试（避免速率限制）

### 问题2：看到 "No market data available"

**可能原因：**
- FMP API密钥未配置或无效
- 股票代码不存在或拼写错误
- 市场数据服务故障

**解决方法：**
1. 检查 Supabase Secrets 中的 FMP_API_KEY
2. 确认股票代码正确（如：AAPL, TSLA, MSFT）
3. 尝试更换其他知名股票

### 问题3：指标值看起来不合理

**可能原因：**
- 参数配置错误
- 时间周期映射错误
- 指标名称映射错误

**解决方法：**
1. 检查指标参数配置（period, fast, slow等）
2. 验证时间周期设置（1h, 4h, Daily等）
3. 查看日志中的TAAPI请求参数

## 5. 性能测试

### 测试策略执行时间

**正常范围：**
- 单个策略（1-2条规则）：500-1500ms
- 单个策略（3-5条规则）：1000-3000ms
- 批量处理（5个策略）：3000-10000ms

**如果超时或太慢：**
1. 检查TAAPI速率限制器是否生效
2. 检查缓存是否工作
3. 考虑减少规则数量或优化参数

## 6. 调试技巧

### 启用详细日志

在浏览器控制台中，所有相关日志都带有前缀：
- `[RuleGroupEvaluator]` - 规则组评估
- `[EvaluateSingleRule]` - 单条规则评估
- `[GetRuleValue]` - 值获取
- `[TaapiService]` - TAAPI API调用
- `[OptimizedData]` - 市场数据获取

### 使用浏览器开发者工具

1. **Network面板**
   - 筛选XHR/Fetch请求
   - 查找 `api.taapi.io` 和 `financialmodelingprep.com` 的请求
   - 检查响应状态和数据

2. **Console面板**
   - 查看所有日志输出
   - 复制日志进行分析
   - 展开对象查看详细数据

3. **Application面板**
   - 检查Supabase认证状态
   - 验证用户权限

## 7. 成功标准

测试通过的标准：

✅ **功能性**
- [ ] TAAPI API被正确调用
- [ ] 获取到真实的指标值（不是随机数）
- [ ] 价格和成交量从市场数据中正确提取
- [ ] 条件比较逻辑正确
- [ ] AND/OR/AT_LEAST逻辑正确
- [ ] 信号生成结果符合实际数据

✅ **稳定性**
- [ ] 多次测试结果一致（市场条件不变时）
- [ ] 没有JavaScript错误
- [ ] API调用成功率高（>95%）
- [ ] 没有内存泄漏

✅ **性能**
- [ ] 单个策略评估时间 < 3秒
- [ ] 缓存有效减少API调用
- [ ] 速率限制正常工作

## 8. 已知限制

### 当前版本的限制：
1. **穿越检测简化** - `crosses_above` 和 `crosses_below` 当前简化为 `>` 和 `<`
2. **TAAPI速率限制** - 免费层可能有每分钟50次请求的限制
3. **缓存时间** - TAAPI数据缓存30秒，可能不适合极短周期交易
4. **市场时间** - 目前未严格限制在市场交易时间内

### 计划改进：
- 增强穿越检测，使用历史数据验证
- 本地计算常用指标，减少API依赖
- 可配置的缓存策略
- 市场时间验证和非交易时间处理

## 9. 报告问题

如果测试中发现问题，请提供以下信息：

1. **策略配置**
   - 标的资产
   - 时间周期
   - 所有规则详细配置

2. **日志输出**
   - 完整的控制台日志
   - 网络请求详情

3. **预期 vs 实际**
   - 预期的结果
   - 实际的结果
   - 差异说明

4. **环境信息**
   - 浏览器版本
   - 操作系统
   - 时间戳

---

**文档版本**: 1.0  
**最后更新**: 2025年10月10日  
**相关文档**: [信号数据计算修复说明](./SIGNAL_CALCULATION_FIX.md)

