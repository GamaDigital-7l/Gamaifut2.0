import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import { Team, Group } from '@/types';

const fetchTeams = async (championshipId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('championship_id', championshipId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Team[];
};

const fetchGroups = async (championshipId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('championship_id', championshipId);
  if (error) throw new Error(error.message);
  return data as Group[];
};

interface TeamsTabProps {
  championshipId: string;
}

export function TeamsTab({ championshipId }: TeamsTabProps) {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', championshipId],
    queryFn: () => fetchTeams(championshipId),
  });

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', championshipId],
    queryFn: () => fetchGroups(championshipId),
  });

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['teams', championshipId] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard', championshipId] }); // Invalidate leaderboard as well
  };

  const isLoading = isLoadingTeams || isLoadingGroups;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Times</CardTitle>
            <CardDescription>Gerencie os times participantes.</CardDescription>
          </div>
          <CreateTeamDialog championshipId={championshipId} onTeamCreated={invalidateAndRefetch} groups={groups} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Ainda não há times.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-10 w-10 object-contain" />}
                    <CardTitle className="text-base font-medium">
                      <Link to={`/team/${team.id}`} className="hover:underline">{team.name}</Link>
                    </CardTitle>
                    {team.group_id && (
                      <span className="text-sm text-muted-foreground">
                        ({groups.find(g => g.id === team.group_id)?.name || 'Grupo Desconhecido'})
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <EditTeamDialog team={team} onTeamUpdated={invalidateAndRefetch} groups={groups}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                      </EditTeamDialog>
                      <DeleteTeamDialog team={team} onTeamDeleted={invalidateAndRefetch}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir</DropdownMenuItem>
                      </DeleteTeamDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}