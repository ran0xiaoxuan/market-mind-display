// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
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

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = user.id;
    const inviteCodeUsedRaw = (user.user_metadata as any)?.referral_code_used as string | undefined;
    const inviteCodeUsed = inviteCodeUsedRaw?.trim()?.toUpperCase() || null;

    // 1) Ensure current user has an invite code
    let { data: myCodeRow } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!myCodeRow) {
      // generate unique code
      for (let i = 0; i < 5; i++) {
        const candidate = generateCode();
        const { data: existing } = await supabaseAdmin
          .from('referral_codes')
          .select('code')
          .eq('code', candidate)
          .maybeSingle();
        if (!existing) {
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from('referral_codes')
            .insert({ user_id: userId, code: candidate })
            .select('*')
            .single();
          if (insertErr) {
            console.error('[referrals-sync] failed to insert referral code', insertErr);
          } else {
            myCodeRow = inserted;
          }
          break;
        }
      }
    }

    // 2) If the user used an invite code, record referral and create invitee first_purchase credit (only)
    let referralRecorded = false;
    if (inviteCodeUsed) {
      // Check if referral already recorded for this invitee
      const { data: existingReferral } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('invitee_user_id', userId)
        .maybeSingle();

      if (!existingReferral) {
        // Find inviter by code
        const { data: inviter } = await supabaseAdmin
          .from('referral_codes')
          .select('user_id')
          .eq('code', inviteCodeUsed)
          .maybeSingle();

        if (inviter && inviter.user_id !== userId) {
          // Create referral record with invitee email snapshot
          const { data: createdRef, error: refErr } = await supabaseAdmin
            .from('referrals')
            .insert({
              inviter_user_id: inviter.user_id,
              invitee_user_id: userId,
              referral_code: inviteCodeUsed,
              invitee_email: user.email
            })
            .select('id')
            .single();

          if (!refErr && createdRef) {
            referralRecorded = true;

            // Create one first_purchase credit for invitee if not exists
            await supabaseAdmin.from('user_discounts').insert({
              user_id: userId,
              type: 'first_purchase'
            }).onConflict('user_id,type').ignore();

            // DO NOT create inviter credit here; awarded after invitee completes first payment via webhook
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        referralRecorded,
        myInviteCode: myCodeRow?.code || null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[referrals-sync] unexpected error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 