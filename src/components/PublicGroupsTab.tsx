import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export type Group = {
  id: string;
  name: string;
  championship_id: string;
  created_at: string;
};

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  group_id: string | null;
}

interface PublicGroupsTabProps {
  championshipId: string;
  teams: Team[]; // All teams in the championship
}

export function PublicGroupsTab({ championshipId, teams }: PublicGroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('championship_id', championshipId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
    } else {
      setGroups(data as Group[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grupos</CardTitle>
        <CardDescription>Organização dos times em grupos.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhum grupo cadastrado para este campeonato.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-base font-medium">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <h4 className="text-sm font-semibold mb-2">Times no Grupo:</h4>
                  {teams.filter(team => team.group_id === group.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum time neste grupo.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teams.filter(team => team.group_id === group.id).map(team => (
                        <Badge key={team.id} variant="secondary" className="flex items-center gap-1">
                          {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-4 w-4 object-contain" />}
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}