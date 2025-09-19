// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('[check-user-by-email] Missing env SUPABASE_URL or SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    const rawEmail = (payload?.email ?? '') as string;
    const email = rawEmail.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ exists: false, error: 'Invalid email' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // REST exact-match check (no email is sent, and avoids generateLink throttling)
    const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      console.error('[check-user-by-email] admin users query failed:', resp.status, await resp.text());
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json().catch(() => null);
    const usersArray = Array.isArray(data) ? data : (data?.users ?? []);
    const exists = Array.isArray(usersArray) && usersArray.some((u: any) => (u?.email ?? '').toLowerCase() === email);

    return new Response(JSON.stringify({ exists }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[check-user-by-email] exception:', e);
    return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}); 