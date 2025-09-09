import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "npm:stripe@12.18.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-site-url',
  'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[create-checkout-session] request start');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const PRICE_ID_MONTHLY = Deno.env.get('STRIPE_PRICE_ID_MONTHLY');
    const PRICE_ID_YEARLY = Deno.env.get('STRIPE_PRICE_ID_YEARLY');

    if (!STRIPE_SECRET_KEY || !PRICE_ID_MONTHLY || !PRICE_ID_YEARLY) {
      console.error('[create-checkout-session] Missing Stripe configuration');
      return new Response(JSON.stringify({ error: 'Stripe configuration missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Parse JSON body regardless of content-type; fallback to query param
    let plan: string | null = null;
    try {
      const payload = await req.json().catch(() => null);
      if (payload && typeof payload === 'object') {
        plan = (payload as any).plan ?? null;
      }
    } catch (_) {
      // ignore malformed JSON
    }
    if (!plan) {
      const urlObj = new URL(req.url);
      plan = urlObj.searchParams.get('plan');
    }
    if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
      console.error('[create-checkout-session] Invalid plan:', plan);
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[create-checkout-session] Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !user) {
      console.error('[create-checkout-session] getUser failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    // Find or create Stripe customer by email
    let customerId: string | null = null;
    const existing = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
    if (existing.data && existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const created = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = created.id;
    }

    const envSiteUrl = Deno.env.get('SITE_URL') || Deno.env.get('PUBLIC_SITE_URL') || '';
    const clientSiteUrl = req.headers.get('x-site-url') || '';
    const originHeader = req.headers.get('Origin') || req.headers.get('Referer') || '';
    const resolveOrigin = (raw: string) => {
      try { return new URL(raw).origin; } catch { return ''; }
    };
    const siteUrl = 
      resolveOrigin(clientSiteUrl) || 
      resolveOrigin(envSiteUrl) || 
      resolveOrigin(originHeader) || 
      'http://localhost:5173';

    console.log('[create-checkout-session] user:', { id: user.id, email: user.email });
    console.log('[create-checkout-session] plan/siteUrl:', { plan, siteUrl });

    const successUrl = `${siteUrl}/settings?upgrade=success`;
    const cancelUrl = `${siteUrl}/settings?upgrade=cancel`;

    const priceId = plan === 'monthly' ? PRICE_ID_MONTHLY : PRICE_ID_YEARLY;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          { price: priceId, quantity: 1 }
        ],
        customer: customerId || undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          supabase_user_id: user.id,
          plan
        }
      });
    } catch (err: any) {
      console.error('[create-checkout-session] Stripe error:', err?.message || err);
      const message = err?.message || 'Stripe error';
      return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[create-checkout-session] Error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 