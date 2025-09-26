import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '@/components/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { Match, Group, Round } from '@/types';

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
      console.log('OfficialDashboard: Permissão negada. User ID:', session?.user?.id, 'User Role:', userProfile?.role); // DIAGNOSTIC LOG
      return;
    }

    setLoading(true);
    setError(null);

    console.log('OfficialDashboard: Fetching matches for User ID:', session.user.id, 'with Role:', userProfile?.role); // DIAGNOSTIC LOG

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
        *,
        team1:teams!matches_team1_id_fkey(id, name, logo_url),
        team2:teams!matches_team2_id_fkey(id, name, logo_url),
        groups(name),
        rounds(name)
      `)
      .eq('assigned_official_id', session.user.id)
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('OfficialDashboard: Error fetching assigned matches:', matchesError); // DIAGNOSTIC LOG
      setError('Erro ao carregar suas partidas atribuídas.');
    } else {
      console.log('OfficialDashboard: Fetched matches data:', data); // DIAGNOSTIC LOG
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
}

export default OfficialDashboard;