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

    const { strategyId } = await req.json();
    if (!strategyId) {
      return new Response(JSON.stringify({ error: 'strategyId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure the strategy is shared via recommendations
    const { data: rec, error: recErr } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('original_strategy_id', strategyId)
      .maybeSingle();
    if (recErr || !rec) {
      return new Response(JSON.stringify({ error: 'Strategy is not publicly shared' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load the original strategy
    const { data: strategy, error: strategyErr } = await supabaseAdmin
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();
    if (strategyErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Strategy not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load rule groups and rules for display
    const { data: groups, error: groupsErr } = await supabaseAdmin
      .from('rule_groups')
      .select('*, trading_rules(*)')
      .eq('strategy_id', strategy.id)
      .order('group_order', { ascending: true });
    if (groupsErr) {
      return new Response(JSON.stringify({ error: groupsErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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

    return new Response(
      JSON.stringify({ recommendation: rec, strategy: strategyInfo, entryRules, exitRules }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[public-strategy-detail] error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 