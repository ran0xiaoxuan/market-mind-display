# AI Risk Tolerance Inference Update

## Overview
Updated the AI Strategy page to automatically infer risk tolerance from user's strategy description instead of requiring manual selection.

## Implementation Date
October 3, 2025 (Second Update)

## Changes Summary

### 1. **User Interface Simplification** ✅

**Before**: Users had to manually select risk tolerance (Conservative/Moderate/Aggressive)

**After**: Users only input Account Capital; risk tolerance is automatically inferred by AI from strategy description

#### Modified Files:
- `src/pages/AIStrategy.tsx`
  - Removed Risk Tolerance selector UI
  - Kept only Account Capital input
  - Updated tooltip to mention risk will be inferred from description
  - Added accountCapital to generated strategy object

### 2. **AI Inference Logic** ✅

**File**: `supabase/functions/generate-strategy/index.ts`

Added intelligent risk tolerance detection:

```typescript
IMPORTANT - Risk Tolerance Analysis:
You MUST analyze the user's description and determine their risk tolerance. Look for keywords:
- CONSERVATIVE/DEFENSIVE: "safe", "low risk", "stable", "defensive", "conservative", 
  "protect capital", "avoid losses", "long-term"
- AGGRESSIVE/OFFENSIVE: "aggressive", "high risk", "quick profits", "momentum", 
  "volatile", "short-term", "active trading"
- MODERATE/BALANCED: "balanced", "moderate", "steady growth", or no specific keywords
```

**AI Response Format**:
- JSON must include `riskTolerance` field at root level
- Values: "conservative" | "moderate" | "aggressive"
- Default: "moderate" if no keywords detected

### 3. **Strategy Data Structure** ✅

**Files Updated**:
- `src/services/strategyService.ts`
  - Added `accountCapital?: number` to `GeneratedStrategy` interface
  - Added `riskTolerance?: string` to `GeneratedStrategy` interface
  - Updated `saveGeneratedStrategy()` to save both fields to database

### 4. **Strategy Preview Display** ✅

**File**: `src/pages/StrategyPreview.tsx`

Now displays:
- Account Capital: $X,XXX
- Risk Tolerance (AI Inferred): conservative/moderate/aggressive
  - Shows corresponding percentage range (5-10%, 10-15%, 15-25%)

### 5. **JSON Examples Updated** ✅

Updated AI prompt examples to include `riskTolerance` field:

```json
{
  "name": "RSI Oversold Strategy",
  "description": "Buy when RSI indicates oversold, sell when overbought",
  "timeframe": "1d",
  "targetAsset": "AAPL",
  "riskTolerance": "moderate",  // ← Added
  "entryRules": [...],
  "exitRules": [...]
}
```

## User Experience Flow

### Example 1: Conservative Strategy
**User Input**: "I want a safe long-term strategy that protects my capital"

**AI Analysis**: 
- Keywords detected: "safe", "long-term", "protects capital"
- **Inferred Risk**: `conservative`
- **Position Size**: 5-10% per trade

### Example 2: Aggressive Strategy
**User Input**: "Create an aggressive momentum strategy for quick profits"

**AI Analysis**:
- Keywords detected: "aggressive", "momentum", "quick profits"
- **Inferred Risk**: `aggressive`
- **Position Size**: 15-25% per trade

### Example 3: Neutral Strategy
**User Input**: "RSI-based trading strategy for AAPL"

**AI Analysis**:
- No risk keywords detected
- **Inferred Risk**: `moderate` (default)
- **Position Size**: 10-15% per trade

## Technical Details

### Position Sizing Logic (Unchanged)
```typescript
Conservative: 5-10% of account capital per trade
Moderate: 10-15% of account capital per trade
Aggressive: 15-25% of account capital per trade
```

### Database Fields
Both fields are saved to `strategies` table:
- `account_capital` (numeric)
- `risk_tolerance` (text: 'conservative'|'moderate'|'aggressive')

### Backward Compatibility
- Existing manual strategies: unchanged (users still select risk tolerance manually)
- AI strategies without risk keywords: default to 'moderate'
- Missing accountCapital: defaults to $10,000

## Benefits

1. **Simplified UX**: One less field for users to fill
2. **Intelligent Inference**: AI understands user intent from natural language
3. **Consistency**: Risk tolerance aligns with strategy description
4. **Flexibility**: Users can indicate risk level naturally in their description
5. **Default Fallback**: Safe default (moderate) when risk not specified

## Example User Descriptions and Inferred Risk

| User Description | Inferred Risk | Reasoning |
|-----------------|---------------|-----------|
| "Conservative long-term value investing" | Conservative | Contains "conservative", "long-term" |
| "Aggressive day trading with high leverage" | Aggressive | Contains "aggressive", "day trading" |
| "Balanced growth strategy" | Moderate | Contains "balanced" |
| "RSI crosses 30 then buy" | Moderate | No risk keywords (default) |
| "Safe dividend strategy for retirement" | Conservative | Contains "safe", "retirement" |
| "Quick scalping for volatile stocks" | Aggressive | Contains "quick", "volatile" |

## Testing Recommendations

1. Test various descriptions with risk keywords
2. Test neutral descriptions (should default to moderate)
3. Verify AI returns `riskTolerance` field in response
4. Verify strategy preview displays inferred risk
5. Verify saved strategies have correct risk_tolerance in database
6. Test position size calculations match risk tolerance

## Files Modified (7 files)

### Frontend
1. `src/pages/AIStrategy.tsx` - Removed risk selector, added accountCapital to strategy
2. `src/pages/StrategyPreview.tsx` - Display inferred risk tolerance
3. `src/services/strategyService.ts` - Updated interfaces and save function

### Backend
4. `supabase/functions/generate-strategy/index.ts` - Added AI inference logic

### Documentation
5. `AI_RISK_INFERENCE_UPDATE.md` - This file

## Deployment Steps

1. Deploy updated Edge Function:
   ```bash
   supabase functions deploy generate-strategy
   ```

2. Frontend changes are automatic (no additional steps needed)

3. Test AI strategy generation with various descriptions

## Notes

- Manual strategy creation still has explicit risk tolerance selection
- Strategy editing page still has explicit risk tolerance selection
- Only AI-generated strategies use automatic inference
- The inference happens server-side for consistency
- Risk tolerance can be edited after strategy creation if needed

## Maintenance

If adding new risk keywords in the future:
- Update the AI prompt in `generate-strategy/index.ts`
- Update this documentation
- Test with sample descriptions

---

**Implementation Status**: ✅ Complete
**Testing Status**: ⏳ Pending User Testing
**Documentation**: ✅ Complete

