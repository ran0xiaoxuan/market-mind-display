
-- Create a function to safely unschedule cron jobs
CREATE OR REPLACE FUNCTION safe_unschedule_cron_job(job_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    BEGIN
        PERFORM cron.unschedule(job_name);
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore errors if job doesn't exist
            NULL;
    END;
END;
$$;

-- Remove all existing cron jobs safely
SELECT safe_unschedule_cron_job('monitor-trading-signals-1min');
SELECT safe_unschedule_cron_job('monitor-trading-signals-1m');
SELECT safe_unschedule_cron_job('monitor-trading-signals-5m');
SELECT safe_unschedule_cron_job('monitor-trading-signals-15m');
SELECT safe_unschedule_cron_job('monitor-trading-signals-30m');
SELECT safe_unschedule_cron_job('monitor-trading-signals-1h');
SELECT safe_unschedule_cron_job('monitor-trading-signals-4h');
SELECT safe_unschedule_cron_job('monitor-trading-signals-daily');
SELECT safe_unschedule_cron_job('monitor-trading-signals-weekly');
SELECT safe_unschedule_cron_job('monitor-trading-signals-monthly');

-- Market hours: 9:30 AM - 4:00 PM ET
-- EST (Winter): UTC-5, so market hours are 14:30-21:00 UTC
-- EDT (Summer): UTC-4, so market hours are 13:30-20:00 UTC

-- WINTER TIME SCHEDULES (November - March, EST = UTC-5)
-- Market opens at 9:30 AM EST = 14:30 UTC

-- 1-minute strategies (every minute during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-1m-winter',
  '30-59 14 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1m", "timeframes": ["1m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-1m-winter-full',
  '* 15-20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1m", "timeframes": ["1m"]}'::jsonb
    ) as request_id;
  $$
);

-- 5-minute strategies (every 5 minutes during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-5m-winter',
  '30,35,40,45,50,55 14 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "5m", "timeframes": ["5m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-5m-winter-full',
  '*/5 15-20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "5m", "timeframes": ["5m"]}'::jsonb
    ) as request_id;
  $$
);

-- 15-minute strategies (every 15 minutes during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-15m-winter',
  '30,45 14 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "15m", "timeframes": ["15m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-15m-winter-full',
  '0,15,30,45 15-20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "15m", "timeframes": ["15m"]}'::jsonb
    ) as request_id;
  $$
);

-- 30-minute strategies (every 30 minutes during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-30m-winter',
  '30 14 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "30m", "timeframes": ["30m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-30m-winter-full',
  '0,30 15-20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "30m", "timeframes": ["30m"]}'::jsonb
    ) as request_id;
  $$
);

-- 1-hour strategies (every hour during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-1h-winter',
  '0 15-20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1h", "timeframes": ["1h"]}'::jsonb
    ) as request_id;
  $$
);

-- 4-hour strategies (every 4 hours during market hours in winter)
SELECT cron.schedule(
  'monitor-signals-4h-winter',
  '0 16,20 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "4h", "timeframes": ["4h"]}'::jsonb
    ) as request_id;
  $$
);

-- SUMMER TIME SCHEDULES (April - October, EDT = UTC-4)
-- Market opens at 9:30 AM EDT = 13:30 UTC

-- 1-minute strategies (every minute during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-1m-summer',
  '30-59 13 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1m", "timeframes": ["1m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-1m-summer-full',
  '* 14-19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1m", "timeframes": ["1m"]}'::jsonb
    ) as request_id;
  $$
);

-- 5-minute strategies (every 5 minutes during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-5m-summer',
  '30,35,40,45,50,55 13 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "5m", "timeframes": ["5m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-5m-summer-full',
  '*/5 14-19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "5m", "timeframes": ["5m"]}'::jsonb
    ) as request_id;
  $$
);

-- 15-minute strategies (every 15 minutes during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-15m-summer',
  '30,45 13 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "15m", "timeframes": ["15m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-15m-summer-full',
  '0,15,30,45 14-19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "15m", "timeframes": ["15m"]}'::jsonb
    ) as request_id;
  $$
);

-- 30-minute strategies (every 30 minutes during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-30m-summer',
  '30 13 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "30m", "timeframes": ["30m"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-30m-summer-full',
  '0,30 14-19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "30m", "timeframes": ["30m"]}'::jsonb
    ) as request_id;
  $$
);

-- 1-hour strategies (every hour during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-1h-summer',
  '0 14-19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "1h", "timeframes": ["1h"]}'::jsonb
    ) as request_id;
  $$
);

-- 4-hour strategies (every 4 hours during market hours in summer)
SELECT cron.schedule(
  'monitor-signals-4h-summer',
  '0 15,19 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "4h", "timeframes": ["4h"]}'::jsonb
    ) as request_id;
  $$
);

-- Daily strategies - run once at market open
SELECT cron.schedule(
  'monitor-signals-daily-winter',
  '30 14 * 11,12,1,2,3 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "daily", "timeframes": ["Daily"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-daily-summer',
  '30 13 * 4-10 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "daily", "timeframes": ["Daily"]}'::jsonb
    ) as request_id;
  $$
);

-- Weekly strategies - run once per week at market open on Monday
SELECT cron.schedule(
  'monitor-signals-weekly-winter',
  '30 14 * 11,12,1,2,3 1',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "weekly", "timeframes": ["Weekly"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-weekly-summer',
  '30 13 * 4-10 1',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "weekly", "timeframes": ["Weekly"]}'::jsonb
    ) as request_id;
  $$
);

-- Monthly strategies - run once per month on first trading day at market open
SELECT cron.schedule(
  'monitor-signals-monthly-winter',
  '30 14 1-7 11,12,1,2,3 1',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "monthly", "timeframes": ["Monthly"]}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'monitor-signals-monthly-summer',
  '30 13 1-7 4-10 1',
  $$
  SELECT
    net.http_post(
        url:='https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/monitor-trading-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0"}'::jsonb,
        body:='{"source": "cron_job", "frequency": "monthly", "timeframes": ["Monthly"]}'::jsonb
    ) as request_id;
  $$
);

-- Clean up the helper function
DROP FUNCTION IF EXISTS safe_unschedule_cron_job(text);
