import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { S3Client, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0?bundle";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('--- Edge Function: delete-media-from-minio START ---');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight.');
    return new Response('ok', { headers: corsHeaders, status: 200 });
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

    const { fileUrl } = await req.json();

    if (!fileUrl) {
      console.log('Validation Failed: Missing fileUrl in request body.');
      return new Response(JSON.stringify({ error: 'Missing required field: fileUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract bucket name and object key from the fileUrl
    const MINIO_ENDPOINT = Deno.env.get('MINIO_ENDPOINT');
    const MINIO_BUCKET_NAME = Deno.env.get('MINIO_BUCKET_NAME');

    if (!MINIO_ENDPOINT || !MINIO_BUCKET_NAME) {
      console.error('MinIO configuration missing in environment variables.');
      return new Response(JSON.stringify({ error: 'MinIO configuration missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct the expected base URL for the bucket
    const expectedBaseUrl = `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/`;
    if (!fileUrl.startsWith(expectedBaseUrl)) {
      console.error('File URL does not match expected MinIO bucket URL:', fileUrl);
      return new Response(JSON.stringify({ error: 'Invalid file URL for deletion.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const objectKey = fileUrl.substring(expectedBaseUrl.length);
    console.log('Extracted objectKey for deletion:', objectKey);

    // Check if the user is authorized to delete this specific media item
    const { data: mediaItem, error: mediaError } = await supabaseClient
      .from('media')
      .select('user_id, championship_id')
      .eq('url', fileUrl)
      .single();

    if (mediaError || !mediaItem) {
      console.error('Error fetching media item for authorization:', mediaError?.message);
      return new Response(JSON.stringify({ error: 'Media item not found or unauthorized.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isUploader = mediaItem.user_id === invokerUser.id;

    const { data: championshipData, error: champError } = await supabaseClient
      .from('championships')
      .select('user_id')
      .eq('id', mediaItem.championship_id)
      .single();

    if (champError || !championshipData) {
      console.error('Error fetching championship for authorization:', champError?.message);
      return new Response(JSON.stringify({ error: 'Championship not found for media item.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const isChampionshipOwner = championshipData.user_id === invokerUser.id;

    const { data: championshipUser, error: cuError } = await supabaseClient
      .from('championship_users')
      .select('role_in_championship')
      .eq('championship_id', mediaItem.championship_id)
      .eq('user_id', invokerUser.id)
      .single();

    const isChampionshipOfficialOrAdmin = championshipUser?.role_in_championship === 'official' || championshipUser?.role_in_championship === 'admin';

    if (!isUserAdmin && !isChampionshipOwner && !isChampionshipOfficialOrAdmin && !isUploader) {
      console.log('Authorization Failed: User is not admin, owner, official, or uploader for this media.');
      return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to delete this media.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User authorized to delete media.');

    const MINIO_ACCESS_KEY = Deno.env.get('MINIO_ACCESS_KEY');
    const MINIO_SECRET_KEY = Deno.env.get('MINIO_SECRET_KEY');

    const s3Client = new S3Client({
      endpoint: MINIO_ENDPOINT,
      region: "us-east-1",
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY!,
        secretAccessKey: MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
      credentialDefaultProvider: () => async () => ({
        accessKeyId: MINIO_ACCESS_KEY!, 
        secretAccessKey: MINIO_SECRET_KEY!,
      }),
      disableHostPrefix: true,
    });
    console.log('MinIO S3 client initialized for deletion.');

    const command = new DeleteObjectCommand({
      Bucket: MINIO_BUCKET_NAME,
      Key: objectKey,
    });

    const deleteResult = await s3Client.send(command);
    console.log('MinIO delete result:', deleteResult);

    console.log('--- Edge Function: delete-media-from-minio END (Success) ---');
    return new Response(JSON.stringify({ message: 'File deleted successfully', url: fileUrl }), {
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