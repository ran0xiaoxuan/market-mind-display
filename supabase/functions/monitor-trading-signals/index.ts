
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Advanced caching with multiple TTL levels
const marketDataCache = new Map<string, { 
  data: any; 
  timestamp: number; 
  ttl: number;
}>();

const indicatorCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Cache configurations for different data types
const CACHE_CONFIG = {
  CURRENT_PRICE: 15000, // 15 seconds for current prices
  HISTORICAL_DATA: 30000, // 30 seconds for historical data
  INDICATORS: 45000, // 45 seconds for calculated indicators
  STRATEGY_RULES: 60000, // 1 minute for strategy rule results
};

// Connection pooling simulation
let connectionPool: any[] = [];
const MAX_CONNECTIONS = 10;

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

// Enhanced caching utilities
class OptimizedCacheManager {
  static get(key: string, cacheType: 'market' | 'indicator' = 'market'): any | null {
    const cache = cacheType === 'market' ? marketDataCache : indicatorCache;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    if (cached) {
      cache.delete(key); // Remove expired entries
    }
    
    return null;
  }

  static set(key: string, data: any, ttl: number, cacheType: 'market' | 'indicator' = 'market'): void {
    const cache = cacheType === 'market' ? marketDataCache : indicatorCache;
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of marketDataCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        marketDataCache.delete(key);
      }
    }
    
    for (const [key, value] of indicatorCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        indicatorCache.delete(key);
      }
    }
  }
}

// Optimized market data service with batching
class HighPerformanceMarketDataService {
  private fmpApiKey: string;
  private batchQueue: Map<string, Promise<any>> = new Map();

  constructor(fmpApiKey: string) {
    this.fmpApiKey = fmpApiKey;
  }

  // Batch multiple symbol requests into single API calls
  async batchFetchCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const uncachedSymbols: string[] = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = OptimizedCacheManager.get(`price_${symbol}`, 'market');
      if (cached) {
        results.set(symbol, cached);
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Batch fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const symbolsQuery = uncachedSymbols.join(',');
        const cacheKey = `batch_prices_${symbolsQuery}`;
        
        // Check if this batch request is already in progress
        if (!this.batchQueue.has(cacheKey)) {
          const batchPromise = this.executeBatchPriceRequest(symbolsQuery);
          this.batchQueue.set(cacheKey, batchPromise);
          
          // Clean up completed requests
          setTimeout(() => this.batchQueue.delete(cacheKey), 5000);
        }

        const batchData = await this.batchQueue.get(cacheKey);
        
        if (Array.isArray(batchData)) {
          batchData.forEach((quote: any) => {
            if (quote.symbol && quote.price) {
              const price = parseFloat(quote.price);
              results.set(quote.symbol, price);
              OptimizedCacheManager.set(`price_${quote.symbol}`, price, CACHE_CONFIG.CURRENT_PRICE, 'market');
            }
          });
        }
      } catch (error) {
        console.error('[BatchPrices] Error fetching batch prices:', error);
      }
    }

    return results;
  }

  private async executeBatchPriceRequest(symbolsQuery: string): Promise<any> {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbolsQuery}?apikey=${this.fmpApiKey}`
    );

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    return await response.json();
  }

  async fetchOptimizedMarketData(symbol: string, timeframe: string, limit: number = 100): Promise<MarketData[]> {
    const cacheKey = `data_${symbol}_${timeframe}_${limit}`;
    const cached = OptimizedCacheManager.get(cacheKey, 'market');
    
    if (cached) {
      return cached;
    }

    const fmpInterval = this.mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${this.fmpApiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${this.fmpApiKey}`;
    }

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

    // Cache the result
    OptimizedCacheManager.set(cacheKey, marketData, CACHE_CONFIG.HISTORICAL_DATA, 'market');
    
    return marketData;
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
}

// Enhanced technical indicators with caching
class OptimizedTechnicalIndicators {
  static calculateWithCache(indicatorType: string, params: any, marketData: MarketData[]): any {
    const cacheKey = `${indicatorType}_${JSON.stringify(params)}_${marketData.length}_${marketData[0]?.date}`;
    const cached = OptimizedCacheManager.get(cacheKey, 'indicator');
    
    if (cached !== null) {
      return cached;
    }

    let result: any;
    
    switch (indicatorType.toLowerCase()) {
      case 'sma':
        result = this.calculateSMA(marketData, params.period || 14, params.source || 'close');
        break;
      case 'ema':
        result = this.calculateEMA(marketData, params.period || 14, params.source || 'close');
        break;
      case 'rsi':
        result = this.calculateRSI(marketData, params.period || 14, params.source || 'close');
        break;
      case 'macd':
        result = this.calculateMACD(marketData, params.fast || 12, params.slow || 26, params.signal || 9, params.source || 'close');
        break;
      default:
        result = 0;
    }

    OptimizedCacheManager.set(cacheKey, result, CACHE_CONFIG.INDICATORS, 'indicator');
    return result;
  }

  private static calculateSMA(data: MarketData[], period: number, source: string): number {
    const prices = this.extractPrices(data, source);
    if (prices.length < period) return 0;
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private static calculateEMA(data: MarketData[], period: number, source: string): number {
    const prices = this.extractPrices(data, source);
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(data, period, source);
    
    for (let i = period; i < Math.min(prices.length, period * 2); i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private static calculateRSI(data: MarketData[], period: number, source: string): number {
    const prices = this.extractPrices(data, source);
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

  private static calculateMACD(data: MarketData[], fastPeriod: number, slowPeriod: number, signalPeriod: number, source: string): { line: number, signal: number, histogram: number } {
    const prices = this.extractPrices(data, source);
    if (prices.length < slowPeriod) return { line: 0, signal: 0, histogram: 0 };
    
    const fastEMA = this.calculateEMA(data, fastPeriod, source);
    const slowEMA = this.calculateEMA(data, slowPeriod, source);
    const macdLine = fastEMA - slowEMA;
    
    const signalLine = macdLine * 0.9; // Simplified
    const histogram = macdLine - signalLine;
    
    return { line: macdLine, signal: signalLine, histogram };
  }

  private static extractPrices(data: MarketData[], source: string): number[] {
    switch (source?.toLowerCase()) {
      case 'open': return data.map(d => d.open);
      case 'high': return data.map(d => d.high);
      case 'low': return data.map(d => d.low);
      case 'close':
      default: return data.map(d => d.close);
      case 'hl2': return data.map(d => (d.high + d.low) / 2);
      case 'hlc3': return data.map(d => (d.high + d.low + d.close) / 3);
      case 'ohlc4': return data.map(d => (d.open + d.high + d.low + d.close) / 4);
    }
  }
}

// Ultra-fast strategy evaluator with parallel processing
class UltraFastStrategyEvaluator {
  private indicators: Map<string, any> = new Map();
  private marketDataService: HighPerformanceMarketDataService;

  constructor(marketDataService: HighPerformanceMarketDataService) {
    this.marketDataService = marketDataService;
  }

  async evaluateStrategiesInParallel(strategies: Strategy[]): Promise<Map<string, { signal: boolean; type: string; data: any }>> {
    const results = new Map();
    
    // Group strategies by asset for optimal batching
    const assetGroups = new Map<string, Strategy[]>();
    strategies.forEach(strategy => {
      if (!assetGroups.has(strategy.target_asset)) {
        assetGroups.set(strategy.target_asset, []);
      }
      assetGroups.get(strategy.target_asset)?.push(strategy);
    });

    // Process all asset groups in parallel
    const assetPromises = Array.from(assetGroups.entries()).map(async ([asset, assetStrategies]) => {
      try {
        // Fetch market data once per asset
        const marketData = await this.marketDataService.fetchOptimizedMarketData(
          asset, 
          assetStrategies[0].timeframe, 
          100
        );

        // Process all strategies for this asset in parallel
        const strategyPromises = assetStrategies.map(async (strategy) => {
          try {
            const result = await this.evaluateSingleStrategy(strategy, marketData);
            return { strategyId: strategy.id, result };
          } catch (error) {
            console.error(`Error evaluating strategy ${strategy.id}:`, error);
            return { strategyId: strategy.id, result: null };
          }
        });

        const strategyResults = await Promise.all(strategyPromises);
        return { asset, results: strategyResults };
      } catch (error) {
        console.error(`Error processing asset ${asset}:`, error);
        return { asset, results: [] };
      }
    });

    const allResults = await Promise.all(assetPromises);
    
    // Flatten results
    allResults.forEach(({ results: assetResults }) => {
      assetResults.forEach(({ strategyId, result }) => {
        if (result) {
          results.set(strategyId, result);
        }
      });
    });

    return results;
  }

  private async evaluateSingleStrategy(strategy: Strategy, marketData: MarketData[]): Promise<{ signal: boolean; type: string; data: any } | null> {
    await this.calculateIndicatorsForStrategy(strategy, marketData);
    
    const entryGroups = strategy.rule_groups.filter(g => g.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(g => g.rule_type === 'exit');

    if (entryGroups.length === 0) {
      return null;
    }

    const entryResults = entryGroups.map(group => this.evaluateRuleGroup(group));
    const entrySignal = entryResults.some(result => result);

    if (!entrySignal) {
      return null;
    }

    let exitSignal = false;
    if (exitGroups.length > 0) {
      const exitResults = exitGroups.map(group => this.evaluateRuleGroup(group));
      exitSignal = exitResults.some(result => result);
    }

    const signalType = exitSignal ? 'exit' : 'entry';

    return {
      signal: true,
      type: signalType,
      data: {
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        asset: strategy.target_asset,
        timeframe: strategy.timeframe,
        signal_type: signalType,
        timestamp: new Date().toISOString(),
        current_price: marketData[0].close,
        processing_mode: 'ultra_fast_parallel'
      }
    };
  }

  private async calculateIndicatorsForStrategy(strategy: Strategy, marketData: MarketData[]): Promise<void> {
    this.indicators.clear();
    
    // Store current prices
    this.indicators.set('PRICE_close', marketData[0].close);
    this.indicators.set('PRICE_open', marketData[0].open);
    this.indicators.set('PRICE_high', marketData[0].high);
    this.indicators.set('PRICE_low', marketData[0].low);
    
    // Extract unique indicators needed for this strategy
    const indicatorConfigs = this.extractIndicatorConfigs(strategy);
    
    // Calculate all indicators in parallel
    const indicatorPromises = Array.from(indicatorConfigs.entries()).map(async ([configKey, params]) => {
      const indicatorName = configKey.split('_')[0];
      
      try {
        const value = OptimizedTechnicalIndicators.calculateWithCache(indicatorName, params, marketData);
        this.indicators.set(configKey, value);
        return { configKey, value };
      } catch (error) {
        console.error(`Error calculating ${indicatorName}:`, error);
        this.indicators.set(configKey, 0);
        return { configKey, value: 0 };
      }
    });

    await Promise.all(indicatorPromises);
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

  private evaluateRuleGroup(group: RuleGroup): boolean {
    if (!group.trading_rules || group.trading_rules.length === 0) {
      return false;
    }

    const results = group.trading_rules.map(rule => {
      const leftValue = this.getIndicatorValue(rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type, rule.left_value);
      const rightValue = this.getIndicatorValue(rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type, rule.right_value);
      
      return this.evaluateCondition(rule.condition, leftValue, rightValue);
    });

    if (group.logic === 'OR') {
      const requiredConditions = group.required_conditions || 1;
      return results.filter(Boolean).length >= requiredConditions;
    } else {
      return results.every(Boolean);
    }
  }

  private getIndicatorValue(type: string, indicator?: string, params?: Record<string, any>, valueType?: string, value?: string): number {
    if (type === 'PRICE') {
      return this.indicators.get(`PRICE_${indicator}`) || 0;
    }
    
    if (type === 'VALUE') {
      return parseFloat(value || '0');
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
}

// Market hours checker with caching
class OptimizedMarketHoursChecker {
  private static lastCheck: { isOpen: boolean; timestamp: number } | null = null;
  private static CACHE_TTL = 60000; // 1 minute cache

  static isMarketOpen(): boolean {
    const now = Date.now();
    
    if (this.lastCheck && (now - this.lastCheck.timestamp) < this.CACHE_TTL) {
      return this.lastCheck.isOpen;
    }

    try {
      const currentTime = new Date();
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
      
      const parts = formatter.formatToParts(currentTime);
      const partsObj = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as any);
      
      const dayName = partsObj.weekday;
      const hour = parseInt(partsObj.hour);
      const minute = parseInt(partsObj.minute);
      
      const isWeekday = !['Saturday', 'Sunday'].includes(dayName);
      
      if (!isWeekday) {
        this.lastCheck = { isOpen: false, timestamp: now };
        return false;
      }
      
      const currentMinutes = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
      this.lastCheck = { isOpen, timestamp: now };
      
      return isOpen;
    } catch (error) {
      console.error('[MarketHours] Error checking market hours:', error);
      return false;
    }
  }
}

// Optimized notification service with queue management
class OptimizedNotificationService {
  private supabase: any;
  private notificationQueue: Array<{ signal: any; strategy: Strategy }> = [];
  private isProcessingQueue = false;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async queueNotification(signal: any, strategy: Strategy): Promise<void> {
    this.notificationQueue.push({ signal, strategy });
    
    if (!this.isProcessingQueue) {
      this.processNotificationQueue();
    }
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process notifications in batches for better performance
      const batchSize = 5;
      while (this.notificationQueue.length > 0) {
        const batch = this.notificationQueue.splice(0, batchSize);
        
        const promises = batch.map(({ signal, strategy }) => 
          this.sendNotifications(signal, strategy).catch(error => {
            console.error(`Notification error for signal ${signal.id}:`, error);
          })
        );

        await Promise.all(promises);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendNotifications(signal: any, strategy: Strategy): Promise<void> {
    try {
      const isPro = await this.checkUserProStatus(strategy.user_id);
      if (!isPro) return;

      const withinLimit = await this.checkDailySignalLimit(strategy.id, strategy.user_id);
      if (!withinLimit) return;

      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', strategy.user_id)
        .single();

      if (!settings) return;

      const signalType = signal.signal_type;
      const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
      const shouldSendExit = signalType === 'exit' && settings.exit_signals;
      
      if (!shouldSendEntry && !shouldSendExit) return;

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('timezone')
        .eq('id', strategy.user_id)
        .single();

      const enhancedSignalData = {
        ...signal.signal_data,
        signalId: signal.id,
        userId: strategy.user_id,
        strategyName: strategy.name,
        targetAsset: strategy.target_asset,
        timeframe: strategy.timeframe,
        currentPrice: signal.signal_data.current_price,
        userTimezone: profile?.timezone || 'UTC'
      };

      // Send notifications in parallel for speed
      const notificationPromises = [];

      if (settings.discord_enabled && settings.discord_webhook_url) {
        notificationPromises.push(
          this.supabase.functions.invoke('send-discord-notification', {
            body: {
              webhookUrl: settings.discord_webhook_url,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          })
        );
      }

      if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
        notificationPromises.push(
          this.supabase.functions.invoke('send-telegram-notification', {
            body: {
              botToken: settings.telegram_bot_token,
              chatId: settings.telegram_chat_id,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          })
        );
      }

      if (settings.email_enabled) {
        const { data: user } = await this.supabase.auth.admin.getUserById(strategy.user_id);
        if (user.user?.email) {
          notificationPromises.push(
            this.supabase.functions.invoke('send-email-notification', {
              body: {
                userEmail: user.user.email,
                signalData: enhancedSignalData,
                signalType: signalType
              }
            })
          );
        }
      }

      if (notificationPromises.length > 0) {
        await Promise.allSettled(notificationPromises);
        await this.incrementDailySignalCount(strategy.id, strategy.user_id);
      }

    } catch (error) {
      console.error('[OptimizedNotifications] Error:', error);
    }
  }

  private async checkUserProStatus(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier;
      return tier === 'pro' || tier === 'premium';
    } catch (error) {
      return false;
    }
  }

  private async checkDailySignalLimit(strategyId: string, userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: strategy } = await this.supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (!strategy) return false;

      const { data: dailyCount } = await this.supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      const currentCount = dailyCount?.notification_count || 0;
      const dailyLimit = strategy.daily_signal_limit || 5;

      return currentCount < dailyLimit;
    } catch (error) {
      return true;
    }
  }

  private async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingCount } = await this.supabase
        .from('daily_signal_counts')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

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
}

// Main ultra-fast handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const processingStartTime = Date.now();
  console.log(`🚀 ULTRA-FAST signal monitoring started at: ${new Date().toISOString()}`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      throw new Error('FMP API key not found');
    }

    // Parse request body
    const reqBody = await req.json().catch(() => ({}));
    const isOptimized = reqBody?.optimized === true;
    const enableUltraFast = reqBody?.ultra_fast === true;

    // Clean up caches periodically
    OptimizedCacheManager.cleanup();

    // Check market hours with caching
    if (!OptimizedMarketHoursChecker.isMarketOpen()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Market is closed',
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - processingStartTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optimized strategy fetching with minimal data
    const strategiesStart = Date.now();
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id, name, target_asset, timeframe, user_id, daily_signal_limit, is_active,
        rule_groups (
          id, logic, rule_type, required_conditions,
          trading_rules (
            id, left_type, left_indicator, left_parameters, left_value, left_value_type,
            condition, right_type, right_indicator, right_parameters, right_value, right_value_type
          )
        )
      `)
      .eq('is_active', true);

    if (strategiesError) {
      throw strategiesError;
    }

    const strategiesFetchTime = Date.now() - strategiesStart;
    console.log(`📋 Fetched ${strategies?.length || 0} strategies in ${strategiesFetchTime}ms`);

    const processedStrategies = [];
    const errors = [];

    if (strategies && strategies.length > 0) {
      // Initialize optimized services
      const marketDataService = new HighPerformanceMarketDataService(fmpApiKey);
      const strategyEvaluator = new UltraFastStrategyEvaluator(marketDataService);
      const notificationService = new OptimizedNotificationService(supabase);

      // Ultra-fast parallel evaluation
      const evaluationStart = Date.now();
      const evaluationResults = await strategyEvaluator.evaluateStrategiesInParallel(strategies);
      const evaluationTime = Date.now() - evaluationStart;

      console.log(`⚡ Ultra-fast evaluation completed in ${evaluationTime}ms for ${strategies.length} strategies`);

      // Process signals and notifications in parallel
      const signalPromises = Array.from(evaluationResults.entries()).map(async ([strategyId, result]) => {
        if (!result.signal) return null;

        try {
          const strategy = strategies.find(s => s.id === strategyId);
          if (!strategy) return null;

          // Create signal in database
          const { data: signal, error: signalError } = await supabase
            .from('trading_signals')
            .insert({
              strategy_id: strategyId,
              signal_type: result.type,
              signal_data: result.data,
              processed: false
            })
            .select()
            .single();

          if (signalError) {
            throw signalError;
          }

          console.log(`✅ Ultra-fast signal ${signal.id} created for ${strategy.name}`);
          
          // Queue notification (non-blocking)
          notificationService.queueNotification(signal, strategy);
          
          return {
            strategy_id: strategyId,
            strategy_name: strategy.name,
            signal_type: result.type,
            signal_id: signal.id,
            processing_mode: 'ultra_fast_parallel'
          };
        } catch (error) {
          console.error(`❌ Error processing signal for strategy ${strategyId}:`, error);
          errors.push({
            strategy_id: strategyId,
            error: error.message,
            processing_mode: 'ultra_fast'
          });
          return null;
        }
      });

      const signalResults = await Promise.all(signalPromises);
      processedStrategies.push(...signalResults.filter(result => result !== null));
    }

    const totalProcessingTime = Date.now() - processingStartTime;
    const response = {
      success: true,
      message: `Ultra-fast processing completed`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors,
      processing_start_time: new Date(processingStartTime).toISOString(),
      processing_complete_time: new Date().toISOString(),
      processing_mode: 'ultra_fast_parallel',
      optimization_enabled: true,
      performance_metrics: {
        total_time_ms: totalProcessingTime,
        strategies_processed: strategies?.length || 0,
        signals_generated: processedStrategies.length,
        errors_count: errors.length,
        avg_time_per_strategy: strategies?.length > 0 
          ? Math.round(totalProcessingTime / strategies.length)
          : 0,
        cache_stats: {
          market_cache_size: marketDataCache.size,
          indicator_cache_size: indicatorCache.size
        }
      }
    };

    console.log(`🏁 Ultra-fast processing completed in ${totalProcessingTime}ms`);
    console.log(`📊 Performance: ${response.performance_metrics.avg_time_per_strategy}ms per strategy`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const totalTime = Date.now() - processingStartTime;
    console.error('💥 Error in ultra-fast signal monitoring:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        processing_time: totalTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
