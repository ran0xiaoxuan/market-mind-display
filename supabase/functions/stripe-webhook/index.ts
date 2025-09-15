// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "npm:stripe@12.18.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing Stripe configuration', { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const discountId = (session.metadata as any)?.discount_id as string | undefined;
        if (discountId) {
          await supabaseAdmin.from('user_discounts')
            .update({ consumed: true, consumed_at: new Date().toISOString(), stripe_session_id: session.id })
            .eq('id', discountId);
        }

        // Award inviter credit if this is the invitee's first successful payment
        // Find supabase user id from metadata (we set it on checkout.create)
        const inviteeUserId = (session.metadata as any)?.supabase_user_id as string | undefined;
        if (inviteeUserId) {
          // Check if this invitee has an inviter via referrals
          const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('inviter_user_id')
            .eq('invitee_user_id', inviteeUserId)
            .maybeSingle();

          if (referral?.inviter_user_id) {
            // Has inviter; ensure no previous referral_credit was awarded for this invitee
            const { data: existingAward } = await supabaseAdmin
              .from('user_discounts')
              .select('id')
              .eq('user_id', referral.inviter_user_id)
              .eq('type', 'referral_credit')
              .eq('referral_award_for_invitee', inviteeUserId)
              .maybeSingle();

            if (!existingAward) {
              await supabaseAdmin.from('user_discounts').insert({
                user_id: referral.inviter_user_id,
                type: 'referral_credit',
                referral_award_for_invitee: inviteeUserId
              });
            }
          }
        }
        break;
      }
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook handler error:', e);
    return new Response('Server Error', { status: 500, headers: corsHeaders });
  }
}); 