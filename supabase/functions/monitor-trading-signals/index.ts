
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type definitions
interface Strategy {
  id: string;
  name: string;
  target_asset: string;
  timeframe: string;
  user_id: string;
  daily_signal_limit?: number;
  is_active: boolean;
  rule_groups: RuleGroup[];
}

interface RuleGroup {
  id: string;
  logic: 'AND' | 'OR';
  rule_type: 'entry' | 'exit';
  required_conditions?: number;
  trading_rules: TradingRule[];
}

interface TradingRule {
  id: string;
  left_type: string;
  left_indicator?: string;
  left_parameters?: Record<string, any>;
  left_value?: string;
  left_value_type?: string;
  condition: string;
  right_type: string;
  right_indicator?: string;
  right_parameters?: Record<string, any>;
  right_value?: string;
  right_value_type?: string;
}

interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical Indicators Calculator Class
class TechnicalIndicators {
  // Simple Moving Average
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < Math.min(prices.length, period * 2); i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Relative Strength Index
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // MACD
  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { line: number, signal: number, histogram: number } {
    if (prices.length < slowPeriod) return { line: 0, signal: 0, histogram: 0 };
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    // Simplified signal line calculation
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    
    return { line: macdLine, signal: signalLine, histogram };
  }

  // Commodity Channel Index
  static calculateCCI(highs: number[], lows: number[], closes: number[], period: number = 20): number {
    if (closes.length < period) return 0;
    
    const typicalPrices = closes.slice(0, period).map((close, i) => 
      (highs[i] + lows[i] + close) / 3
    );
    
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, price) => 
      sum + Math.abs(price - sma), 0
    ) / period;
    
    if (meanDeviation === 0) return 0;
    
    const currentTypicalPrice = (highs[0] + lows[0] + closes[0]) / 3;
    return (currentTypicalPrice - sma) / (0.015 * meanDeviation);
  }

  // Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number = 20, deviation: number = 2): { upper: number, middle: number, lower: number } {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
    
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(0, period).reduce((sum, price) => 
      sum + Math.pow(price - sma, 2), 0
    ) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (deviation * stdDev),
      middle: sma,
      lower: sma - (deviation * stdDev)
    };
  }

  // Stochastic Oscillator
  static calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number, d: number } {
    if (closes.length < kPeriod) return { k: 0, d: 0 };
    
    const highestHigh = Math.max(...highs.slice(0, kPeriod));
    const lowestLow = Math.min(...lows.slice(0, kPeriod));
    
    const k = ((closes[0] - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.9; // Simplified
    
    return { k, d };
  }

  // Average True Range
  static calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 0;
    
    let trSum = 0;
    
    for (let i = 0; i < period; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = i < closes.length - 1 ? closes[i + 1] : closes[i];
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trSum += tr;
    }
    
    return trSum / period;
  }

  // Williams %R
  static calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length < period) return 0;
    
    const highestHigh = Math.max(...highs.slice(0, period));
    const lowestLow = Math.min(...lows.slice(0, period));
    
    return ((highestHigh - closes[0]) / (highestHigh - lowestLow)) * -100;
  }

  // Money Flow Index
  static calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 0; i < period; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const prevTypicalPrice = i < closes.length - 1 ? 
        (highs[i + 1] + lows[i + 1] + closes[i + 1]) / 3 : typicalPrice;
      
      const moneyFlow = typicalPrice * volumes[i];
      
      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += moneyFlow;
      } else if (typicalPrice < prevTypicalPrice) {
        negativeFlow += moneyFlow;
      }
    }
    
    if (negativeFlow === 0) return 100;
    
    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyRatio));
  }
}

// Market Hours Checker
class MarketHoursChecker {
  static isMarketOpen(): boolean {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      const partsObj = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as any);
      
      const dayName = partsObj.weekday;
      const hour = parseInt(partsObj.hour);
      const minute = parseInt(partsObj.minute);
      
      console.log(`[MarketHours] Current EST time: ${dayName} ${partsObj.hour}:${partsObj.minute}`);
      
      // Check if it's a weekday
      const isWeekday = !['Saturday', 'Sunday'].includes(dayName);
      
      if (!isWeekday) {
        console.log(`[MarketHours] Market closed - Weekend`);
        return false;
      }
      
      // Market hours: 9:30 AM to 4:00 PM EST
      const currentMinutes = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
      console.log(`[MarketHours] Market is ${isOpen ? 'OPEN' : 'CLOSED'}`);
      
      return isOpen;
    } catch (error) {
      console.error('[MarketHours] Error checking market hours:', error);
      return false;
    }
  }
}

// Market Data Service
class MarketDataService {
  private fmpApiKey: string;

  constructor(fmpApiKey: string) {
    this.fmpApiKey = fmpApiKey;
  }

  private mapTimeframeToFmpInterval(timeframe: string): string {
    const timeframeMap: { [key: string]: string } = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1hour',
      '4h': '4hour',
      'Daily': '1day',
      'Weekly': '1week',
      'Monthly': '1month'
    };
    
    return timeframeMap[timeframe] || '1day';
  }

  async fetchMarketData(symbol: string, timeframe: string, limit: number = 100): Promise<MarketData[]> {
    const fmpInterval = this.mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${this.fmpApiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${this.fmpApiKey}`;
    }

    console.log(`[MarketData] Fetching data for ${symbol} with timeframe ${timeframe}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let marketData: MarketData[] = [];
    
    if (fmpInterval === '1day' || fmpInterval === '1week' || fmpInterval === '1month') {
      if (data.historical && Array.isArray(data.historical)) {
        marketData = data.historical
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          }))
          .reverse();
      }
    } else {
      if (Array.isArray(data)) {
        marketData = data
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          }))
          .reverse();
      }
    }

    if (marketData.length === 0) {
      throw new Error(`No market data found for ${symbol}`);
    }

    console.log(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    return marketData;
  }
}

// Strategy Evaluator
class StrategyEvaluator {
  private indicators: Map<string, any> = new Map();

  async calculateIndicatorsForStrategy(strategy: Strategy, marketData: MarketData[]): Promise<void> {
    this.indicators.clear();
    
    console.log(`[StrategyEvaluator] Calculating indicators for strategy ${strategy.name}`);
    
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);
    
    // Store current prices
    this.indicators.set('PRICE_close', closes[0]);
    this.indicators.set('PRICE_open', marketData[0].open);
    this.indicators.set('PRICE_high', highs[0]);
    this.indicators.set('PRICE_low', lows[0]);
    
    console.log(`[StrategyEvaluator] Current prices - Close: ${closes[0]}, Open: ${marketData[0].open}`);
    
    // Calculate indicators based on strategy rules
    const indicatorConfigs = this.extractIndicatorConfigs(strategy);
    
    for (const [configKey, params] of indicatorConfigs) {
      const indicatorName = configKey.split('_')[0];
      
      try {
        const source = params.source || 'close';
        const sourcePrices = this.getPriceBySource(marketData, source);
        
        let indicatorValue: any;
        
        switch (indicatorName.toLowerCase()) {
          case 'sma':
            const period = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateSMA(sourcePrices, period);
            break;
            
          case 'ema':
            const emaPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateEMA(sourcePrices, emaPeriod);
            break;
            
          case 'rsi':
            const rsiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateRSI(sourcePrices, rsiPeriod);
            break;
            
          case 'macd':
            const fastPeriod = parseInt(params.fast || params.fastPeriod || '12');
            const slowPeriod = parseInt(params.slow || params.slowPeriod || '26');
            const signalPeriod = parseInt(params.signal || params.signalPeriod || '9');
            indicatorValue = TechnicalIndicators.calculateMACD(sourcePrices, fastPeriod, slowPeriod, signalPeriod);
            break;
            
          case 'cci':
            const cciPeriod = parseInt(params.period || '20');
            indicatorValue = TechnicalIndicators.calculateCCI(highs, lows, closes, cciPeriod);
            break;
            
          case 'bollingerbands':
          case 'bbands':
            const bbPeriod = parseInt(params.period || '20');
            const deviation = parseFloat(params.deviation || '2');
            indicatorValue = TechnicalIndicators.calculateBollingerBands(sourcePrices, bbPeriod, deviation);
            break;
            
          case 'stochastic':
            const kPeriod = parseInt(params.k || params.kPeriod || '14');
            const dPeriod = parseInt(params.d || params.dPeriod || '3');
            indicatorValue = TechnicalIndicators.calculateStochastic(highs, lows, closes, kPeriod, dPeriod);
            break;
            
          case 'atr':
            const atrPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateATR(highs, lows, closes, atrPeriod);
            break;
            
          case 'williamsr':
          case 'willr':
            const willrPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateWilliamsR(highs, lows, closes, willrPeriod);
            break;
            
          case 'mfi':
            const mfiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateMFI(highs, lows, closes, volumes, mfiPeriod);
            break;
            
          default:
            console.warn(`[StrategyEvaluator] Unknown indicator: ${indicatorName}`);
            indicatorValue = 0;
        }
        
        this.indicators.set(configKey, indicatorValue);
        console.log(`[StrategyEvaluator] Calculated ${indicatorName}: ${JSON.stringify(indicatorValue)}`);
        
      } catch (error) {
        console.error(`[StrategyEvaluator] Error calculating ${indicatorName}:`, error);
        this.indicators.set(configKey, 0);
      }
    }
  }

  private extractIndicatorConfigs(strategy: Strategy): Map<string, Record<string, any>> {
    const indicatorConfigs = new Map<string, Record<string, any>>();
    
    strategy.rule_groups.forEach(group => {
      group.trading_rules.forEach(rule => {
        if (rule.left_type === 'INDICATOR' && rule.left_indicator && rule.left_parameters) {
          const key = `${rule.left_indicator}_${JSON.stringify(rule.left_parameters)}`;
          indicatorConfigs.set(key, rule.left_parameters);
        }
        
        if (rule.right_type === 'INDICATOR' && rule.right_indicator && rule.right_parameters) {
          const key = `${rule.right_indicator}_${JSON.stringify(rule.right_parameters)}`;
          indicatorConfigs.set(key, rule.right_parameters);
        }
      });
    });
    
    return indicatorConfigs;
  }

  private getPriceBySource(marketData: MarketData[], source: string = 'close'): number[] {
    switch (source.toLowerCase()) {
      case 'open': return marketData.map(d => d.open);
      case 'high': return marketData.map(d => d.high);
      case 'low': return marketData.map(d => d.low);
      case 'close':
      default: return marketData.map(d => d.close);
    }
  }

  private getIndicatorValue(type: string, indicator?: string, params?: Record<string, any>, valueType?: string): number {
    if (type === 'PRICE') {
      return this.indicators.get(`PRICE_${indicator}`) || 0;
    }
    
    if (type === 'INDICATOR' && indicator && params) {
      const configKey = `${indicator}_${JSON.stringify(params)}`;
      const indicatorResult = this.indicators.get(configKey);
      
      if (typeof indicatorResult === 'object' && indicatorResult !== null) {
        switch (valueType?.toLowerCase()) {
          case 'signal': return indicatorResult.signal || 0;
          case 'line': return indicatorResult.line || 0;
          case 'histogram': return indicatorResult.histogram || 0;
          case 'upper': return indicatorResult.upper || 0;
          case 'middle': return indicatorResult.middle || 0;
          case 'lower': return indicatorResult.lower || 0;
          case 'k': return indicatorResult.k || 0;
          case 'd': return indicatorResult.d || 0;
          default: return indicatorResult.line || indicatorResult.value || indicatorResult.k || Object.values(indicatorResult)[0] || 0;
        }
      }
      
      return typeof indicatorResult === 'number' ? indicatorResult : 0;
    }
    
    return 0;
  }

  private evaluateCondition(condition: string, leftValue: number, rightValue: number): boolean {
    console.log(`[Condition] Evaluating: ${leftValue} ${condition} ${rightValue}`);
    
    switch (condition) {
      case 'GREATER_THAN': return leftValue > rightValue;
      case 'LESS_THAN': return leftValue < rightValue;
      case 'EQUAL': return Math.abs(leftValue - rightValue) < 0.0001;
      case 'GREATER_THAN_OR_EQUAL': return leftValue >= rightValue;
      case 'LESS_THAN_OR_EQUAL': return leftValue <= rightValue;
      case 'CROSSES_ABOVE': return leftValue > rightValue;
      case 'CROSSES_BELOW': return leftValue < rightValue;
      default: return false;
    }
  }

  private evaluateRuleGroup(group: RuleGroup): boolean {
    if (!group.trading_rules || group.trading_rules.length === 0) {
      return false;
    }

    console.log(`[RuleGroup] Evaluating group ${group.id} (${group.rule_type})`);
    console.log(`[RuleGroup] Logic: ${group.logic}, Rules: ${group.trading_rules.length}`);

    const results = group.trading_rules.map((rule, index) => {
      // Get left side value
      let leftValue: number;
      if (rule.left_type === 'VALUE') {
        leftValue = parseFloat(rule.left_value || '0');
      } else {
        leftValue = this.getIndicatorValue(rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type);
      }
      
      // Get right side value
      let rightValue: number;
      if (rule.right_type === 'VALUE') {
        rightValue = parseFloat(rule.right_value || '0');
      } else {
        rightValue = this.getIndicatorValue(rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type);
      }
      
      const result = this.evaluateCondition(rule.condition, leftValue, rightValue);
      console.log(`[RuleGroup] Rule ${index + 1}: ${leftValue} ${rule.condition} ${rightValue} = ${result}`);
      
      return result;
    });

    const trueCount = results.filter(Boolean).length;
    
    let groupResult: boolean;
    if (group.logic === 'OR') {
      const requiredConditions = group.required_conditions || 1;
      groupResult = trueCount >= requiredConditions;
    } else {
      groupResult = results.every(Boolean);
    }

    console.log(`[RuleGroup] Group result: ${groupResult}`);
    return groupResult;
  }

  evaluateStrategy(strategy: Strategy): { entrySignal: boolean, exitSignal: boolean } {
    console.log(`[Strategy] Evaluating strategy: ${strategy.name}`);
    
    const entryGroups = strategy.rule_groups.filter(group => group.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(group => group.rule_type === 'exit');

    const entrySignal = entryGroups.some(group => this.evaluateRuleGroup(group));
    const exitSignal = exitGroups.some(group => this.evaluateRuleGroup(group));

    console.log(`[Strategy] Final result - Entry: ${entrySignal}, Exit: ${exitSignal}`);
    return { entrySignal, exitSignal };
  }
}

// Notification Service
class NotificationService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  private async checkUserProStatus(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error) return false;
      
      const tier = profile?.subscription_tier;
      return tier === 'pro' || tier === 'premium';
    } catch (error) {
      console.error('Error checking user subscription:', error);
      return false;
    }
  }

  private async checkDailySignalLimit(strategyId: string, userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: strategy, error: strategyError } = await this.supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (strategyError || !strategy) return false;

      const { data: dailyCount, error: countError } = await this.supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (countError && countError.code !== 'PGRST116') return true;

      const currentCount = dailyCount?.notification_count || 0;
      const dailyLimit = strategy.daily_signal_limit || 5;

      return currentCount < dailyLimit;
    } catch (error) {
      console.error('Error checking daily signal limit:', error);
      return true;
    }
  }

  private async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingCount, error: fetchError } = await this.supabase
        .from('daily_signal_counts')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') return;

      if (existingCount) {
        await this.supabase
          .from('daily_signal_counts')
          .update({ 
            notification_count: existingCount.notification_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCount.id);
      } else {
        await this.supabase
          .from('daily_signal_counts')
          .insert({
            strategy_id: strategyId,
            user_id: userId,
            signal_date: today,
            notification_count: 1
          });
      }
    } catch (error) {
      console.error('Error incrementing daily signal count:', error);
    }
  }

  async sendNotifications(signal: any, strategy: Strategy): Promise<void> {
    console.log(`[Notifications] Processing notifications for signal ${signal.id}`);
    
    try {
      const isPro = await this.checkUserProStatus(strategy.user_id);
      if (!isPro) {
        console.log(`[Notifications] User is not Pro - skipping external notifications`);
        return;
      }

      const withinLimit = await this.checkDailySignalLimit(strategy.id, strategy.user_id);
      if (!withinLimit) {
        console.log(`[Notifications] Daily signal limit reached - skipping notifications`);
        return;
      }

      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', strategy.user_id)
        .single();

      if (!settings) {
        console.log('[Notifications] No notification settings found');
        return;
      }

      const signalType = signal.signal_type;
      const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
      const shouldSendExit = signalType === 'exit' && settings.exit_signals;
      
      if (!shouldSendEntry && !shouldSendExit) {
        console.log(`[Notifications] Signal type ${signalType} not enabled`);
        return;
      }

      const notifications = [];

      // Send Discord notification
      if (settings.discord_enabled && settings.discord_webhook_url) {
        try {
          const discordResult = await this.supabase.functions.invoke('send-discord-notification', {
            body: {
              webhookUrl: settings.discord_webhook_url,
              signalData: signal.signal_data,
              signalType: signalType
            }
          });
          
          if (!discordResult.error) {
            notifications.push('discord');
          }
        } catch (error) {
          console.error('Discord notification error:', error);
        }
      }

      // Send Telegram notification
      if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
        try {
          const telegramResult = await this.supabase.functions.invoke('send-telegram-notification', {
            body: {
              botToken: settings.telegram_bot_token,
              chatId: settings.telegram_chat_id,
              signalData: signal.signal_data,
              signalType: signalType
            }
          });
          
          if (!telegramResult.error) {
            notifications.push('telegram');
          }
        } catch (error) {
          console.error('Telegram notification error:', error);
        }
      }

      // Send Email notification
      if (settings.email_enabled) {
        try {
          const { data: user } = await this.supabase.auth.admin.getUserById(strategy.user_id);
          if (user.user?.email) {
            const emailResult = await this.supabase.functions.invoke('send-email-notification', {
              body: {
                userEmail: user.user.email,
                signalData: signal.signal_data,
                signalType: signalType
              }
            });
            
            if (!emailResult.error) {
              notifications.push('email');
            }
          }
        } catch (error) {
          console.error('Email notification error:', error);
        }
      }

      if (notifications.length > 0) {
        await this.incrementDailySignalCount(strategy.id, strategy.user_id);
      }

      console.log(`[Notifications] Sent via: ${notifications.join(', ')}`);

    } catch (error) {
      console.error('[Notifications] Error in sendNotifications:', error);
    }
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      throw new Error('FMP API key not found');
    }

    console.log('🚀 Starting signal monitoring process...');

    // Check market hours
    if (!MarketHoursChecker.isMarketOpen()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Market is closed',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        *,
        rule_groups (
          *,
          trading_rules (*)
        )
      `)
      .eq('is_active', true);

    if (strategiesError) {
      throw strategiesError;
    }

    console.log(`📋 Found ${strategies?.length || 0} active strategies`);

    const processedStrategies = [];
    const errors = [];
    
    // Initialize services
    const marketDataService = new MarketDataService(fmpApiKey);
    const strategyEvaluator = new StrategyEvaluator();
    const notificationService = new NotificationService(supabase);

    for (const strategy of strategies || []) {
      try {
        console.log(`\n🎯 Processing strategy: ${strategy.name}`);
        
        if (!strategy.target_asset) {
          console.log(`⚠️ Skipping strategy ${strategy.name} - no target asset`);
          continue;
        }

        if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
          console.log(`⚠️ Skipping strategy ${strategy.name} - no rule groups`);
          continue;
        }

        // Fetch market data
        const marketData = await marketDataService.fetchMarketData(
          strategy.target_asset, 
          strategy.timeframe, 
          100
        );

        console.log(`📈 Retrieved ${marketData.length} data points for ${strategy.target_asset}`);

        // Calculate indicators
        await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
        
        // Evaluate strategy
        const evaluation = strategyEvaluator.evaluateStrategy(strategy);

        if (evaluation.entrySignal || evaluation.exitSignal) {
          console.log(`🚨 SIGNAL DETECTED for strategy ${strategy.name}!`);
          
          const signalType = evaluation.entrySignal ? 'entry' : 'exit';
          const signalData = {
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            asset: strategy.target_asset,
            timeframe: strategy.timeframe,
            signal_type: signalType,
            timestamp: new Date().toISOString(),
            current_price: marketData[0].close
          };

          // Create signal in database
          const { data: signal, error: signalError } = await supabase
            .from('trading_signals')
            .insert({
              strategy_id: strategy.id,
              signal_type: signalType,
              signal_data: signalData,
              processed: false
            })
            .select()
            .single();

          if (signalError) {
            throw signalError;
          }

          console.log(`✅ Signal ${signal.id} created successfully`);
          
          // Send notifications
          await notificationService.sendNotifications(signal, strategy);
          
          processedStrategies.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            signal_type: signalType,
            signal_id: signal.id
          });
        } else {
          console.log(`❌ No signals generated for strategy ${strategy.name}`);
        }

      } catch (error) {
        console.error(`❌ Error processing strategy ${strategy.name}:`, error);
        errors.push({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          error: error.message
        });
      }
    }

    const response = {
      success: true,
      message: `Processed ${strategies?.length || 0} strategies`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    console.log('\n🏁 Signal monitoring completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in monitor-trading-signals:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
