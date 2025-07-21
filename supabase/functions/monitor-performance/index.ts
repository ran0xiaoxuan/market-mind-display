
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = new Date().toISOString();
    console.log(`📊 Starting performance monitoring at: ${startTime}`);

    // Analyze recent signal generation performance
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentSignals, error: signalsError } = await supabase
      .from('trading_signals')
      .select('created_at, signal_data, signal_type, strategy_id')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false });

    if (signalsError) {
      console.error('Error fetching recent signals:', signalsError);
    }

    // Analyze processing times
    const processingTimes = recentSignals
      ?.map(signal => {
        const data = signal.signal_data as any;
        return {
          total_time: data?.processing_time || 0,
          strategy_time: data?.strategy_processing_time || 0,
          asset_time: data?.asset_processing_time || 0,
          mode: data?.processing_mode || 'unknown'
        };
      })
      .filter(time => time.total_time > 0) || [];

    const parallelTimes = processingTimes.filter(t => t.mode === 'parallel');
    const sequentialTimes = processingTimes.filter(t => t.mode === 'sequential');

    // Calculate performance metrics
    const performanceMetrics = {
      signals_last_hour: recentSignals?.length || 0,
      avg_processing_time_all: processingTimes.length > 0 
        ? Math.round(processingTimes.reduce((a, b) => a + b.total_time, 0) / processingTimes.length)
        : 0,
      avg_processing_time_parallel: parallelTimes.length > 0
        ? Math.round(parallelTimes.reduce((a, b) => a + b.total_time, 0) / parallelTimes.length)
        : 0,
      avg_processing_time_sequential: sequentialTimes.length > 0
        ? Math.round(sequentialTimes.reduce((a, b) => a + b.total_time, 0) / sequentialTimes.length)
        : 0,
      parallel_usage_percentage: processingTimes.length > 0
        ? Math.round((parallelTimes.length / processingTimes.length) * 100)
        : 0,
      performance_improvement: parallelTimes.length > 0 && sequentialTimes.length > 0
        ? Math.round(((sequentialTimes.reduce((a, b) => a + b.total_time, 0) / sequentialTimes.length) -
                     (parallelTimes.reduce((a, b) => a + b.total_time, 0) / parallelTimes.length)) /
                     (sequentialTimes.reduce((a, b) => a + b.total_time, 0) / sequentialTimes.length) * 100)
        : 0
    };

    // Check for potential bottlenecks
    const bottlenecks = [];
    
    if (performanceMetrics.avg_processing_time_all > 60000) { // > 1 minute
      bottlenecks.push('Average processing time exceeds 1 minute target');
    }
    
    if (performanceMetrics.parallel_usage_percentage < 50) {
      bottlenecks.push('Low parallel processing usage - consider optimization');
    }

    // Get active strategies count
    const { data: activeStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    if (strategiesError) {
      console.error('Error fetching active strategies:', strategiesError);
    }

    // Clean up old performance data (optional)
    const cleanupSince = new Date();
    cleanupSince.setHours(cleanupSince.getHours() - 24); // Keep last 24 hours

    console.log('📈 Performance Analysis Complete:');
    console.log(`- Signals generated last hour: ${performanceMetrics.signals_last_hour}`);
    console.log(`- Average processing time: ${performanceMetrics.avg_processing_time_all}ms`);
    console.log(`- Parallel mode improvement: ${performanceMetrics.performance_improvement}%`);
    console.log(`- Active strategies: ${activeStrategies?.length || 0}`);

    const response = {
      success: true,
      timestamp: startTime,
      metrics: performanceMetrics,
      bottlenecks: bottlenecks,
      active_strategies: activeStrategies?.length || 0,
      recommendations: generateRecommendations(performanceMetrics, bottlenecks),
      system_health: determineSystemHealth(performanceMetrics, bottlenecks)
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in performance monitoring:', error);
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

function generateRecommendations(metrics: any, bottlenecks: string[]): string[] {
  const recommendations = [];

  if (metrics.avg_processing_time_all > 30000) {
    recommendations.push('Consider enabling parallel processing for all strategies');
  }

  if (metrics.parallel_usage_percentage < 75) {
    recommendations.push('Increase parallel processing adoption to improve performance');
  }

  if (metrics.signals_last_hour === 0) {
    recommendations.push('Check if market is open and strategies are properly configured');
  }

  if (bottlenecks.length === 0) {
    recommendations.push('System is performing optimally');
  }

  return recommendations;
}

function determineSystemHealth(metrics: any, bottlenecks: string[]): string {
  if (bottlenecks.length === 0 && metrics.avg_processing_time_all < 30000) {
    return 'excellent';
  } else if (bottlenecks.length <= 1 && metrics.avg_processing_time_all < 60000) {
    return 'good';
  } else if (bottlenecks.length <= 2 && metrics.avg_processing_time_all < 120000) {
    return 'fair';
  } else {
    return 'needs_attention';
  }
}
