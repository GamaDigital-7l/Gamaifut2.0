import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { championshipId } = await req.json()
    if (!championshipId) {
      return new Response(JSON.stringify({ error: 'championshipId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Use a service role key for admin-level access if needed, but for public data, anon key is fine.
    // Ensure you have appropriate RLS policies.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const [
      championshipRes,
      teamsRes,
      groupsRes,
      roundsRes,
      matchesRes
    ] = await Promise.all([
      supabase.from('championships').select('*').eq('id', championshipId).single(),
      supabase.from('teams').select('*').eq('championship_id', championshipId).order('created_at', { ascending: true }),
      supabase.from('groups').select('*').eq('championship_id', championshipId).order('name', { ascending: true }),
      supabase.from('rounds').select('*').eq('championship_id', championshipId).order('order_index', { ascending: true }).order('name', { ascending: true }),
      supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(name, logo_url), team2:teams!matches_team2_id_fkey(name, logo_url), groups(name), rounds(name)`).eq('championship_id', championshipId).order('match_date', { ascending: true })
    ]);

    const errors = [championshipRes.error, teamsRes.error, groupsRes.error, roundsRes.error, matchesRes.error].filter(Boolean);
    if (errors.length > 0) {
      console.error('Errors fetching championship details:', errors);
      throw new Error('Failed to fetch all championship details');
    }

    const responseData = {
      championship: championshipRes.data,
      teams: teamsRes.data,
      groups: groupsRes.data,
      rounds: roundsRes.data,
      matches: matchesRes.data,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})