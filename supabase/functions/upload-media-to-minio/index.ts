import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { S3Client } from "https://deno.land/x/s3@0.5.0/mod.ts"; // Using Deno's S3 client

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('--- Edge Function: upload-media-to-minio START ---');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for RLS bypass if needed, or auth.getUser for user context
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

    // Check if the user has permission to upload media (e.g., admin, official, or championship owner)
    // This logic should mirror the RLS policy for 'media' table INSERT
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', invokerUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching invoker profile:', profileError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile for authorization.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isUserAdmin = profile?.role === 'admin';
    const isUserOfficial = profile?.role === 'official';

    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const championshipId = formData.get("championshipId") as string;
    const userId = invokerUser.id; // The user performing the upload

    if (!file || !championshipId || !userId) {
      console.log('Validation Failed: Missing file, championshipId, or userId in form data.');
      return new Response(JSON.stringify({ error: 'Missing required form data: file, championshipId, userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Additional authorization check for championship ownership/association
    const { data: championshipData, error: champError } = await supabaseClient
      .from('championships')
      .select('user_id')
      .eq('id', championshipId)
      .single();

    if (champError || !championshipData) {
      console.error('Error fetching championship for authorization:', champError?.message);
      return new Response(JSON.stringify({ error: 'Championship not found or unauthorized.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isChampionshipOwner = championshipData.user_id === invokerUser.id;

    const { data: championshipUser, error: cuError } = await supabaseClient
      .from('championship_users')
      .select('role_in_championship')
      .eq('championship_id', championshipId)
      .eq('user_id', invokerUser.id)
      .single();

    const isChampionshipOfficialOrAdmin = championshipUser?.role_in_championship === 'official' || championshipUser?.role_in_championship === 'admin';

    if (!isUserAdmin && !isChampionshipOwner && !isChampionshipOfficialOrAdmin) {
      console.log('Authorization Failed: User is not admin, owner, or official for this championship.');
      return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to upload media for this championship.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User authorized to upload media.');

    // MinIO Configuration
    const MINIO_ENDPOINT = Deno.env.get('MINIO_ENDPOINT');
    const MINIO_ACCESS_KEY = Deno.env.get('MINIO_ACCESS_KEY');
    const MINIO_SECRET_KEY = Deno.env.get('MINIO_SECRET_KEY');
    const MINIO_BUCKET_NAME = Deno.env.get('MINIO_BUCKET_NAME');

    if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_BUCKET_NAME) {
      console.error('MinIO configuration missing in environment variables.');
      return new Response(JSON.stringify({ error: 'MinIO configuration missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const s3 = new S3Client({
      endPoint: MINIO_ENDPOINT,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
      region: "us-east-1", // MinIO often uses a default region, adjust if yours is different
      bucket: MINIO_BUCKET_NAME,
      // For self-signed certs or HTTP, you might need to disable TLS verification
      // ssl: false, // Use this if your MinIO is on HTTP
    });
    console.log('MinIO S3 client created.');

    const fileExt = file.name.split('.').pop();
    const objectKey = `${championshipId}/${crypto.randomUUID()}.${fileExt}`; // Path in MinIO bucket

    console.log(`Attempting to upload file to MinIO: bucket=${MINIO_BUCKET_NAME}, key=${objectKey}`);
    const uploadResult = await s3.putObject(MINIO_BUCKET_NAME, objectKey, file.stream(), {
      headers: {
        'Content-Type': file.type,
      },
    });
    console.log('MinIO upload result:', uploadResult);

    const publicUrl = `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${objectKey}`; // Construct public URL
    console.log('Generated public URL:', publicUrl);

    console.log('--- Edge Function: upload-media-to-minio END (Success) ---');
    return new Response(JSON.stringify({ message: 'File uploaded successfully', url: publicUrl }), {
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