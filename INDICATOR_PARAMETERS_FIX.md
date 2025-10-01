# Indicator Parameters Fix - Parameter Consistency Update

## 🐛 发现的问题 (Issues Found)

在检查新增的15个技术指标时，发现了参数配置在不同文件中不一致的问题：

### 1. Stochastic RSI - 参数默认值不一致
**问题**: k 和 d 参数的默认值在不同文件中不一致

| 文件 | k 的默认值 | d 的默认值 | 状态 |
|------|-----------|-----------|------|
| EditModeInequality.tsx | 3 | 3 | ✓ 正确 |
| InequalitySide.tsx | 14 | 3 | ✗ 错误 |
| generate-strategy | 14 | 3 | ✗ 错误 |

**解释**: Stochastic RSI 的 k 和 d 参数是平滑周期，标准默认值应该是 3, 3，而不是 14, 3。

### 2. EditModeInequality.tsx - 缺少新增指标
**问题**: 新增的15个指标中，有些没有默认参数配置

缺少的指标：
- ❌ DEMA (双指数移动平均线)
- ❌ TEMA (三指数移动平均线)
- ❌ HMA (赫尔移动平均线)
- ❌ NATR (标准化ATR)
- ❌ OBV (能量潮)
- ❌ Williams %R (拼写错误: "williamsর" → "williams%r")
- ❌ CMF (缺少简写别名)

### 3. InequalitySide.tsx - 缺少指标别名
**问题**: 某些指标缺少常用别名

- ❌ Stochastic RSI 缺少 "stochasticrsi" 别名
- ❌ CMF 缺少 "cmf" 别名（只有 "chaikinmoneyflow")

---

## ✅ 解决方案 (Solutions)

### 修改的文件 (4个)

#### 1. `src/components/strategy-detail/components/InequalitySide.tsx`

**修改 1: 修正 Stochastic RSI 的 k 参数 placeholder**
```typescript
// 修改前
<IndicatorParameter 
  name="k" 
  value={sideObj.parameters?.k ?? ''} 
  placeholder="14"  // ✗ 错误
  onChange={value => updateParameters(side, 'k', value)} 
/>

// 修改后
<IndicatorParameter 
  name="k" 
  value={sideObj.parameters?.k ?? ''} 
  placeholder="3"  // ✓ 正确
  onChange={value => updateParameters(side, 'k', value)} 
/>
```

**修改 2: 添加 Stochastic RSI 别名**
```typescript
case 'stochrsi':
case 'stochasticrsi':  // ✓ 新增别名
```

**修改 3: 添加 CMF 别名**
```typescript
case 'chaikinmoneyflow':
case 'cmf':  // ✓ 新增别名
```

---

#### 2. `src/components/strategy-detail/components/EditModeInequality.tsx`

**修改 1: 添加 DEMA, TEMA, HMA 默认值**
```typescript
case 'dema':
case 'tema':
case 'hma':
  return { period: '14', source: 'close' };
```

**修改 2: 修正 VWAP 默认参数**
```typescript
// 修改前
case 'vwap':
  return {}; // ✗ 空对象

// 修改后
case 'vwap':
  return { source: 'close' }; // ✓ VWAP需要source参数
```

**修改 3: 修正 Williams %R 拼写**
```typescript
// 修改前
case 'williamsর':  // ✗ 拼写错误

// 修改后
case 'williams%r':  // ✓ 正确拼写
```

**修改 4: 分离 ROC 和 Momentum**
```typescript
// 修改前
case 'momentum':
case 'mom':
case 'roc':
  return { period: '14', source: 'close' };

// 修改后
case 'momentum':
case 'mom':
  return { period: '14', source: 'close' };
case 'roc':
  return { period: '14', source: 'close' };
```

**修改 5: 添加 Stochastic RSI 别名**
```typescript
case 'stochrsi':
case 'stochasticrsi':  // ✓ 新增别名
  return { rsiPeriod: '14', stochasticLength: '14', k: '3', d: '3' };
```

**修改 6: 添加 NATR 默认值**
```typescript
case 'natr':
  return { period: '14', source: 'close' };
```

**修改 7: 添加 OBV 默认值**
```typescript
case 'obv':
  return {}; // OBV doesn't need parameters
```

**修改 8: 添加 CMF 别名**
```typescript
case 'chaikinmoneyflow':
case 'cmf':  // ✓ 新增别名
  return { period: '20' };
```

---

#### 3. `src/services/taapiService.ts`

**修改: 修正 Stochastic RSI 参数映射的默认值**
```typescript
// 修改前
case "stochrsi":
  params.rsiPeriod = parseInt(parameters.rsiPeriod || "14");
  params.stochasticLength = parseInt(parameters.stochasticLength || "14");
  params.kPeriod = parseInt(parameters.k || parameters.kPeriod || parameters.fastK || "14");  // ✗ 错误
  params.dPeriod = parseInt(parameters.d || parameters.dPeriod || parameters.fastD || "3");
  break;

// 修改后
case "stochrsi":
  params.rsiPeriod = parseInt(parameters.rsiPeriod || "14");
  params.stochasticLength = parseInt(parameters.stochasticLength || "14");
  params.kPeriod = parseInt(parameters.k || parameters.kPeriod || parameters.fastK || "3");  // ✓ 正确
  params.dPeriod = parseInt(parameters.d || parameters.dPeriod || parameters.fastD || "3");
  break;
```

---

#### 4. `supabase/functions/generate-strategy/index.ts`

**修改: 修正 Stochastic RSI 的默认值**
```typescript
// 修改前
Stochastic RSI:
- parameters: {"rsiPeriod": "number", "stochasticLength": "number", "k": "number", "d": "number"}
- valueType: "K Value" or "D Value"
- default: rsiPeriod=14, stochasticLength=14, k=14, d=3  // ✗ 错误
- range: 0-100 (typical thresholds: 20/80)

// 修改后
Stochastic RSI:
- parameters: {"rsiPeriod": "number", "stochasticLength": "number", "k": "number", "d": "number"}
- valueType: "K Value" or "D Value"
- default: rsiPeriod=14, stochasticLength=14, k=3, d=3  // ✓ 正确
- range: 0-100 (typical thresholds: 20/80)
- note: k and d are smoothing periods for the stochastic calculation
```

---

## 📊 完整的新增指标参数对照表

### Moving Averages (移动平均线)

| 指标 | 参数 | 默认值 | 说明 |
|------|-----|--------|------|
| DEMA | period, source | 14, close | 双指数移动平均线 |
| TEMA | period, source | 14, close | 三指数移动平均线 |
| HMA | period, source | 14, close | 赫尔移动平均线 |
| VWAP | source | close | 成交量加权平均价 |

### Oscillators (振荡器)

| 指标 | 参数 | 默认值 | 说明 |
|------|-----|--------|------|
| Stochastic RSI | rsiPeriod, stochasticLength, k, d | 14, 14, 3, 3 | k,d是平滑周期 |
| ROC | period, source | 14, close | 变动率 |
| Williams %R | period | 14 | 威廉指标 |
| CMO | period, source | 14, close | 钱德动量摆动指标 |

### Trend Indicators (趋势指标)

| 指标 | 参数 | 默认值 | 说明 |
|------|-----|--------|------|
| ADX | adxSmoothing, diLength | 14, 14 | 平均趋向指标 |
| SuperTrend | atrPeriod, multiplier | 10, 3 | 超级趋势 |

### Volatility Indicators (波动性指标)

| 指标 | 参数 | 默认值 | 说明 |
|------|-----|--------|------|
| NATR | period, source | 14, close | 标准化ATR |
| Keltner Channel | period, atrPeriod, multiplier | 20, 20, 2 | 肯特纳通道 |
| Donchian Channel | period | 20 | 唐奇安通道 |

### Volume Indicators (成交量指标)

| 指标 | 参数 | 默认值 | 说明 |
|------|-----|--------|------|
| OBV | none | - | 能量潮 |
| CMF | period | 20 | 蔡金资金流量 |

---

## 🧪 测试验证

### 测试场景 1: Stochastic RSI 参数
```typescript
// 在Trading Rules中添加Stochastic RSI
// 预期: 自动填充默认参数
{
  "indicator": "Stochastic RSI",
  "parameters": {
    "rsiPeriod": "14",
    "stochasticLength": "14",
    "k": "3",  // ✓ 应该是 3
    "d": "3"   // ✓ 应该是 3
  }
}
```

### 测试场景 2: 使用 CMF 简写
```typescript
// 在Trading Rules中添加CMF（使用简写）
// 预期: 正确识别并显示参数
{
  "indicator": "CMF",  // ✓ 使用简写也能识别
  "parameters": {
    "period": "20"
  }
}
```

### 测试场景 3: AI 生成 Stochastic RSI 策略
```javascript
{
  "assetType": "stock",
  "asset": "AAPL",
  "description": "Create a strategy using Stochastic RSI for entry signals"
}
```

**预期 AI 生成**:
```json
{
  "left": {
    "type": "INDICATOR",
    "indicator": "Stochastic RSI",
    "parameters": {
      "rsiPeriod": "14",
      "stochasticLength": "14",
      "k": "3",  // ✓ 正确
      "d": "3"   // ✓ 正确
    },
    "valueType": "K Value"
  }
}
```

---

## ✅ 验证清单

- [x] 修正 Stochastic RSI 的 k 参数 placeholder (InequalitySide.tsx)
- [x] 添加 Stochastic RSI 的别名支持 (InequalitySide.tsx, EditModeInequality.tsx)
- [x] 添加 DEMA, TEMA, HMA 默认参数 (EditModeInequality.tsx)
- [x] 修正 VWAP 默认参数 (EditModeInequality.tsx)
- [x] 修正 Williams %R 拼写 (EditModeInequality.tsx)
- [x] 添加 NATR 默认参数 (EditModeInequality.tsx)
- [x] 添加 OBV 默认参数 (EditModeInequality.tsx)
- [x] 添加 CMF 别名支持 (InequalitySide.tsx, EditModeInequality.tsx)
- [x] 修正 taapiService.ts 中的 Stochastic RSI 参数映射
- [x] 修正 generate-strategy 中的 Stochastic RSI 规格
- [x] 创建完整的参数对照表文档

---

## 📝 技术说明

### Stochastic RSI 参数解释

Stochastic RSI 有 4 个参数：
1. **rsiPeriod** (默认14): 计算 RSI 的周期
2. **stochasticLength** (默认14): 对 RSI 应用 Stochastic 的周期
3. **k** (默认3): Stochastic 的 %K 平滑周期
4. **d** (默认3): Stochastic 的 %D 平滑周期

错误的配置 (k=14, d=3) 会导致指标过于平滑，反应迟钝。
正确的配置 (k=3, d=3) 能保持指标的敏感性。

### 指标别名的重要性

添加指标别名可以：
- 支持不同的命名习惯 ("Stochastic RSI" vs "StochRSI")
- 提高用户体验（用户可以用简写 "CMF" 而不是全名）
- 确保 AI 生成的策略能正确识别

---

## 🎯 预期效果

修复后，所有指标的参数将：

1. ✅ **一致性**: 前端UI、服务层、AI生成器三者完全一致
2. ✅ **准确性**: 所有默认值符合行业标准
3. ✅ **完整性**: 所有新增指标都有完整的参数配置
4. ✅ **易用性**: 支持常用别名，提升用户体验

---

## 📈 修改统计

| 文件 | 修改次数 | 类型 |
|------|---------|------|
| InequalitySide.tsx | 3 | 参数修正、别名添加 |
| EditModeInequality.tsx | 8 | 默认值添加、拼写修正 |
| taapiService.ts | 1 | 参数映射默认值修正 |
| generate-strategy/index.ts | 1 | AI 提示词参数规格修正 |
| **总计** | **13** | **4个文件** |

---

**修复日期**: 2025年10月1日  
**版本**: v2.3  
**类型**: Parameter Consistency Fix  
**状态**: ✅ 已完成 