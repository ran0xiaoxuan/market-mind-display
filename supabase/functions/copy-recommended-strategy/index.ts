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

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load recommendation and original strategy
    const { data: rec, error: recErr } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('id', recommendationId)
      .single();
    if (recErr || !rec) {
      return new Response(JSON.stringify({ error: 'Recommendation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: strategy, error: strategyErr } = await supabaseAdmin
      .from('strategies')
      .select('*')
      .eq('id', rec.original_strategy_id)
      .single();
    if (strategyErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Original strategy not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create new strategy for user
    const { data: newStrategy, error: createErr } = await supabaseAdmin
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.target_asset,
        target_asset_name: strategy.target_asset_name,
        is_active: true,
        user_id: user.id,
        source_strategy_id: strategy.id,
        is_recommended_copy: true,
        can_be_deleted: true
      })
      .select('*')
      .single();

    if (createErr || !newStrategy) {
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create strategy' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load rule groups and rules for original
    const { data: groups, error: groupsErr } = await supabaseAdmin
      .from('rule_groups')
      .select('*, trading_rules(*)')
      .eq('strategy_id', strategy.id)
      .order('group_order', { ascending: true });

    if (groupsErr) {
      return new Response(JSON.stringify({ error: groupsErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Clone groups
    for (const group of groups || []) {
      const { data: newGroup, error: newGroupErr } = await supabaseAdmin
        .from('rule_groups')
        .insert({
          strategy_id: newStrategy.id,
          rule_type: group.rule_type,
          logic: group.logic,
          required_conditions: group.required_conditions,
          group_order: group.group_order,
          explanation: group.explanation
        })
        .select('*')
        .single();
      if (newGroupErr) {
        return new Response(JSON.stringify({ error: newGroupErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      for (const rule of (group.trading_rules || [])) {
        const { error: newRuleErr } = await supabaseAdmin
          .from('trading_rules')
          .insert({
            rule_group_id: newGroup.id,
            left_type: rule.left_type,
            left_indicator: rule.left_indicator,
            left_parameters: rule.left_parameters,
            left_value_type: rule.left_value_type,
            left_value: rule.left_value,
            condition: rule.condition,
            right_type: rule.right_type,
            right_indicator: rule.right_indicator,
            right_parameters: rule.right_parameters,
            right_value_type: rule.right_value_type,
            right_value: rule.right_value,
            explanation: rule.explanation,
            inequality_order: rule.inequality_order
          });
        if (newRuleErr) {
          return new Response(JSON.stringify({ error: newRuleErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, newStrategyId: newStrategy.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[copy-recommended-strategy] error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 