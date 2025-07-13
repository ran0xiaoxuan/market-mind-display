
export type IndicatorSource = 'TAAPI.IO' | 'FMP' | 'User Input';

export const getIndicatorSource = (indicator: string): IndicatorSource => {
  const normalizedIndicator = indicator.toUpperCase();
  
  // TAAPI.IO indicators
  const taapiIndicators = [
    'RSI', 'MACD', 'SMA', 'EMA', 'BOLLINGER BANDS', 'BBANDS', 'STOCHASTIC',
    'ADX', 'ATR', 'CCI', 'WILLIAMS %R', 'WILLR', 'MOMENTUM', 'MOM', 'ROC',
    'CMO', 'MFI', 'STOCHRSI', 'ULTIMATE OSCILLATOR', 'AWESOME OSCILLATOR',
    'ICHIMOKU CLOUD', 'ICHIMOKU', 'PARABOLIC SAR', 'PSAR', 'SUPERTREND',
    'TTM SQUEEZE', 'KELTNER CHANNEL', 'KELTNER CHANNELS', 'DONCHIAN CHANNEL',
    'DONCHIAN', 'CHANDELIER EXIT', 'CHANDELIER', 'CHAIKIN MONEY FLOW',
    'VOLUME OSCILLATOR', 'HEIKIN ASHI', 'KAMA', 'WMA', 'TRIMA', 'VWAP',
    'DMI'
  ];
  
  // FMP indicators
  const fmpIndicators = [
    'VOLUME'
  ];
  
  if (taapiIndicators.includes(normalizedIndicator)) {
    return 'TAAPI.IO';
  } else if (fmpIndicators.includes(normalizedIndicator)) {
    return 'FMP';
  } else {
    return 'User Input';
  }
};

export const getSourceColor = (source: IndicatorSource): string => {
  switch (source) {
    case 'TAAPI.IO':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'FMP':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'User Input':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const formatPriceSource = (priceValue: string): string => {
  if (!priceValue) return 'Not specified';
  
  const formattedValue = priceValue.charAt(0).toUpperCase() + priceValue.slice(1).toLowerCase();
  return formattedValue;
};
