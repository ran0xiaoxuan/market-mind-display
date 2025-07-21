
-- Drop existing cron jobs and create ultra-fast optimized schedule
SELECT cron.unschedule('optimized-signal-monitor');
SELECT cron.unschedule('signal-performance-monitor');

-- Create ultra-fast signal monitoring that runs every 30 seconds during market hours
SELECT cron.schedule(
  'ultra-fast-signal-monitor',
  '*/30 * * * * *', -- Every 30 seconds for ultra-fast response
  $$
  SELECT
    net.http_post(
      url := 'https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
      body := json_build_object(
        'source', 'ultra_fast_cron',
        'timestamp', now()::text,
        'optimized', true,
        'ultra_fast', true,
        'parallel_processing', true,
        'cache_enabled', true,
        'target_time', '30_seconds'
      )::jsonb
    ) as request_id;
  $$
);

-- Create performance monitoring and cache management job every 2 minutes
SELECT cron.schedule(
  'performance-cache-manager',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-performance',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
      body := json_build_object(
        'source', 'performance_manager_cron',
        'timestamp', now()::text,
        'cleanup_cache', true,
        'monitor_performance', true,
        'optimize_scheduling', true
      )::jsonb
    ) as request_id;
  $$
);

-- Create warm-up job that runs 5 minutes before market open
SELECT cron.schedule(
  'market-warmup',
  '25 13 * * 1-5', -- 9:25 AM EST (5 minutes before market open)
  $$
  SELECT
    net.http_post(
      url := 'https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
      body := json_build_object(
        'source', 'market_warmup_cron',
        'timestamp', now()::text,
        'warmup_mode', true,
        'cache_preload', true
      )::jsonb
    ) as request_id;
  $$
);
