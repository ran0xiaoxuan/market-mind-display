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

    const { recommendationId } = await req.json();
    if (!recommendationId) {
      return new Response(JSON.stringify({ error: 'recommendationId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate token (user must be authenticated, but no special role)
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch recommendation
    const { data: rec, error: recErr } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('id', recommendationId)
      .single();
    if (recErr || !rec) {
      return new Response(JSON.stringify({ error: 'Recommendation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch original strategy
    const { data: strategy, error: strategyErr } = await supabaseAdmin
      .from('strategies')
      .select('*')
      .eq('id', rec.original_strategy_id)
      .single();
    if (strategyErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Original strategy not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch rule groups and rules
    const { data: groups, error: groupsErr } = await supabaseAdmin
      .from('rule_groups')
      .select('*, trading_rules(*)')
      .eq('strategy_id', strategy.id)
      .order('group_order', { ascending: true });
    if (groupsErr) {
      return new Response(JSON.stringify({ error: groupsErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Transform to StrategyInfo + entry/exit RuleGroupData
    const strategyInfo = {
      id: strategy.id,
      description: strategy.description,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      timeframe: strategy.timeframe,
      targetAsset: strategy.target_asset,
      dailySignalLimit: strategy.daily_signal_limit,
      signalNotificationsEnabled: strategy.signal_notifications_enabled,
    };

    const entryRules: any[] = [];
    const exitRules: any[] = [];

    (groups || []).forEach((group: any, index: number) => {
      const rg = {
        id: index + 1,
        logic: group.logic,
        requiredConditions: group.required_conditions || 1,
        inequalities: (group.trading_rules || []).map((rule: any, ruleIndex: number) => ({
          id: ruleIndex + 1,
          left: {
            type: rule.left_type,
            indicator: rule.left_indicator || undefined,
            parameters: rule.left_parameters || undefined,
            valueType: rule.left_value_type || undefined,
            value: rule.left_value || undefined
          },
          condition: rule.condition,
          right: {
            type: rule.right_type,
            indicator: rule.right_indicator || undefined,
            parameters: rule.right_parameters || undefined,
            valueType: rule.right_value_type || undefined,
            value: rule.right_value || undefined
          },
          explanation: rule.explanation || ''
        }))
      };
      if (group.rule_type === 'entry') entryRules.push(rg);
      else if (group.rule_type === 'exit') exitRules.push(rg);
    });

    return new Response(JSON.stringify({ recommendation: rec, strategy: strategyInfo, entryRules, exitRules }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[get-recommendation-detail] error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 