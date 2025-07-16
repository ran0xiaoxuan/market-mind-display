
-- Create a table to track daily test signal usage
CREATE TABLE public.daily_test_signal_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  signal_date date NOT NULL DEFAULT CURRENT_DATE,
  test_signal_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_date)
);

-- Add Row Level Security (RLS) to the daily_test_signal_counts table
ALTER TABLE public.daily_test_signal_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_test_signal_counts
CREATE POLICY "Users can view their own daily test signal counts" 
  ON public.daily_test_signal_counts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily test signal counts" 
  ON public.daily_test_signal_counts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily test signal counts" 
  ON public.daily_test_signal_counts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily test signal counts" 
  ON public.daily_test_signal_counts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better query performance
CREATE INDEX idx_daily_test_signal_counts_user_date ON public.daily_test_signal_counts(user_id, signal_date);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_test_signal_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_test_signal_counts_updated_at
    BEFORE UPDATE ON public.daily_test_signal_counts
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_test_signal_counts_updated_at();
