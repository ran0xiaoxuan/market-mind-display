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

    const payload = await req.json().catch(() => ({}));
    const rawCode = (payload?.code ?? '') as string;
    const code = rawCode.trim().toUpperCase();

    if (!code || code.length < 4) {
      return new Response(JSON.stringify({ valid: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: rc } = await supabaseAdmin
      .from('referral_codes')
      .select('user_id, code')
      .eq('code', code)
      .maybeSingle();

    const valid = !!rc?.user_id;
    return new Response(JSON.stringify({ valid }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[validate-referral-code] error', e);
    return new Response(JSON.stringify({ valid: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 