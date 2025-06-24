
-- Step 1: Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create cron job to run monitor-trading-signals every minute
SELECT cron.schedule(
  'monitor-trading-signals-1min',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1-minute"}'::jsonb
    ) as request_id;
  $$
);
