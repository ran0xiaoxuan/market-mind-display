// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { strategyId } = await req.json();
    if (!strategyId) {
      return new Response(JSON.stringify({ error: 'strategyId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // SECURITY: Check admin permissions using environment variable
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') || 'ran0xiaoxuan@gmail.com')
      .split(',')
      .map(email => email.trim().toLowerCase());
    
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      console.log(`[share-strategy] Unauthorized access attempt by: ${user.email || 'unknown'}`);
      return new Response(JSON.stringify({ error: 'Insufficient permissions to share strategies' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load strategy and ensure ownership
    const { data: strategy, error: strategyErr } = await supabaseAdmin
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Strategy not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (strategy.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'You do not own this strategy' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Upsert into public.recommendations (unique on original_strategy_id)
    const { data: rec, error: recErr } = await supabaseAdmin
      .from('recommendations')
      .upsert({
        original_strategy_id: strategy.id,
        original_user_id: user.id,
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.target_asset,
        target_asset_name: strategy.target_asset_name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'original_strategy_id' })
      .select('*')
      .single();

    if (recErr) {
      return new Response(JSON.stringify({ error: recErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, recommendation: rec }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[share-strategy] error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 