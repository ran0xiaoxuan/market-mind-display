// Alpaca Auto Trade Function
// Automatically executes trades on Alpaca when signals are generated
// This function is called by the monitor-trading-signals function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpaca API client
class AlpacaClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, isPaperTrading: boolean = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = isPaperTrading 
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';
  }

  private getHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async placeOrder(params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    client_order_id?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to place order: ${error}`);
    }

    return await response.json();
  }

  async getPosition(symbol: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/positions/${symbol}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get position: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting position:', error);
      return null;
    }
  }
}

// Process signal and execute trade
async function processSignalForAlpaca(
  supabase: any,
  signal: any,
  strategy: any,
  alpacaConfig: any
): Promise<{ success: boolean; message: string; order?: any }> {
  try {
    const signalType = signal.signal_type;
    const signalData = signal.signal_data || {};
    
    // Extract trade data from signal
    const asset = signalData.asset || strategy.target_asset;
    const currentPrice = signalData.current_price;
    const quantity = signalData.quantity;
    
    if (!asset || !currentPrice || !quantity) {
      throw new Error('Missing required trade data from signal');
    }

    // Initialize Alpaca client
    const alpacaClient = new AlpacaClient(
      alpacaConfig.api_key,
      alpacaConfig.api_secret,
      alpacaConfig.is_paper_trading
    );

    let orderSide: 'buy' | 'sell';
    let orderQty = quantity;

    if (signalType === 'entry') {
      orderSide = 'buy';
    } else if (signalType === 'exit') {
      orderSide = 'sell';
      
      // For exit signals, check current position
      const position = await alpacaClient.getPosition(asset);
      if (!position) {
        return {
          success: false,
          message: 'No position to exit'
        };
      }
      
      // Use the position quantity for exit
      orderQty = Math.abs(parseFloat(position.qty));
    } else {
      throw new Error(`Unknown signal type: ${signalType}`);
    }

    // Generate client order ID
    const clientOrderId = `signal_${signal.id}_${Date.now()}`;

    // Place order on Alpaca
    const order = await alpacaClient.placeOrder({
      symbol: asset,
      qty: orderQty,
      side: orderSide,
      type: 'market',
      time_in_force: 'day',
      client_order_id: clientOrderId,
    });

    console.log(`✅ Alpaca order placed: ${order.id}`, order);

    // Record trade execution in database
    const { data: execution, error: executionError } = await supabase
      .from('alpaca_trade_executions')
      .insert({
        user_id: strategy.user_id,
        strategy_id: strategy.id,
        signal_id: signal.id,
        alpaca_order_id: order.id,
        alpaca_client_order_id: clientOrderId,
        symbol: order.symbol,
        side: order.side,
        order_type: order.type,
        time_in_force: order.time_in_force,
        quantity: parseFloat(order.qty),
        limit_price: order.limit_price ? parseFloat(order.limit_price) : null,
        stop_price: order.stop_price ? parseFloat(order.stop_price) : null,
        status: order.status,
        submitted_at: order.submitted_at,
      })
      .select()
      .single();

    if (executionError) {
      console.error('❌ Error recording execution:', executionError);
    } else {
      console.log(`📝 Trade execution recorded: ${execution.id}`);
    }

    return {
      success: true,
      message: `Order placed successfully: ${order.id}`,
      order
    };

  } catch (error) {
    console.error('❌ Error processing signal for Alpaca:', error);
    
    // Record failed execution
    try {
      await supabase
        .from('alpaca_trade_executions')
        .insert({
          user_id: strategy.user_id,
          strategy_id: strategy.id,
          signal_id: signal.id,
          symbol: strategy.target_asset,
          side: signal.signal_type === 'entry' ? 'buy' : 'sell',
          order_type: 'market',
          time_in_force: 'day',
          quantity: 0,
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        });
    } catch (recordError) {
      console.error('❌ Failed to record failed execution:', recordError);
    }

    return {
      success: false,
      message: error.message
    };
  }
}

// Main handler
export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { signal_id, strategy_id } = await req.json();

    if (!signal_id || !strategy_id) {
      throw new Error('Missing signal_id or strategy_id');
    }

    console.log(`🤖 Processing signal ${signal_id} for Alpaca auto-trade`);

    // Get signal
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signal_id)
      .single();

    if (signalError || !signal) {
      throw new Error('Signal not found');
    }

    // Get strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategy_id)
      .single();

    if (strategyError || !strategy) {
      throw new Error('Strategy not found');
    }

    // Check if user is PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', strategy.user_id)
      .single();

    const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium';
    if (!isPro) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User is not PRO - skipping Alpaca trade' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Alpaca configuration
    const { data: alpacaConfig, error: configError } = await supabase
      .from('alpaca_configurations')
      .select('*')
      .eq('user_id', strategy.user_id)
      .eq('is_active', true)
      .single();

    if (configError || !alpacaConfig) {
      console.log('⏭️ No active Alpaca configuration - skipping trade');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No active Alpaca configuration' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process signal and execute trade
    const result = await processSignalForAlpaca(supabase, signal, strategy, alpacaConfig);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in alpaca-auto-trade:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

