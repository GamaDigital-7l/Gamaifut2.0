import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '@/components/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null;
  round_id: string | null;
  assigned_official_id: string | null;
  team1_yellow_cards: number | null; // New field
  team2_yellow_cards: number | null; // New field
  team1_red_cards: number | null; // New field
  team2_red_cards: number | null; // New field
  team1_fouls: number | null; // New field
  team2_fouls: number | null; // New field
  notes: string | null; // New field
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null;
  rounds: { name: string } | null;
}

interface Group {
  id: string;
  name: string;
}

interface Round {
  id: string;
  name: string;
  order_index: number;
  type: string;
}

const OfficialDashboard = () => {
  const { session, userProfile } = useSession();
  const [assignedMatches, setAssignedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]); // To pass to MatchCard
  const [allRounds, setAllRounds] = useState<Round[]>([]); // To pass to MatchCard

  const fetchAssignedMatches = useCallback(async () => {
    if (!session?.user?.id || (userProfile?.role !== 'official' && userProfile?.role !== 'admin')) {
      setLoading(false);
      setError('Você não tem permissão para acessar este painel.');
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all groups and rounds for MatchCard to display names
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*');
    if (groupsError) console.error('Error fetching groups for official dashboard:', groupsError);
    else setAllGroups(groupsData as Group[]);

    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*');
    if (roundsError) console.error('Error fetching rounds for official dashboard:', roundsError);
    else setAllRounds(roundsData as Round[]);

    const { data, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team1_id,
        team2_id,
        team1_score,
        team2_score,
        match_date,
        location,
        group_id,
        round_id,
        assigned_official_id,
        team1_yellow_cards,
        team2_yellow_cards,
        team1_red_cards,
        team2_red_cards,
        team1_fouls,
        team2_fouls,
        notes,
        team1:teams!matches_team1_id_fkey(name, logo_url),
        team2:teams!matches_team2_id_fkey(name, logo_url),
        groups(name),
        rounds(name)
      `)
      .eq('assigned_official_id', session.user.id)
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('Error fetching assigned matches:', matchesError);
      setError('Erro ao carregar suas partidas atribuídas.');
    } else {
      setAssignedMatches(data as Match[]);
    }
    setLoading(false);
  }, [session?.user?.id, userProfile?.role]);

  useEffect(() => {
    fetchAssignedMatches();
  }, [fetchAssignedMatches]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Painel do Mesário</h1>
      <p className="text-muted-foreground">Gerencie as partidas que foram atribuídas a você.</p>

      {assignedMatches.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Nenhuma partida atribuída a você.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignedMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              onMatchUpdated={fetchAssignedMatches}
              onMatchDeleted={fetchAssignedMatches}
              isEven={index % 2 === 0}
              groups={allGroups}
              rounds={allRounds}
              isOfficialView={true} // Indicate that this card is in the official view
              isPublicView={false} // Explicitly set to false
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficialDashboard;