
-- Phase 1: Database Schema Updates

-- Add new columns to the strategies table
ALTER TABLE public.strategies 
ADD COLUMN daily_signal_limit integer DEFAULT 5 CHECK (daily_signal_limit >= 1 AND daily_signal_limit <= 10),
ADD COLUMN signal_notifications_enabled boolean DEFAULT false;

-- Create a new table for tracking daily signal counts
CREATE TABLE public.daily_signal_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  signal_date date NOT NULL DEFAULT CURRENT_DATE,
  notification_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, signal_date)
);

-- Add Row Level Security (RLS) to the daily_signal_counts table
ALTER TABLE public.daily_signal_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_signal_counts
CREATE POLICY "Users can view their own daily signal counts" 
  ON public.daily_signal_counts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily signal counts" 
  ON public.daily_signal_counts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily signal counts" 
  ON public.daily_signal_counts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily signal counts" 
  ON public.daily_signal_counts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better query performance
CREATE INDEX idx_daily_signal_counts_strategy_date ON public.daily_signal_counts(strategy_id, signal_date);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_signal_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_signal_counts_updated_at
    BEFORE UPDATE ON public.daily_signal_counts
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_signal_counts_updated_at();
