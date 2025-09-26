import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function create-user started'); // Log de início

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service_role_key for admin operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    console.log('Supabase client created'); // Log após criar o cliente

    // Verify the user making the request is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Unauthorized: No Authorization header'); // Log de erro de autorização
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: invokerUser }, error: invokerError } = await supabaseClient.auth.getUser(token);

    if (invokerError || !invokerUser) {
      console.log('Unauthorized: Invalid token or invokerError', invokerError?.message); // Log de erro de token
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker user fetched:', invokerUser.id); // Log do usuário invocador

    const { data: invokerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', invokerUser.id)
      .single();

    if (profileError || invokerProfile?.role !== 'admin') {
      console.log('Forbidden: Invoker not admin or profileError', profileError?.message, 'Role:', invokerProfile?.role); // Log de permissão negada
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Invoker is admin'); // Log de admin verificado

    const { email, password, first_name, last_name, role } = await req.json();
    console.log('Received payload:', { email, first_name, last_name, role }); // Log do payload recebido

    if (!email || !password || !first_name || !last_name || !role) {
      console.log('Missing required fields'); // Log de campos faltando
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, first_name, last_name, role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Attempting to create user with email:', email); // Log antes de criar o usuário
    const { data: newUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { first_name, last_name, role }, // Pass role in metadata for trigger
    });

    if (authError) {
      console.log('Auth error during user creation:', authError.message); // Log de erro de autenticação
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User created successfully:', newUser.user?.id); // Log de sucesso na criação

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUser.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function caught an unexpected error:', error.message); // Log de erro inesperado
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});