import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

interface RequestBody {
  email: string
  redirectTo?: string
  turnstileToken?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

async function verifyTurnstile(token?: string): Promise<boolean> {
  try {
    if (!token) return true
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) return true

    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await result.json()
    return outcome?.success === true
  } catch (_) {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, redirectTo, turnstileToken }: RequestBody = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const captchaOk = await verifyTurnstile(turnstileToken)
    if (!captchaOk) {
      return new Response(JSON.stringify({ error: 'Turnstile verification failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: redirectTo || Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || undefined,
      }
    })

    if (error || !data?.properties?.action_link) {
      return new Response(JSON.stringify({ error: error?.message || 'Failed to generate confirmation link' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const actionLink = data.properties.action_link as string

    const html = `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;background:#f8fafc;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 12px 0;color:#111;">Confirm your email</h2>
      <p style="margin:0 0 16px 0;color:#374151;">Click the button below to confirm your email and complete your sign up.</p>
      <p style="margin:24px 0;">
        <a href="${actionLink}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Confirm Email</a>
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:24px;">If the button doesn't work, copy and paste this URL into your browser:<br/><span style="word-break:break-all;">${actionLink}</span></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
      <p style="font-size:12px;color:#6b7280;margin:0;">© 2025 StratAIge</p>
    </div>
  </body>
</html>`

    const sent = await resend.emails.send({
      from: 'StratAIge <team@strataige.top>',
      to: [email],
      subject: 'Confirm your email - StratAIge',
      html,
    })

    if (sent.error) {
      return new Response(JSON.stringify({ error: sent.error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}) 