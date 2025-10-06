# Risk Tolerance 逻辑更新

## 更新日期
2025-10-06

## 更新内容

### 之前的逻辑
Risk Tolerance 代表的是一个**范围**：
- Conservative: 5-10% per trade
- Moderate: 10-15% per trade
- Aggressive: 15-25% per trade

### 更新后的逻辑
Risk Tolerance 代表的是一个**具体数值**：
- **Conservative: 15% per trade**
- **Moderate: 25% per trade**
- **Aggressive: 35% per trade**

---

## 修改的文件

### 前端文件（已完成）✅

1. **`src/lib/positionSizing.ts`**
   - 修改 `getRiskPercentage()` 函数（之前为 `getRiskPercentageRange()`）
   - 更新 `calculatePositionSize()` 使用固定百分比
   - 更新 `getRiskToleranceDescription()` 显示文字

2. **`src/pages/Backtest.tsx`**
   - 更新回测页面的仓位计算逻辑
   - Conservative: 15%, Moderate: 25%, Aggressive: 35%

3. **`src/components/strategy-detail/StrategyInfo.tsx`**
   - 更新显示文字：15%, 25%, 35% per trade

4. **`src/pages/StrategyPreview.tsx`**
   - 更新策略预览页面的显示文字

5. **`src/pages/ManualStrategy.tsx`**
   - 更新 Risk Tolerance 选择器的描述文字

6. **`src/pages/EditStrategy.tsx`**
   - 更新 Risk Tolerance 选择器的描述文字

### Edge Functions（需要手动部署）⚠️

7. **`supabase/functions/monitor-trading-signals/index.ts`** ⚠️
   - 修改 `PositionSizeCalculator` 类
   - 更新 `getRiskPercentage()` 方法
   - **需要重新部署到 Supabase**

---

## 需要手动部署的 Edge Function

### 📋 文件：`monitor-trading-signals/index.ts`

需要更新的代码段（已在本地文件中修改）：

```typescript
// Position sizing calculator
class PositionSizeCalculator {
  static getRiskPercentage(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'conservative':
        return 0.15; // 15%
      case 'moderate':
        return 0.25; // 25%
      case 'aggressive':
        return 0.35; // 35%
      default:
        return 0.25; // Default to moderate
    }
  }

  static calculatePositionSize(accountCapital: number, riskTolerance: string, assetPrice: number): {
    quantity: number;
    amount: number;
    positionPercentage: number;
  } {
    if (accountCapital <= 0 || assetPrice <= 0) {
      return { quantity: 0, amount: 0, positionPercentage: 0 };
    }

    const positionPercentage = this.getRiskPercentage(riskTolerance);
    const positionValue = accountCapital * positionPercentage;
    const quantity = Math.floor(positionValue / assetPrice);
    const actualAmount = quantity * assetPrice;
    const actualPercentage = (actualAmount / accountCapital) * 100;

    return {
      quantity,
      amount: actualAmount,
      positionPercentage: actualPercentage
    };
  }
}
```

### 📝 部署步骤

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **找到 Edge Functions**
   - 左侧菜单 → **Edge Functions**
   - 找到 `monitor-trading-signals` 函数

3. **更新代码**
   - 找到 `PositionSizeCalculator` 类（约第 54-90 行）
   - 将 `getRiskPercentageRange()` 方法改为 `getRiskPercentage()`
   - 更新返回值：conservative = 0.15, moderate = 0.25, aggressive = 0.35
   - 更新 `calculatePositionSize()` 方法中的调用
   - 保存并部署

4. **验证**
   - 部署成功后，可以在 Logs 中查看是否有错误
   - 测试创建一个新的交易信号，检查 quantity 和 amount 是否正确计算

---

## 数据库迁移（可选）

如果需要更新已有的交易信号数据，可以运行以下 SQL：

```sql
-- 注意：这只是一个参考，可能需要根据实际情况调整
-- 这个迁移文件已存在但使用旧的百分比范围
-- 如果需要重新计算已有数据，可以创建新的迁移
```

**建议**：不需要重新计算已有的交易信号，只需确保新生成的信号使用新的百分比即可。

---

## 影响范围

### ✅ 已自动更新（前端）
- 策略创建时的 Risk Tolerance 描述
- 策略编辑时的 Risk Tolerance 描述
- 策略详情页面的显示
- 策略预览页面的显示
- 回测功能的仓位计算

### ⚠️ 需要手动部署（Edge Functions）
- `monitor-trading-signals` - 实时信号生成的仓位计算

### ✅ 无需修改
- 数据库表结构（risk_tolerance 字段仍然存储 'conservative', 'moderate', 'aggressive'）
- 现有策略数据（无需更新，只是计算方式改变）

---

## 测试清单

### 前端测试
- [ ] 创建新策略时，Risk Tolerance 选项显示正确的百分比
- [ ] 编辑策略时，Risk Tolerance 选项显示正确的百分比
- [ ] 策略详情页面显示正确的 Risk Tolerance 百分比
- [ ] 策略预览页面显示正确的 Risk Tolerance 百分比
- [ ] 回测功能使用正确的百分比计算仓位

### Edge Function 测试（部署后）
- [ ] 创建新的交易信号
- [ ] 检查信号的 quantity 和 amount 是否使用新的百分比计算
- [ ] Conservative 策略：约 15% 资金
- [ ] Moderate 策略：约 25% 资金
- [ ] Aggressive 策略：约 35% 资金

---

## 示例计算

### 假设：账户资金 $10,000，股票价格 $100

**Conservative (15%):**
- Position Value: $10,000 × 0.15 = $1,500
- Quantity: $1,500 / $100 = 15 shares
- Actual Amount: 15 × $100 = $1,500

**Moderate (25%):**
- Position Value: $10,000 × 0.25 = $2,500
- Quantity: $2,500 / $100 = 25 shares
- Actual Amount: 25 × $100 = $2,500

**Aggressive (35%):**
- Position Value: $10,000 × 0.35 = $3,500
- Quantity: $3,500 / $100 = 35 shares
- Actual Amount: 35 × $100 = $3,500

---

## 注意事项

1. **向后兼容性**：所有现有策略无需修改，只是计算方式从"范围中值"改为"固定百分比"
2. **数据一致性**：数据库中的 risk_tolerance 字段值不变，仍然是 'conservative', 'moderate', 'aggressive'
3. **显示更新**：所有UI中的百分比描述已更新为新的固定值
4. **Edge Function**：必须手动部署 `monitor-trading-signals` 函数才能让实时信号生成使用新逻辑

---

## 完成状态

- ✅ 前端代码已全部更新
- ✅ 本地文件已全部修改
- ⚠️ **Edge Function 需要手动部署到 Supabase Dashboard**

