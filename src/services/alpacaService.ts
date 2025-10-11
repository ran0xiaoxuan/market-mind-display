// Alpaca Trading Service
// Frontend service to interact with Alpaca integration

import { supabase } from "@/integrations/supabase/client";

export interface AlpacaConfiguration {
  id: string;
  user_id: string;
  api_key: string;
  api_secret: string;
  is_paper_trading: boolean;
  base_url: string;
  is_active: boolean;
  last_verified_at: string | null;
  verification_status: 'pending' | 'verified' | 'failed' | null;
  verification_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlpacaTradeExecution {
  id: string;
  user_id: string;
  strategy_id: string;
  signal_id: string | null;
  alpaca_order_id: string | null;
  alpaca_client_order_id: string | null;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: string;
  quantity: number;
  limit_price: number | null;
  stop_price: number | null;
  filled_quantity: number | null;
  filled_avg_price: number | null;
  status: 'pending' | 'submitted' | 'filled' | 'partially_filled' | 'cancelled' | 'failed' | 'rejected';
  status_message: string | null;
  submitted_at: string | null;
  filled_at: string | null;
  cancelled_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

// Get user's Alpaca configuration
export const getAlpacaConfiguration = async (): Promise<AlpacaConfiguration | null> => {
  const { data, error } = await supabase
    .from('alpaca_configurations')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No configuration found
      return null;
    }
    throw error;
  }

  return data;
};

// Save or update Alpaca configuration
export const saveAlpacaConfiguration = async (config: {
  api_key: string;
  api_secret: string;
  is_paper_trading: boolean;
}): Promise<AlpacaConfiguration> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const base_url = config.is_paper_trading
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';

  // Check if configuration exists
  const existing = await getAlpacaConfiguration();

  if (existing) {
    // Update existing configuration
    const { data, error } = await supabase
      .from('alpaca_configurations')
      .update({
        api_key: config.api_key,
        api_secret: config.api_secret,
        is_paper_trading: config.is_paper_trading,
        base_url,
        verification_status: 'pending',
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new configuration
    const { data, error } = await supabase
      .from('alpaca_configurations')
      .insert({
        user_id: user.id,
        api_key: config.api_key,
        api_secret: config.api_secret,
        is_paper_trading: config.is_paper_trading,
        base_url,
        is_active: false,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Delete Alpaca configuration
export const deleteAlpacaConfiguration = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alpaca_configurations')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};

// Toggle active status
export const toggleAlpacaActive = async (isActive: boolean): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alpaca_configurations')
    .update({ is_active: isActive })
    .eq('user_id', user.id);

  if (error) throw error;
};

// Call Alpaca Edge Function
const callAlpacaFunction = async (action: string, params: any = {}): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('alpaca-execute-trade', {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
};

// Test Alpaca connection
export const testAlpacaConnection = async (): Promise<{
  success: boolean;
  message: string;
  account?: any;
}> => {
  return await callAlpacaFunction('test_connection');
};

// Get Alpaca account info
export const getAlpacaAccount = async (): Promise<any> => {
  return await callAlpacaFunction('get_account');
};

// Place an order via Alpaca
export const placeAlpacaOrder = async (params: {
  strategy_id: string;
  signal_id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type?: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force?: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
}): Promise<{ order: any; execution: AlpacaTradeExecution }> => {
  return await callAlpacaFunction('place_order', params);
};

// Get order status
export const getAlpacaOrder = async (orderId: string): Promise<any> => {
  return await callAlpacaFunction('get_order', { order_id: orderId });
};

// Cancel an order
export const cancelAlpacaOrder = async (orderId: string): Promise<void> => {
  await callAlpacaFunction('cancel_order', { order_id: orderId });
};

// Get all positions
export const getAlpacaPositions = async (): Promise<any[]> => {
  return await callAlpacaFunction('get_positions');
};

// Get specific position
export const getAlpacaPosition = async (symbol: string): Promise<any | null> => {
  return await callAlpacaFunction('get_position', { symbol });
};

// Get trade execution history
export const getTradeExecutions = async (filters?: {
  strategy_id?: string;
  status?: string;
  limit?: number;
}): Promise<AlpacaTradeExecution[]> => {
  let query = supabase
    .from('alpaca_trade_executions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.strategy_id) {
    query = query.eq('strategy_id', filters.strategy_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Get trade execution by ID
export const getTradeExecutionById = async (id: string): Promise<AlpacaTradeExecution | null> => {
  const { data, error } = await supabase
    .from('alpaca_trade_executions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

