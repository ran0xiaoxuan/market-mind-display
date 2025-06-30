
-- Step 1: Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Note: This migration file is now replaced by timeframe-specific cron jobs
-- See migration 20250630144000-timeframe-specific-cron-jobs.sql for the new implementation

-- The previous single cron job approach has been replaced with:
-- - Separate cron jobs for each timeframe (1m, 5m, 15m, 30m, 1h, 4h, Daily, Weekly, Monthly)
-- - Market hours awareness (only runs during market open hours)
-- - Daylight saving time support (separate schedules for EST/EDT)
-- - Efficient processing (only strategies with matching timeframes are processed)
