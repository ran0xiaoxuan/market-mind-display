
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
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Starting account deletion for user:', user.id)

    // Delete user data from public tables first (in correct order to handle foreign keys)
    
    // Delete backtests first (they reference strategies)
    const { error: backtestsError } = await supabaseAdmin
      .from('backtests')
      .delete()
      .eq('user_id', user.id)

    if (backtestsError) {
      console.error('Error deleting backtests:', backtestsError)
    } else {
      console.log('Backtests deleted successfully')
    }

    // Delete strategy applications
    const { error: applicationsError } = await supabaseAdmin
      .from('strategy_applications')
      .delete()
      .eq('user_id', user.id)

    if (applicationsError) {
      console.error('Error deleting strategy applications:', applicationsError)
    } else {
      console.log('Strategy applications deleted successfully')
    }

    // Get all strategies owned by this user
    const { data: userStrategies, error: strategiesQueryError } = await supabaseAdmin
      .from('strategies')
      .select('id')
      .eq('user_id', user.id)

    if (strategiesQueryError) {
      console.error('Error querying user strategies:', strategiesQueryError)
    } else {
      console.log('Found user strategies:', userStrategies?.length || 0)
      
      if (userStrategies && userStrategies.length > 0) {
        const strategyIds = userStrategies.map(s => s.id)
        
        // Delete rule groups for these strategies
        const { data: ruleGroups, error: ruleGroupsQueryError } = await supabaseAdmin
          .from('rule_groups')
          .select('id')
          .in('strategy_id', strategyIds)

        if (!ruleGroupsQueryError && ruleGroups && ruleGroups.length > 0) {
          const ruleGroupIds = ruleGroups.map(rg => rg.id)
          
          // Delete trading rules that reference rule groups
          const { error: rulesError } = await supabaseAdmin
            .from('trading_rules')
            .delete()
            .in('rule_group_id', ruleGroupIds)

          if (rulesError) {
            console.error('Error deleting trading rules:', rulesError)
          } else {
            console.log('Trading rules deleted successfully')
          }
        }

        // Delete rule groups
        const { error: ruleGroupsError } = await supabaseAdmin
          .from('rule_groups')
          .delete()
          .in('strategy_id', strategyIds)

        if (ruleGroupsError) {
          console.error('Error deleting rule groups:', ruleGroupsError)
        } else {
          console.log('Rule groups deleted successfully')
        }
      }
    }

    // Delete strategy copies where this user is involved
    const { error: strategyCopiesError } = await supabaseAdmin
      .from('strategy_copies')
      .delete()
      .eq('copied_by', user.id)

    if (strategyCopiesError) {
      console.error('Error deleting strategy copies:', strategyCopiesError)
    } else {
      console.log('Strategy copies deleted successfully')
    }

    // Delete strategy recommendations where this user is involved
    const { error: recommendationsError } = await supabaseAdmin
      .from('strategy_recommendations')
      .delete()
      .eq('recommended_by', user.id)

    if (recommendationsError) {
      console.error('Error deleting strategy recommendations:', recommendationsError)
    } else {
      console.log('Strategy recommendations deleted successfully')
    }

    // Delete strategies owned by the user
    const { error: strategiesError } = await supabaseAdmin
      .from('strategies')
      .delete()
      .eq('user_id', user.id)

    if (strategiesError) {
      console.error('Error deleting strategies:', strategiesError)
    } else {
      console.log('Strategies deleted successfully')
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    } else {
      console.log('Profile deleted successfully')
    }

    // Finally, delete the auth user account
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account: ' + deleteUserError.message }),
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
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
