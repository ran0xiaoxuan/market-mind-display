# Account Capital & Risk Tolerance Feature Implementation Summary

## Overview
Successfully implemented the "Account Capital" and "Signal Amount" feature, allowing users to specify investment amounts and risk tolerance when creating trading strategies. The system now calculates position sizes (quantity and amount) for each trading signal based on these parameters.

## Implementation Date
October 3, 2025

## Changes Made

### 1. Database Schema Updates ✅
**File**: `supabase/migrations/20251003100000_add_account_capital_and_risk_tolerance.sql`

Added two new fields to the `strategies` table:
- `account_capital` (numeric, default: 10000, min: 100): Total capital allocated to the strategy
- `risk_tolerance` (text, default: 'moderate'): Risk preference (conservative/moderate/aggressive)

**Risk Tolerance Mapping**:
- **Conservative** (Defensive): 5-10% per trade - Smaller, safer positions
- **Moderate** (Balanced): 10-15% per trade - Medium positions
- **Aggressive** (Offensive): 15-25% per trade - Larger positions for higher returns

### 2. TypeScript Type Definitions ✅
**File**: `src/integrations/supabase/types.ts`

Updated the `strategies` table type definitions to include:
- `account_capital?: number | null`
- `risk_tolerance?: string | null`

**File**: `src/services/strategyService.ts`

Updated the `Strategy` interface to include these new fields.

### 3. Frontend Form Updates ✅

#### ManualStrategy.tsx
- Added account capital input field (number input, min $100)
- Added risk tolerance selector (3 options: Conservative/Moderate/Aggressive)
- Added validation for both fields
- Integrated with strategy creation logic
- Added tooltips explaining each option

#### AIStrategy.tsx
- Added Investment Configuration card with:
  - Account Capital input
  - Risk Tolerance selector
- Values passed to AI strategy generation
- Default values: $10,000 and Moderate

#### EditStrategy.tsx
- Added account capital input field
- Added risk tolerance selector
- Load existing values when editing
- Save updated values on form submission
- Full validation support

### 4. Position Sizing Calculation ✅

**File**: `src/lib/positionSizing.ts`

Created a comprehensive utility module for calculating position sizes:
- `calculatePositionSize()`: Calculates dollar amount and share quantity based on capital, risk tolerance, and asset price
- `formatPositionSize()`: Formats position size for display
- `getRiskToleranceDescription()`: Returns human-readable descriptions

**Calculation Logic**:
```
1. Get risk percentage range based on tolerance
2. Calculate position value = account_capital × risk_percentage
3. Calculate quantity = floor(position_value / asset_price)
4. Calculate actual amount = quantity × asset_price
```

### 5. Signal Generation Updates ✅

#### Edge Function: `monitor-trading-signals/index.ts`
- Updated `Strategy` interface to include new fields
- Added `PositionSizeCalculator` class
- Integrated position calculation into signal generation
- Signal data now includes:
  - `quantity`: Number of shares to trade
  - `amount`: Total dollar amount
  - `position_percentage`: Percentage of account capital
  - `account_capital`: Strategy's total capital
  - `risk_tolerance`: Strategy's risk profile

### 6. AI Strategy Generation ✅

**File**: `supabase/functions/generate-strategy/index.ts`

Updated AI prompt to consider risk tolerance:
- Extracts `accountCapital` and `riskTolerance` from request body
- Provides user's investment profile to AI
- AI generates strategies tailored to risk tolerance:
  - Conservative: Multiple confirmations, stable indicators, longer periods
  - Moderate: Balanced approach with mixed indicators
  - Aggressive: Volatile indicators, momentum-based, quicker moves

### 7. Trading Signal Display ✅

#### TradeHistoryTable Component
Updated to display new trading information:
- Added **Quantity** column: Shows number of shares
- Added **Amount** column: Shows total dollar amount ($X,XXX.XX format)
- Updated table colspan for empty states
- Graceful handling of missing data (shows "—" for null values)

#### Dashboard Hook
**File**: `src/hooks/useOptimizedDashboard.ts`

Updated to extract and pass quantity and amount from signal data to display components.

## Database Migration

To apply the database changes, run:

```bash
# Using Supabase CLI
supabase db reset

# Or apply specific migration
supabase migration up
```

## Testing Checklist

### Manual Strategy Creation
- [ ] Create strategy with minimum capital ($100)
- [ ] Create strategy with Conservative risk tolerance
- [ ] Create strategy with Moderate risk tolerance
- [ ] Create strategy with Aggressive risk tolerance
- [ ] Verify validation errors for invalid inputs
- [ ] Verify strategy saves with correct values

### AI Strategy Generation
- [ ] Generate strategy with different capital amounts
- [ ] Generate strategy with each risk tolerance level
- [ ] Verify AI considers risk tolerance in strategy design
- [ ] Verify strategy preview shows correct parameters

### Strategy Editing
- [ ] Edit existing strategy capital amount
- [ ] Edit existing strategy risk tolerance
- [ ] Verify existing values load correctly
- [ ] Verify updates save properly

### Signal Generation & Display
- [ ] Verify signals include quantity and amount
- [ ] Verify position sizes match risk tolerance:
  - Conservative: 5-10% of capital
  - Moderate: 10-15% of capital
  - Aggressive: 15-25% of capital
- [ ] Verify Dashboard displays quantity and amount
- [ ] Verify Trade History displays correctly

### Edge Cases
- [ ] Test with very small capital ($100)
- [ ] Test with very large capital ($1,000,000+)
- [ ] Test with low-price stocks ($1-10)
- [ ] Test with high-price stocks ($500+)
- [ ] Verify quantity calculation (always whole numbers)

## Key Features

1. **Dynamic Position Sizing**: Automatically calculates appropriate position sizes based on user's risk tolerance
2. **Real-time Price Integration**: Uses current market price to calculate exact share quantities
3. **Risk-Aware Strategy Generation**: AI considers risk tolerance when generating trading rules
4. **Comprehensive Display**: Shows quantity, amount, and percentage for every trading signal
5. **Validation**: Ensures minimum capital requirements and valid risk tolerance selection
6. **Backward Compatibility**: Existing strategies without these fields use default values (10000, moderate)

## Files Modified

### Frontend (React/TypeScript)
1. `src/pages/ManualStrategy.tsx`
2. `src/pages/AIStrategy.tsx`
3. `src/pages/EditStrategy.tsx`
4. `src/integrations/supabase/types.ts`
5. `src/services/strategyService.ts`
6. `src/components/strategy-detail/TradeHistoryTable.tsx`
7. `src/hooks/useOptimizedDashboard.ts`
8. `src/lib/positionSizing.ts` (new file)

### Backend (Supabase Edge Functions)
1. `supabase/functions/generate-strategy/index.ts`
2. `supabase/functions/monitor-trading-signals/index.ts`

### Database
1. `supabase/migrations/20251003100000_add_account_capital_and_risk_tolerance.sql` (new file)

## Future Enhancements

Potential improvements for future iterations:

1. **Position Sizing Strategies**: Add more sophisticated position sizing methods (Kelly Criterion, Fixed Fractional, etc.)
2. **Risk Management**: Implement stop-loss and take-profit based on risk tolerance
3. **Portfolio View**: Aggregate view of all positions across strategies
4. **Performance Metrics**: Track actual vs. expected position sizes
5. **Historical Analysis**: Analyze performance by risk tolerance level
6. **Multi-Asset Correlation**: Adjust position sizes based on portfolio correlation
7. **Dynamic Risk Adjustment**: Automatically adjust risk tolerance based on performance
8. **Custom Risk Levels**: Allow users to define custom risk percentage ranges

## Notes

- All UI text is in English as requested
- Position sizes are calculated using whole share quantities (no fractional shares)
- Default values ensure backward compatibility with existing strategies
- The feature is fully integrated with the existing signal monitoring and notification system
- All calculations happen in real-time using current market data

## Support

If you encounter any issues:
1. Check database migration was applied successfully
2. Verify Supabase Edge Functions are deployed
3. Check browser console for any JavaScript errors
4. Verify signal data includes quantity and amount fields

## Contributors

Implementation completed on October 3, 2025

