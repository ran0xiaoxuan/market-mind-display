
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Delete user account function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting account deletion process');

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
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing authorization header');
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
    console.log('Verifying JWT token...');
    
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

    // Delete user data in the correct order to avoid foreign key violations
    
    // 1. Delete notification logs first
    console.log('Deleting notification logs...');
    const { error: notificationLogsError } = await supabaseAdmin
      .from('notification_logs')
      .delete()
      .eq('user_id', user.id);

    if (notificationLogsError) {
      console.error('Error deleting notification logs:', notificationLogsError);
    } else {
      console.log('Notification logs deleted successfully');
    }

    // 2. Delete notification settings
    console.log('Deleting notification settings...');
    const { error: notificationSettingsError } = await supabaseAdmin
      .from('notification_settings')
      .delete()
      .eq('user_id', user.id);

    if (notificationSettingsError) {
      console.error('Error deleting notification settings:', notificationSettingsError);
    } else {
      console.log('Notification settings deleted successfully');
    }

    // 3. Get user strategies first
    console.log('Fetching user strategies...');
    const { data: userStrategies, error: strategiesError } = await supabaseAdmin
      .from('strategies')
      .select('id')
      .eq('user_id', user.id);

    if (strategiesError) {
      console.error('Error fetching user strategies:', strategiesError);
    } else {
      console.log(`Found ${userStrategies?.length || 0} strategies to delete`);
      
      // Delete each strategy using the cascade function
      if (userStrategies && userStrategies.length > 0) {
        for (const strategy of userStrategies) {
          try {
            console.log(`Deleting strategy ${strategy.id}...`);
            const { error: cascadeError } = await supabaseAdmin.rpc('delete_strategy_cascade', {
              strategy_uuid: strategy.id
            });
            
            if (cascadeError) {
              console.error(`Error deleting strategy ${strategy.id}:`, cascadeError);
              // Continue with other strategies even if one fails
            } else {
              console.log(`Strategy ${strategy.id} deleted successfully`);
            }
          } catch (error) {
            console.error(`Exception deleting strategy ${strategy.id}:`, error);
            // Continue with other strategies
          }
        }
      }
    }

    // 4. Delete user roles
    console.log('Deleting user roles...');
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (userRolesError) {
      console.error('Error deleting user roles:', userRolesError);
    } else {
      console.log('User roles deleted successfully');
    }

    // 5. Delete subscriber data
    console.log('Deleting subscriber data...');
    const { error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id);

    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError);
    } else {
      console.log('Subscriber data deleted successfully');
    }

    // 6. Delete profile
    console.log('Deleting profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    } else {
      console.log('Profile deleted successfully');
    }

    // 7. Finally, delete the auth user account
    console.log('Deleting auth user...');
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account: ' + deleteUserError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully deleted user account:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
