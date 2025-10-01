# OR Group Logic Fix - Edge Function Update

## 🐛 问题描述 (Problem Description)

在调用 `generate-strategy` Edge Function 生成策略时，发现了一个逻辑错误：

**错误情况**:
- OR Group 有 N 个条件
- `requiredConditions` = N（等于总条件数）
- 这实际上等同于 AND 逻辑（所有条件都必须满足）

**正确做法**:
- OR Group 的 `requiredConditions` 必须 < 总条件数
- 如果 `requiredConditions` = 总条件数，应该使用 AND Group

---

## ✅ 解决方案 (Solution)

### 修改的文件
**文件**: `supabase/functions/generate-strategy/index.ts`

### 修改内容

#### 1. 更新 CRITICAL RULE GROUP REQUIREMENTS

**新增规则 4**:
```typescript
4. **CRITICAL OR GROUP LOGIC**: For OR groups, requiredConditions MUST be LESS THAN the total number of inequalities in that group
   - If requiredConditions equals the number of inequalities, use AND group instead
   - Example: OR group with 3 inequalities → requiredConditions can be 1 or 2, NOT 3
   - Example: OR group with 2 inequalities → requiredConditions can only be 1, NOT 2
   - If all conditions must be met, use AND group with requiredConditions equal to the number of inequalities
```

#### 2. 更新 userPrompt Requirements

**新增要求**:
```typescript
- **CRITICAL OR GROUP LOGIC**: In OR groups, requiredConditions MUST be LESS THAN the total number of inequalities. If requiredConditions equals the number of inequalities, use AND group instead.
  * OR group with 3 conditions → requiredConditions can be 1 or 2 only (NOT 3)
  * OR group with 2 conditions → requiredConditions can only be 1 (NOT 2)
  * If all conditions must be met, always use AND group
```

#### 3. 改进示例

**示例 1 - 修正前**:
```json
"exitRules": [
  {
    "logic": "OR",
    "requiredConditions": 1,
    "inequalities": [
      {
        "id": 1,
        // ... 只有1个条件 (错误：OR group不应该只有1个条件)
      }
    ]
  }
]
```

**示例 1 - 修正后**:
```json
"exitRules": [
  {
    "logic": "OR",
    "requiredConditions": 1,
    "inequalities": [
      {
        "id": 1,
        "left": {
          "type": "INDICATOR",
          "indicator": "RSI",
          "parameters": {"period": "14", "source": "Close"},
          "valueType": "Value"
        },
        "condition": "GREATER_THAN",
        "right": {"type": "VALUE", "value": "70"},
        "explanation": "RSI indicates overbought condition"
      },
      {
        "id": 2,
        "left": {"type": "PRICE", "value": "Close"},
        "condition": "CROSSES_BELOW",
        "right": {
          "type": "INDICATOR",
          "indicator": "SMA",
          "parameters": {"period": "20", "source": "Close"},
          "valueType": "Value"
        },
        "explanation": "Price crosses below moving average"
      }
    ]
  }
]
```

#### 4. 添加示例前的重要说明

```typescript
IMPORTANT: Note the correct use of OR groups in the examples below:
- OR group with 2 conditions → requiredConditions = 1 (at least 1 must be true)
- OR group with 3+ conditions → requiredConditions can be 1, 2, etc. but NEVER equal to total conditions
- If all conditions must be met → use AND group instead
```

---

## 📊 逻辑对照表

### OR Group 的正确用法

| 条件总数 | requiredConditions 可选值 | 说明 |
|---------|-------------------------|------|
| 2 | 1 | 至少满足1个条件 |
| 3 | 1 或 2 | 至少满足1个或2个条件 |
| 4 | 1, 2, 或 3 | 至少满足1-3个条件 |
| N | 1 到 N-1 | 至少满足1到N-1个条件 |

### ❌ 错误用法

| 条件总数 | requiredConditions | 为什么错误 | 应该改为 |
|---------|-------------------|-----------|---------|
| 2 | 2 | 所有条件都必须满足 = AND逻辑 | AND group |
| 3 | 3 | 所有条件都必须满足 = AND逻辑 | AND group |
| 1 | 1 | OR group不应该只有1个条件 | AND group |

---

## 🎯 实际示例

### 正确示例 1: OR Group with 2 conditions

```json
{
  "logic": "OR",
  "requiredConditions": 1,
  "inequalities": [
    {"id": 1, "...": "RSI > 70"},
    {"id": 2, "...": "Price crosses below SMA"}
  ]
}
```
**解释**: 满足任意1个条件即可退出（正确的OR逻辑）

---

### 正确示例 2: OR Group with 3 conditions

```json
{
  "logic": "OR",
  "requiredConditions": 2,
  "inequalities": [
    {"id": 1, "...": "RSI > 80"},
    {"id": 2, "...": "Price > Upper Bollinger Band"},
    {"id": 3, "...": "ADX < 20"}
  ]
}
```
**解释**: 至少满足2个条件才退出（正确的OR逻辑）

---

### 正确示例 3: AND Group (when all conditions must be met)

```json
{
  "logic": "AND",
  "requiredConditions": 2,
  "inequalities": [
    {"id": 1, "...": "ADX > 25"},
    {"id": 2, "...": "Price > VWAP"}
  ]
}
```
**解释**: 所有2个条件都必须满足（正确的AND逻辑）

---

### ❌ 错误示例 1: OR Group with requiredConditions = total

```json
{
  "logic": "OR",          // ❌ 错误
  "requiredConditions": 2, // ❌ 等于总条件数
  "inequalities": [
    {"id": 1, "...": "ADX > 25"},
    {"id": 2, "...": "Price > VWAP"}
  ]
}
```
**问题**: requiredConditions(2) = 总条件数(2)，这就是AND逻辑  
**修正**: 改为 `"logic": "AND"`

---

### ❌ 错误示例 2: OR Group with only 1 condition

```json
{
  "logic": "OR",          // ❌ 错误
  "requiredConditions": 1,
  "inequalities": [
    {"id": 1, "...": "RSI > 70"} // ❌ 只有1个条件
  ]
}
```
**问题**: OR Group 不应该只有1个条件  
**修正**: 改为 AND Group 或添加更多条件

---

## 🧪 测试验证

### 测试用例 1: 简单退出策略
```javascript
{
  "assetType": "stock",
  "asset": "AAPL",
  "description": "Exit when RSI is overbought OR price crosses below SMA"
}
```

**预期结果**:
```json
{
  "exitRules": [
    {
      "logic": "OR",
      "requiredConditions": 1,  // ✓ 1 < 2 (总条件数)
      "inequalities": [
        {"...": "RSI > 70"},
        {"...": "Price crosses below SMA"}
      ]
    }
  ]
}
```

---

### 测试用例 2: 多重确认策略
```javascript
{
  "assetType": "stock",
  "asset": "TSLA",
  "description": "Enter when ADX shows strong trend AND price is above VWAP"
}
```

**预期结果**:
```json
{
  "entryRules": [
    {
      "logic": "AND",
      "requiredConditions": 2,  // ✓ 所有条件都必须满足，使用AND
      "inequalities": [
        {"...": "ADX > 25"},
        {"...": "Price > VWAP"}
      ]
    }
  ]
}
```

---

## 📝 AI 决策流程

AI 现在会按照以下流程决定使用 AND 还是 OR：

```
1. 分析用户描述中的逻辑关键词
   - "AND", "and", "与", "并且" → AND Group
   - "OR", "or", "或", "或者" → OR Group

2. 确定条件数量 N

3. 如果是 OR Group:
   a. 确保 N ≥ 2 (至少2个条件)
   b. 设置 requiredConditions = 1 到 N-1 之间
   c. 典型情况：requiredConditions = 1 (满足任意一个)

4. 如果是 AND Group:
   a. 设置 requiredConditions = N (所有条件都必须满足)

5. 如果用户意图是"所有条件都必须满足":
   → 使用 AND Group (不要使用 OR Group 配合 requiredConditions = N)
```

---

## ✅ 验证清单

- [x] 更新 CRITICAL RULE GROUP REQUIREMENTS
- [x] 更新 userPrompt 中的 Requirements
- [x] 改进示例1，使其有2个条件
- [x] 添加示例前的重要说明
- [x] 创建详细的文档说明
- [x] 提供正确和错误的对比示例
- [x] 添加测试用例

---

## 🎯 预期效果

修复后，AI 生成的策略将：

1. ✅ OR Group 永远不会出现 `requiredConditions = 总条件数` 的情况
2. ✅ OR Group 永远不会只包含1个条件
3. ✅ 当所有条件都必须满足时，自动使用 AND Group
4. ✅ OR Group 的 `requiredConditions` 总是 < 总条件数

---

**修复日期**: 2025年10月1日  
**版本**: v2.2  
**类型**: Logic Fix - OR Group Requirements  
**状态**: ✅ 已完成 