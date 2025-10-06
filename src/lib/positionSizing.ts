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
 * Conservative: 15% per trade
 * Moderate: 25% per trade  
 * Aggressive: 35% per trade
 */
const getRiskPercentage = (riskTolerance: RiskTolerance): number => {
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

  // Get risk percentage based on tolerance
  const positionPercentage = getRiskPercentage(riskTolerance);
  
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
      return 'Conservative (15% per trade)';
    case 'moderate':
      return 'Moderate (25% per trade)';
    case 'aggressive':
      return 'Aggressive (35% per trade)';
    default:
      return 'Moderate (25% per trade)';
  }
};

