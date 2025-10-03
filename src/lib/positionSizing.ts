/**
 * Position Sizing Utilities
 * Calculates trade position sizes based on account capital, risk tolerance, and asset price
 */

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

interface PositionSizeParams {
  accountCapital: number;
  riskTolerance: RiskTolerance;
  assetPrice: number;
}

interface PositionSizeResult {
  positionValue: number; // Dollar amount to invest
  quantity: number; // Number of shares/units to buy
  positionPercentage: number; // Percentage of account capital
}

/**
 * Get position size percentage based on risk tolerance
 * Conservative: 5-10% per trade
 * Moderate: 10-15% per trade  
 * Aggressive: 15-25% per trade
 */
const getRiskPercentageRange = (riskTolerance: RiskTolerance): { min: number; max: number } => {
  switch (riskTolerance) {
    case 'conservative':
      return { min: 0.05, max: 0.10 }; // 5-10%
    case 'moderate':
      return { min: 0.10, max: 0.15 }; // 10-15%
    case 'aggressive':
      return { min: 0.15, max: 0.25 }; // 15-25%
    default:
      return { min: 0.10, max: 0.15 }; // Default to moderate
  }
};

/**
 * Calculate position size for a trade
 * Returns the dollar amount to invest and the quantity of shares to buy
 */
export const calculatePositionSize = ({
  accountCapital,
  riskTolerance,
  assetPrice
}: PositionSizeParams): PositionSizeResult => {
  // Validate inputs
  if (accountCapital <= 0 || assetPrice <= 0) {
    return {
      positionValue: 0,
      quantity: 0,
      positionPercentage: 0
    };
  }

  // Get risk percentage range based on tolerance
  const { min, max } = getRiskPercentageRange(riskTolerance);
  
  // Use middle of the range for consistency
  const positionPercentage = (min + max) / 2;
  
  // Calculate position value in dollars
  const positionValue = accountCapital * positionPercentage;
  
  // Calculate quantity (number of shares/units)
  // Round down to whole numbers for stocks
  const quantity = Math.floor(positionValue / assetPrice);
  
  // Recalculate actual position value based on whole share quantity
  const actualPositionValue = quantity * assetPrice;
  const actualPositionPercentage = (actualPositionValue / accountCapital) * 100;
  
  return {
    positionValue: actualPositionValue,
    quantity,
    positionPercentage: actualPositionPercentage
  };
};

/**
 * Format position size for display
 */
export const formatPositionSize = (positionSize: PositionSizeResult): string => {
  return `$${positionSize.positionValue.toFixed(2)} (${positionSize.quantity} shares, ${positionSize.positionPercentage.toFixed(1)}%)`;
};

/**
 * Get risk tolerance description
 */
export const getRiskToleranceDescription = (riskTolerance: RiskTolerance): string => {
  switch (riskTolerance) {
    case 'conservative':
      return 'Conservative (5-10% per trade)';
    case 'moderate':
      return 'Moderate (10-15% per trade)';
    case 'aggressive':
      return 'Aggressive (15-25% per trade)';
    default:
      return 'Moderate (10-15% per trade)';
  }
};

