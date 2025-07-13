
// Mapping of indicators to their data sources
export const INDICATOR_SOURCES = {
  // TAAPI.IO Technical Indicators
  'RSI': 'TAAPI.IO',
  'MACD': 'TAAPI.IO',
  'Moving Average': 'TAAPI.IO',
  'SMA': 'TAAPI.IO',
  'EMA': 'TAAPI.IO',
  'Bollinger Bands': 'TAAPI.IO',
  'Stochastic': 'TAAPI.IO',
  'StochRSI': 'TAAPI.IO',
  'ADX': 'TAAPI.IO',
  'ATR': 'TAAPI.IO',
  'CCI': 'TAAPI.IO',
  'Williams %R': 'TAAPI.IO',
  'ROC': 'TAAPI.IO',
  'MFI': 'TAAPI.IO',
  'OBV': 'TAAPI.IO',
  'VWAP': 'TAAPI.IO',
  'Parabolic SAR': 'TAAPI.IO',
  'Ichimoku Cloud': 'TAAPI.IO',
  'Keltner Channel': 'TAAPI.IO',
  'Donchian Channel': 'TAAPI.IO',
  'Ultimate Oscillator': 'TAAPI.IO',
  'Commodity Channel Index': 'TAAPI.IO',
  'Momentum': 'TAAPI.IO',
  'Volume Oscillator': 'TAAPI.IO',
  'Heikin Ashi': 'TAAPI.IO',
  
  // FMP Price Data
  'Close': 'FMP',
  'Open': 'FMP',
  'High': 'FMP',
  'Low': 'FMP',
  'Volume': 'FMP',
  'PRICE': 'FMP',
  
  // Default fallback
  'VALUE': 'User Input'
} as const;

export const getIndicatorSource = (indicator?: string, type?: string): string => {
  if (!indicator && type === 'PRICE') {
    return 'FMP';
  }
  
  if (!indicator && type === 'VALUE') {
    return 'User Input';
  }
  
  if (!indicator) {
    return 'Unknown';
  }
  
  return INDICATOR_SOURCES[indicator as keyof typeof INDICATOR_SOURCES] || 'TAAPI.IO';
};

export const getSourceBadgeColor = (source: string): string => {
  switch (source) {
    case 'TAAPI.IO':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'FMP':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'User Input':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};
