import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('--- Edge Function: create-user START ---');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Content-Type header received:', req.headers.get('content-type')); // Diagnostic log
    console.log('Content-Length header received:', req.headers.get('content-length')); // Diagnostic log

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
    console.log('Supabase client (with service role key) created.');

    // --- Authentication and Authorization Check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Auth Check Failed: No Authorization header.');
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: invokerUser }, error: invokerError } = await supabaseClient.auth.getUser(token);

    if (invokerError || !invokerUser) {
      console.log('Auth Check Failed: Invalid token or invokerError:', invokerError?.message);
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker user ID:', invokerUser.id);

    const { data: invokerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', invokerUser.id)
      .single();

    if (profileError || invokerProfile?.role !== 'admin') {
      console.log('Auth Check Failed: Invoker not admin. Role:', invokerProfile?.role, 'Profile Error:', profileError?.message);
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker is an administrator. Proceeding with user creation.');

    // --- Request Body Parsing ---
    let parsedBody;
    try {
      const rawBody = await req.text(); // Read as raw text first
      console.log('Raw request body received:', rawBody);
      console.log('Raw body length:', rawBody.length); // Diagnostic log

      if (!rawBody) {
        console.error('JSON parsing error: Request body is empty.');
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body: Body is empty' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      parsedBody = JSON.parse(rawBody); // Then parse the text
      console.log('Successfully parsed request body. Parsed data:', parsedBody);
    } catch (jsonParseError: any) {
      console.error('JSON parsing error: The request body is not valid JSON.', jsonParseError.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body: ' + jsonParseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, first_name, last_name, role } = parsedBody;
    console.log('Parsed payload details:', { email, password: '***', first_name, last_name, role }); // Mask password in logs

    if (!email || !password || !first_name || !last_name || !role) {
      console.log('Validation Failed: Missing required fields in parsed payload.');
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, first_name, last_name, role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Supabase Auth Admin User Creation ---
    console.log('Attempting to create user via auth.admin.createUser for email:', email);
    const { data: newUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { first_name, last_name, role }, // Pass profile data to user_metadata
    });

    if (authError) {
      console.log('Supabase Auth Error during user creation:', authError.message);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User created successfully with ID:', newUser.user?.id);

    console.log('--- Edge Function: create-user END (Success) ---');
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