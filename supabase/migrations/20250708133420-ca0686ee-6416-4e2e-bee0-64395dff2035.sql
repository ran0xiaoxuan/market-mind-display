
-- Create a separate table for test signals
CREATE TABLE public.test_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('entry', 'exit')),
  signal_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.test_signals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test signals
CREATE POLICY "Users can create test signals for their strategies" 
  ON public.test_signals 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM strategies 
    WHERE id = test_signals.strategy_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view test signals for their strategies" 
  ON public.test_signals 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM strategies 
    WHERE id = test_signals.strategy_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update test signals for their strategies" 
  ON public.test_signals 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM strategies 
    WHERE id = test_signals.strategy_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete test signals for their strategies" 
  ON public.test_signals 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM strategies 
    WHERE id = test_signals.strategy_id 
    AND user_id = auth.uid()
  ));

-- Add foreign key constraint
ALTER TABLE public.test_signals 
ADD CONSTRAINT test_signals_strategy_id_fkey 
FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_test_signals_strategy_id ON public.test_signals(strategy_id);
CREATE INDEX idx_test_signals_created_at ON public.test_signals(created_at DESC);
