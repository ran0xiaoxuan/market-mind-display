
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the user's JWT token to get their user ID
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Deleting auth user:', user.id)

    // Delete user data from public tables first (in correct order to handle foreign keys)
    
    // Delete backtests first (they reference strategies)
    const { error: backtestsError } = await supabaseAdmin
      .from('backtests')
      .delete()
      .eq('user_id', user.id)

    if (backtestsError) {
      console.error('Error deleting backtests:', backtestsError)
    }

    // Delete strategy applications
    const { error: applicationsError } = await supabaseAdmin
      .from('strategy_applications')
      .delete()
      .eq('user_id', user.id)

    if (applicationsError) {
      console.error('Error deleting strategy applications:', applicationsError)
    }

    // Delete trading rules that reference rule groups
    const { data: ruleGroups } = await supabaseAdmin
      .from('rule_groups')
      .select('id')
      .eq('strategy_id', user.id)

    if (ruleGroups && ruleGroups.length > 0) {
      const ruleGroupIds = ruleGroups.map(rg => rg.id)
      
      const { error: rulesError } = await supabaseAdmin
        .from('trading_rules')
        .delete()
        .in('rule_group_id', ruleGroupIds)

      if (rulesError) {
        console.error('Error deleting trading rules:', rulesError)
      }
    }

    // Delete rule groups
    const { error: ruleGroupsError } = await supabaseAdmin
      .from('rule_groups')
      .delete()
      .eq('strategy_id', user.id)

    if (ruleGroupsError) {
      console.error('Error deleting rule groups:', ruleGroupsError)
    }

    // Delete strategies
    const { error: strategiesError } = await supabaseAdmin
      .from('strategies')
      .delete()
      .eq('user_id', user.id)

    if (strategiesError) {
      console.error('Error deleting strategies:', strategiesError)
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // Finally, delete the auth user account
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully deleted user account:', user.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
