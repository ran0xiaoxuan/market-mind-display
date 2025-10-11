-- Alpaca Integration - Live Trading Support
-- This migration creates tables for storing Alpaca API configurations and trade execution history

-- Table: alpaca_configurations
-- Stores encrypted Alpaca API credentials for PRO users
CREATE TABLE IF NOT EXISTS public.alpaca_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Credentials (encrypted)
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  
  -- Configuration
  is_paper_trading BOOLEAN NOT NULL DEFAULT true,
  base_url TEXT NOT NULL DEFAULT 'https://paper-api.alpaca.markets',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- Table: alpaca_trade_executions
-- Records all trades executed via Alpaca
CREATE TABLE IF NOT EXISTS public.alpaca_trade_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  
  -- Alpaca Order Info
  alpaca_order_id TEXT,
  alpaca_client_order_id TEXT,
  
  -- Trade Details
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  time_in_force TEXT NOT NULL DEFAULT 'day',
  
  -- Quantity and Price
  quantity DECIMAL(20, 8) NOT NULL,
  limit_price DECIMAL(20, 8),
  stop_price DECIMAL(20, 8),
  filled_quantity DECIMAL(20, 8),
  filled_avg_price DECIMAL(20, 8),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'filled', 'partially_filled', 'cancelled', 'failed', 'rejected')),
  status_message TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_alpaca_configurations_user_id ON public.alpaca_configurations(user_id);
CREATE INDEX idx_alpaca_configurations_is_active ON public.alpaca_configurations(is_active);

CREATE INDEX idx_alpaca_trade_executions_user_id ON public.alpaca_trade_executions(user_id);
CREATE INDEX idx_alpaca_trade_executions_strategy_id ON public.alpaca_trade_executions(strategy_id);
CREATE INDEX idx_alpaca_trade_executions_signal_id ON public.alpaca_trade_executions(signal_id);
CREATE INDEX idx_alpaca_trade_executions_status ON public.alpaca_trade_executions(status);
CREATE INDEX idx_alpaca_trade_executions_created_at ON public.alpaca_trade_executions(created_at DESC);
CREATE INDEX idx_alpaca_trade_executions_alpaca_order_id ON public.alpaca_trade_executions(alpaca_order_id);

-- Enable Row Level Security
ALTER TABLE public.alpaca_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alpaca_trade_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alpaca_configurations
-- Users can only view and manage their own configurations
CREATE POLICY "Users can view their own Alpaca config"
ON public.alpaca_configurations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Alpaca config"
ON public.alpaca_configurations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Alpaca config"
ON public.alpaca_configurations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Alpaca config"
ON public.alpaca_configurations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to Alpaca configs"
ON public.alpaca_configurations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policies for alpaca_trade_executions
-- Users can view their own trade executions
CREATE POLICY "Users can view their own trade executions"
ON public.alpaca_trade_executions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert/update trade executions
CREATE POLICY "Service role can insert trade executions"
ON public.alpaca_trade_executions
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update trade executions"
ON public.alpaca_trade_executions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alpaca_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_alpaca_configurations_updated_at
  BEFORE UPDATE ON public.alpaca_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_alpaca_updated_at();

CREATE TRIGGER trigger_alpaca_trade_executions_updated_at
  BEFORE UPDATE ON public.alpaca_trade_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_alpaca_updated_at();

-- Function: Check if user is PRO (required for Alpaca integration)
CREATE OR REPLACE FUNCTION check_user_is_pro(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN user_tier IN ('pro', 'premium');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON public.alpaca_configurations TO authenticated, service_role;
GRANT ALL ON public.alpaca_trade_executions TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_user_is_pro(UUID) TO authenticated, service_role;

-- Comments
COMMENT ON TABLE public.alpaca_configurations IS 'Stores Alpaca API credentials for PRO users to enable live trading';
COMMENT ON TABLE public.alpaca_trade_executions IS 'Records all trades executed via Alpaca integration';
COMMENT ON COLUMN public.alpaca_configurations.api_key IS 'Encrypted Alpaca API key';
COMMENT ON COLUMN public.alpaca_configurations.api_secret IS 'Encrypted Alpaca API secret';
COMMENT ON COLUMN public.alpaca_configurations.is_paper_trading IS 'Whether using paper trading (test) or live trading';
COMMENT ON FUNCTION check_user_is_pro IS 'Checks if a user has PRO or Premium subscription';

