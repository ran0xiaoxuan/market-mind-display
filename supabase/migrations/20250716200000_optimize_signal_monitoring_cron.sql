
-- Remove all existing timeframe-specific cron jobs and replace with optimized single job
SELECT cron.unschedule('monitor-signals-1m');
SELECT cron.unschedule('monitor-signals-5m'); 
SELECT cron.unschedule('monitor-signals-15m');
SELECT cron.unschedule('monitor-signals-30m');
SELECT cron.unschedule('monitor-signals-1h');
SELECT cron.unschedule('monitor-signals-4h');
SELECT cron.unschedule('monitor-signals-daily');

-- Create a single optimized cron job that runs every minute and handles all timeframes intelligently
SELECT cron.schedule(
  'optimized-signal-monitor',
  '* * * * *', -- Every minute for minimal latency
  $$
  SELECT
    net.http_post(
      url := 'https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
      body := json_build_object(
        'source', 'optimized_cron',
        'timestamp', now()::text,
        'optimized', true,
        'parallel_processing', true,
        'cache_enabled', true
      )::jsonb
    ) as request_id;
  $$
);

-- Create a performance monitoring job that runs every 5 minutes
SELECT cron.schedule(
  'signal-performance-monitor',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-performance',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
      body := json_build_object(
        'source', 'performance_cron',
        'timestamp', now()::text,
        'cleanup_cache', true
      )::jsonb
    ) as request_id;
  $$
);
