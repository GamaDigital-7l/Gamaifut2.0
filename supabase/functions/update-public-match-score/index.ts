import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key to bypass RLS for update
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { matchId, team1Score, team2Score, goals, roundId, roundToken } = await req.json();

    if (!matchId || !roundId || !roundToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields: matchId, roundId, roundToken' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the roundToken against the rounds table
    const { data: roundData, error: roundError } = await supabaseClient
      .from('rounds')
      .select('id, public_edit_token')
      .eq('id', roundId)
      .eq('public_edit_token', roundToken) // CORRIGIDO: Era 'public_edit_edit_token'
      .single();

    if (roundError || !roundData) {
      console.error('Token validation failed:', roundError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired round token.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the match scores
    const { error: updateMatchError } = await supabaseClient
      .from('matches')
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
      })
      .eq('id', matchId);

    if (updateMatchError) {
      console.error('Error updating match scores:', updateMatchError.message);
      return new Response(JSON.stringify({ error: updateMatchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle goals: delete existing and insert new ones
    // Delete existing goals for this match
    const { error: deleteGoalsError } = await supabaseClient
      .from('match_goals')
      .delete()
      .eq('match_id', matchId);

    if (deleteGoalsError) {
      console.error('Error deleting existing goals:', deleteGoalsError.message);
      return new Response(JSON.stringify({ error: deleteGoalsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert new goals if provided
    if (goals && goals.length > 0) {
      const goalsToInsert = goals.map((goal: any) => ({
        match_id: matchId,
        team_id: goal.team_id,
        player_name: goal.player_name,
        jersey_number: goal.jersey_number,
        // user_id will be null for public updates, as there's no authenticated user
      }));

      const { error: insertGoalsError } = await supabaseClient
        .from('match_goals')
        .insert(goalsToInsert);

      if (insertGoalsError) {
        console.error('Error inserting new goals:', insertGoalsError.message);
        return new Response(JSON.stringify({ error: insertGoalsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ message: 'Match score and goals updated successfully' }), {
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