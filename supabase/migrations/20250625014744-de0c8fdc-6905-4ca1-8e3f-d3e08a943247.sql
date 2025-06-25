
-- Phase 1: Remove risk management columns from strategies table
ALTER TABLE public.strategies 
DROP COLUMN IF EXISTS stop_loss,
DROP COLUMN IF EXISTS take_profit,
DROP COLUMN IF EXISTS single_buy_volume,
DROP COLUMN IF EXISTS max_buy_volume;

-- Remove risk management alerts from notification_settings table
ALTER TABLE public.notification_settings 
DROP COLUMN IF EXISTS stop_loss_alerts,
DROP COLUMN IF EXISTS take_profit_alerts;
