import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function create-user started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    console.log('Supabase client created');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Unauthorized: No Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: invokerUser }, error: invokerError } = await supabaseClient.auth.getUser(token);

    if (invokerError || !invokerUser) {
      console.log('Forbidden: Invalid token or invokerError', invokerError?.message);
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker user fetched:', invokerUser.id);

    const { data: invokerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', invokerUser.id)
      .single();

    if (profileError || invokerProfile?.role !== 'admin') {
      console.log('Forbidden: Invoker not admin or profileError', profileError?.message, 'Role:', invokerProfile?.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker is admin');

    const requestBodyText = await req.text();
    console.log('Raw request body received:', requestBodyText);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBodyText);
    } catch (jsonParseError: any) {
      console.error('JSON parsing error: The request body is not valid JSON.', jsonParseError.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body: ' + jsonParseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, first_name, last_name, role } = parsedBody;
    console.log('Parsed payload:', { email, first_name, last_name, role });

    if (!email || !password || !first_name || !last_name || !role) {
      console.log('Missing required fields after parsing');
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, first_name, last_name, role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Attempting to create user with email:', email);
    const { data: newUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role },
    });

    if (authError) {
      console.log('Auth error during user creation:', authError.message);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User created successfully:', newUser.user?.id);

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUser.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function caught an unexpected error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});