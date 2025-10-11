// Alpaca Trade Execution Edge Function
// Executes trades on Alpaca based on trading signals

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

  // Test connection to Alpaca
  async testConnection(): Promise<{ success: boolean; message: string; account?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/account`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `Failed to connect: ${error}`,
        };
      }

      const account = await response.json();
      return {
        success: true,
        message: 'Connection successful',
        account,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }

  // Get account information
  async getAccount(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/account`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get account: ${await response.text()}`);
    }

    return await response.json();
  }

  // Place an order
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

  // Get order status
  async getOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/orders/${orderId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get order: ${await response.text()}`);
    }

    return await response.json();
  }

  // Cancel an order
  async cancelOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${await response.text()}`);
    }
  }

  // Get current positions
  async getPositions(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/v2/positions`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get positions: ${await response.text()}`);
    }

    return await response.json();
  }

  // Get specific position
  async getPosition(symbol: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/positions/${symbol}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null; // No position
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, ...params } = await req.json();

    // Check if user is PRO
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium';
    if (!isPro) {
      throw new Error('Alpaca integration is only available for PRO users');
    }

    // Get user's Alpaca configuration
    const { data: config, error: configError } = await supabaseClient
      .from('alpaca_configurations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      throw new Error('Alpaca configuration not found. Please configure your Alpaca API keys first.');
    }

    // Initialize Alpaca client
    const alpacaClient = new AlpacaClient(
      config.api_key,
      config.api_secret,
      config.is_paper_trading
    );

    // Handle different actions
    switch (action) {
      case 'test_connection': {
        const result = await alpacaClient.testConnection();
        
        // Update verification status
        await supabaseClient
          .from('alpaca_configurations')
          .update({
            last_verified_at: new Date().toISOString(),
            verification_status: result.success ? 'verified' : 'failed',
            verification_message: result.message,
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_account': {
        const account = await alpacaClient.getAccount();
        return new Response(
          JSON.stringify(account),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'place_order': {
        const {
          strategy_id,
          signal_id,
          symbol,
          qty,
          side,
          type = 'market',
          time_in_force = 'day',
          limit_price,
          stop_price,
        } = params;

        // Generate client order ID
        const client_order_id = `signal_${signal_id}_${Date.now()}`;

        // Place order on Alpaca
        const order = await alpacaClient.placeOrder({
          symbol,
          qty,
          side,
          type,
          time_in_force,
          limit_price,
          stop_price,
          client_order_id,
        });

        // Record trade execution in database
        const { data: execution, error: executionError } = await supabaseClient
          .from('alpaca_trade_executions')
          .insert({
            user_id: user.id,
            strategy_id,
            signal_id,
            alpaca_order_id: order.id,
            alpaca_client_order_id: client_order_id,
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
          console.error('Error recording execution:', executionError);
        }

        return new Response(
          JSON.stringify({ order, execution }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_order': {
        const { order_id } = params;
        const order = await alpacaClient.getOrder(order_id);
        return new Response(
          JSON.stringify(order),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel_order': {
        const { order_id } = params;
        await alpacaClient.cancelOrder(order_id);
        
        // Update execution record
        await supabaseClient
          .from('alpaca_trade_executions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('alpaca_order_id', order_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_positions': {
        const positions = await alpacaClient.getPositions();
        return new Response(
          JSON.stringify(positions),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_position': {
        const { symbol } = params;
        const position = await alpacaClient.getPosition(symbol);
        return new Response(
          JSON.stringify(position),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in alpaca-execute-trade:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

