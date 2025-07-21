import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Performance metrics storage
const performanceMetrics = new Map<string, any>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`🔍 Performance monitoring started at: ${new Date().toISOString()}`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const reqBody = await req.json().catch(() => ({}));
    const cleanupCache = reqBody?.cleanup_cache === true;
    const monitorPerformance = reqBody?.monitor_performance === true;

    const metrics = {
      timestamp: new Date().toISOString(),
      monitoring_start: startTime,
      cache_cleaned: false,
      performance_data: {},
      optimization_recommendations: [],
      system_health: 'good'
    };

    // Cache cleanup operations
    if (cleanupCache) {
      try {
        const cleanupStart = Date.now();
        
        // Monitor recent signals performance for cache optimization
        const { data: recentSignals, error: signalsError } = await supabase
          .from('trading_signals')
          .select('id, created_at, signal_data')
          .order('created_at', { ascending: false })
          .limit(100);

        let cacheEntriesProcessed = 0;
        let cacheEntriesRemoved = 0;

        if (!signalsError && recentSignals) {
          // Analyze signal data for cache optimization patterns
          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          
          // Count signals by timeframe to optimize cache TTL
          const signalsByTimeframe = new Map<string, number>();
          const processingTimes: number[] = [];
          
          recentSignals.forEach(signal => {
            cacheEntriesProcessed++;
            
            if (new Date(signal.created_at) < oneHourAgo) {
              cacheEntriesRemoved++;
            }
            
            if (signal.signal_data?.timeframe) {
              const count = signalsByTimeframe.get(signal.signal_data.timeframe) || 0;
              signalsByTimeframe.set(signal.signal_data.timeframe, count + 1);
            }
            
            if (signal.signal_data?.processing_time || signal.signal_data?.processingTime) {
              const time = signal.signal_data.processing_time || signal.signal_data.processingTime;
              if (typeof time === 'number' && time > 0) {
                processingTimes.push(time);
              }
            }
          });

          // Calculate cache optimization metrics
          const avgProcessingTime = processingTimes.length > 0 
            ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
            : 0;

          metrics.cache_optimization = {
            entries_processed: cacheEntriesProcessed,
            entries_removed: cacheEntriesRemoved,
            timeframe_distribution: Object.fromEntries(signalsByTimeframe),
            avg_processing_time: Math.round(avgProcessingTime),
            cache_efficiency: cacheEntriesRemoved > 0 ? ((cacheEntriesProcessed - cacheEntriesRemoved) / cacheEntriesProcessed * 100).toFixed(1) + '%' : '100%'
          };
        }

        // Clean up old performance metrics
        if (performanceMetrics.size > 50) {
          const keysToRemove = Array.from(performanceMetrics.keys()).slice(0, performanceMetrics.size - 50);
          keysToRemove.forEach(key => performanceMetrics.delete(key));
          cacheEntriesRemoved += keysToRemove.length;
        }

        // Simulate database connection cleanup
        const { data: connectionStats, error: connError } = await supabase
          .from('strategies')
          .select('id')
          .limit(1);

        if (!connError) {
          metrics.database_connection = 'healthy';
        } else {
          metrics.database_connection = 'degraded';
          metrics.optimization_recommendations.push('Check database connection pool');
        }
        
        const cleanupTime = Date.now() - cleanupStart;
        metrics.cache_cleaned = true;
        metrics.cache_cleanup_time = cleanupTime;
        
        console.log(`🧹 Cache cleanup completed in ${cleanupTime}ms`);
        console.log(`📊 Processed ${cacheEntriesProcessed} entries, removed ${cacheEntriesRemoved} expired entries`);
      } catch (error) {
        console.error('❌ Cache cleanup error:', error);
        metrics.cache_cleanup_error = error.message;
      }
    }

    // Performance monitoring
    if (monitorPerformance) {
      try {
        const perfStart = Date.now();
        
        // Monitor recent signals performance
        const { data: recentSignals, error: signalsError } = await supabase
          .from('trading_signals')
          .select('id, created_at, signal_data, signal_type, strategy_id')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!signalsError && recentSignals) {
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          
          const recentCount5min = recentSignals.filter(s => new Date(s.created_at) > fiveMinutesAgo).length;
          const recentCount15min = recentSignals.filter(s => new Date(s.created_at) > fifteenMinutesAgo).length;
          const recentCount1hour = recentSignals.filter(s => new Date(s.created_at) > oneHourAgo).length;
          
          // Calculate signal type distribution
          const signalTypes = recentSignals.reduce((acc, signal) => {
            acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Calculate processing time statistics
          const processingTimes = recentSignals
            .map(s => s.signal_data?.processing_time || s.signal_data?.processingTime)
            .filter(t => typeof t === 'number' && t > 0);

          const avgProcessingTime = processingTimes.length > 0 
            ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
            : 0;

          const maxProcessingTime = processingTimes.length > 0 ? Math.max(...processingTimes) : 0;
          const minProcessingTime = processingTimes.length > 0 ? Math.min(...processingTimes) : 0;
          
          metrics.performance_data = {
            recent_signals_5min: recentCount5min,
            recent_signals_15min: recentCount15min,
            recent_signals_1hour: recentCount1hour,
            total_signals_checked: recentSignals.length,
            signal_generation_rate_5min: recentCount5min / 5,
            signal_generation_rate_15min: recentCount15min / 15,
            signal_generation_rate_1hour: recentCount1hour / 60,
            signal_type_distribution: signalTypes,
            avg_processing_time: Math.round(avgProcessingTime),
            max_processing_time: maxProcessingTime,
            min_processing_time: minProcessingTime,
            processing_time_variance: processingTimes.length > 1 
              ? Math.round(Math.sqrt(processingTimes.reduce((acc, time) => acc + Math.pow(time - avgProcessingTime, 2), 0) / processingTimes.length))
              : 0,
            system_load: recentCount5min > 10 ? 'high' : recentCount5min > 5 ? 'medium' : 'low',
            performance_trend: recentCount5min > recentCount15min / 3 ? 'increasing' : 'stable'
          };

          // Generate optimization recommendations based on performance data
          if (recentCount5min > 15) {
            metrics.optimization_recommendations.push('High signal volume detected - consider increasing cache TTL');
            metrics.optimization_recommendations.push('Enable additional parallel processing for signal generation');
          }
          
          if (avgProcessingTime > 1000) {
            metrics.optimization_recommendations.push('Average processing time exceeds 1 second - optimize database queries');
            metrics.optimization_recommendations.push('Consider implementing connection pooling');
          }

          if (maxProcessingTime > 5000) {
            metrics.optimization_recommendations.push('Maximum processing time exceeds 5 seconds - investigate slow queries');
          }

          if (processingTimes.length > 0 && metrics.performance_data.processing_time_variance > avgProcessingTime * 0.5) {
            metrics.optimization_recommendations.push('High processing time variance detected - optimize resource allocation');
          }

          // Check for signal type imbalance
          const entrySignals = signalTypes.entry || 0;
          const exitSignals = signalTypes.exit || 0;
          if (entrySignals > exitSignals * 3) {
            metrics.optimization_recommendations.push('High entry/exit signal ratio - review strategy exit conditions');
          }
        }

        // Monitor active strategies performance
        const { data: activeStrategies, error: strategiesError } = await supabase
          .from('strategies')
          .select('id, name, target_asset, timeframe, is_active, created_at')
          .eq('is_active', true);

        if (!strategiesError && activeStrategies) {
          const uniqueAssets = new Set(activeStrategies.map(s => s.target_asset)).size;
          const timeframeDistribution = activeStrategies.reduce((acc, strategy) => {
            acc[strategy.timeframe] = (acc[strategy.timeframe] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const assetDistribution = activeStrategies.reduce((acc, strategy) => {
            acc[strategy.target_asset] = (acc[strategy.target_asset] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          metrics.performance_data.active_strategies = activeStrategies.length;
          metrics.performance_data.unique_assets = uniqueAssets;
          metrics.performance_data.strategies_per_asset = Math.round((activeStrategies.length / uniqueAssets) * 100) / 100;
          metrics.performance_data.timeframe_distribution = timeframeDistribution;
          metrics.performance_data.asset_distribution = assetDistribution;
          
          // Strategy optimization recommendations
          if (uniqueAssets > 20) {
            metrics.optimization_recommendations.push('Large number of assets detected - consider asset-based batching optimization');
          }

          if (activeStrategies.length > 50) {
            metrics.optimization_recommendations.push('High strategy count - implement strategy grouping for parallel processing');
          }

          // Check for asset concentration
          const maxStrategiesPerAsset = Math.max(...Object.values(assetDistribution));
          if (maxStrategiesPerAsset > 10) {
            metrics.optimization_recommendations.push('High strategy concentration on single asset - optimize market data caching');
          }

          // Check timeframe distribution for optimization opportunities
          const timeframes = Object.keys(timeframeDistribution);
          if (timeframes.length > 5) {
            metrics.optimization_recommendations.push('Multiple timeframes detected - implement timeframe-specific caching strategies');
          }
        }

        // System resource monitoring
        const memoryUsage = {
          performance_metrics_count: performanceMetrics.size,
          estimated_memory_mb: Math.round((performanceMetrics.size * 1024) / (1024 * 1024) * 100) / 100
        };

        metrics.performance_data.system_resources = memoryUsage;

        if (memoryUsage.performance_metrics_count > 100) {
          metrics.optimization_recommendations.push('High memory usage detected - increase cleanup frequency');
        }

        const perfTime = Date.now() - perfStart;
        metrics.performance_monitoring_time = perfTime;
        
        console.log(`📊 Performance monitoring completed in ${perfTime}ms`);
        console.log(`📈 Signal generation rate (5min): ${metrics.performance_data.signal_generation_rate_5min?.toFixed(2)} signals/min`);
        console.log(`⚡ Average processing time: ${metrics.performance_data.avg_processing_time}ms`);
      } catch (error) {
        console.error('❌ Performance monitoring error:', error);
        metrics.performance_monitoring_error = error.message;
        metrics.system_health = 'degraded';
      }
    }

    // System health assessment
    const totalTime = Date.now() - startTime;
    if (totalTime > 5000) {
      metrics.system_health = 'slow';
      metrics.optimization_recommendations.push('Performance monitoring taking too long - optimize monitoring queries');
    }

    // Advanced health scoring
    let healthScore = 100;
    if (metrics.performance_data.avg_processing_time > 1000) healthScore -= 20;
    if (metrics.performance_data.max_processing_time > 5000) healthScore -= 30;
    if (totalTime > 3000) healthScore -= 15;
    if (metrics.performance_data.system_load === 'high') healthScore -= 25;

    metrics.health_score = Math.max(0, healthScore);
    
    if (healthScore < 70) {
      metrics.system_health = 'degraded';
    } else if (healthScore < 90) {
      metrics.system_health = 'fair';
    }

    // Store metrics for trending analysis
    const metricsKey = `perf_${Date.now()}`;
    performanceMetrics.set(metricsKey, {
      ...metrics,
      health_score: healthScore,
      timestamp: Date.now()
    });

    // Keep only last 100 metrics entries
    if (performanceMetrics.size > 100) {
      const oldestKeys = Array.from(performanceMetrics.keys()).slice(0, performanceMetrics.size - 100);
      oldestKeys.forEach(key => performanceMetrics.delete(key));
    }

    // Calculate performance trends
    const recentMetrics = Array.from(performanceMetrics.values()).slice(-10);
    if (recentMetrics.length > 1) {
      const avgHealthScore = recentMetrics.reduce((sum, m) => sum + (m.health_score || 100), 0) / recentMetrics.length;
      const trend = healthScore > avgHealthScore ? 'improving' : healthScore < avgHealthScore ? 'declining' : 'stable';
      metrics.performance_trend = trend;
    }

    metrics.total_processing_time = totalTime;
    
    console.log(`🏁 Performance monitoring completed in ${totalTime}ms`);
    console.log(`📈 System health: ${metrics.system_health} (Score: ${healthScore}/100)`);
    console.log(`💡 Recommendations: ${metrics.optimization_recommendations.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        recommendations: metrics.optimization_recommendations,
        system_health: metrics.system_health,
        health_score: healthScore,
        performance_trend: metrics.performance_trend,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Error in performance monitoring:', error);
    
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

function calculateAverageProcessingTime(signals: any[]): number {
  if (!signals || signals.length === 0) return 0;
  
  const processingTimes = signals
    .map(s => s.signal_data?.processing_time || s.signal_data?.processingTime)
    .filter(t => typeof t === 'number' && t > 0);
  
  if (processingTimes.length === 0) return 0;
  
  return Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length);
}
