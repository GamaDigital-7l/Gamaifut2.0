import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('--- Edge Function: delete-user START ---');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Content-Type header received:', req.headers.get('content-type')); // Diagnostic log

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

    // --- Authentication and Authorization Check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: invokerUser }, error: invokerError } = await supabaseClient.auth.getUser(token);

    if (invokerError || !invokerUser) {
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: invokerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', invokerUser.id)
      .single();

    if (profileError || invokerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can delete users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Request Body Parsing ---
    let parsedBody;
    try {
      const rawBody = await req.text(); // Read as raw text first
      console.log('Raw request body received:', rawBody);
      parsedBody = JSON.parse(rawBody); // Then parse the text
      console.log('Successfully parsed request body. Parsed data:', parsedBody);
    } catch (jsonParseError: any) {
      console.error('JSON parsing error: The request body is not valid JSON.', jsonParseError.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body: ' + jsonParseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userIdToDelete } = parsedBody;

    if (!userIdToDelete) {
      return new Response(JSON.stringify({ error: 'Missing required field: userIdToDelete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (userIdToDelete === invokerUser.id) {
      return new Response(JSON.stringify({ error: 'You cannot delete your own account.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Supabase Auth Admin User Deletion ---
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully', userId: userIdToDelete }), {
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