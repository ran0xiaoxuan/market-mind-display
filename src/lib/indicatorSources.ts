
// Utility to determine the data source for indicators
export const getIndicatorSource = (indicator: string): string => {
  const indicatorUpper = indicator?.toUpperCase() || '';
  
  // TAAPI.IO indicators
  const taapiIndicators = [
    'RSI', 'MACD', 'SMA', 'EMA', 'BOLLINGER BANDS', 'BBANDS',
    'STOCHASTIC', 'STOCHRSI', 'ADX', 'ATR', 'CCI', 'WILLIAMS %R',
    'WILLR', 'MFI', 'CMO', 'MOMENTUM', 'MOM', 'ROC', 'KAMA',
    'ICHIMOKU CLOUD', 'ICHIMOKU', 'PARABOLIC SAR', 'PSAR',
    'SUPERTREND', 'TTM SQUEEZE', 'KELTNER CHANNEL', 'KELTNER CHANNELS',
    'DONCHIAN CHANNEL', 'DONCHIAN', 'CHANDELIER EXIT', 'CHANDELIER',
    'CHAIKIN MONEY FLOW', 'VOLUME OSCILLATOR', 'ULTIMATE OSCILLATOR',
    'AWESOME OSCILLATOR', 'DMI', 'HEIKIN ASHI', 'WMA', 'TRIMA'
  ];
  
  // FMP indicators (basic price data)
  const fmpIndicators = ['VWAP', 'VOLUME'];
  
  if (taapiIndicators.includes(indicatorUpper)) {
    return 'TAAPI.IO';
  } else if (fmpIndicators.includes(indicatorUpper)) {
    return 'FMP';
  } else {
    return 'User Input';
  }
};

// Get source badge color based on data source
export const getSourceBadgeColor = (source: string): string => {
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
