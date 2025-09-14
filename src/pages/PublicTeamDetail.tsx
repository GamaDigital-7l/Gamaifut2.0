import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { Leaderboard } from '@/components/Leaderboard';
import { PublicHeader } from '@/components/PublicHeader';
import { useChampionshipTheme } from '@/contexts/ThemeContext';

// Re-using types for consistency
interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  championship_id: string;
  groups: { name: string } | null;
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
  team1_yellow_cards: number | null;
  team2_yellow_cards: number | null;
  team1_red_cards: number | null;
  team2_red_cards: number | null;
  team1_fouls: number | null;
  team2_fouls: number | null;
  notes: string | null;
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null;
  rounds: { name: string } | null;
}

const PublicTeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAndApplyChampionshipTheme, applyThemeToDocument } = useChampionshipTheme();

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`id, name, logo_url, championship_id, groups(name)`)
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      setError('Time não encontrado ou erro ao carregar.');
      setLoading(false);
      applyThemeToDocument(null);
      return;
    }
    setTeam(teamData as Team);
    fetchAndApplyChampionshipTheme(teamData.championship_id);

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`*, team1:teams!matches_team1_id_fkey(name, logo_url), team2:teams!matches_team2_id_fkey(name, logo_url), groups(name), rounds(name)`)
      .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
      .order('match_date', { ascending: true });

    if (matchesError) {
      setError('Erro ao carregar as partidas do time.');
    } else {
      setMatches(matchesData as Match[]);
    }

    setLoading(false);
  }, [teamId, fetchAndApplyChampionshipTheme, applyThemeToDocument]);

  useEffect(() => {
    fetchTeamDetails();
    return () => {
      applyThemeToDocument(null);
    };
  }, [fetchTeamDetails, applyThemeToDocument]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 p-4 md:p-10"><Skeleton className="h-64 w-full" /></main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Time não encontrado.'}</p>
            <Button asChild><Link to="/">Voltar para a Página Inicial</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      <main className="flex-1 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={team.logo_url || undefined} alt={team.name} />
              <AvatarFallback><Trophy className="h-10 w-10 text-gray-500" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <Button asChild variant="link" className="p-0 h-auto mt-1">
                <Link to={`/public/championship/${team.championship_id}`}>Voltar para o Campeonato</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Estatísticas do Time</CardTitle></CardHeader>
            <CardContent>
              <Leaderboard teams={[team]} matches={matches} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Partidas de {team.name}</CardTitle></CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-10"><p className="text-gray-500">Nenhuma partida encontrada.</p></div>
              ) : (
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <MatchCard key={match.id} match={match} onMatchUpdated={() => {}} onMatchDeleted={() => {}} isEven={index % 2 === 0} groups={[]} rounds={[]} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublicTeamDetail;