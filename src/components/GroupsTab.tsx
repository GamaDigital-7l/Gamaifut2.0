import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateGroupDialog } from './CreateGroupDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from '@/utils/toast';
import { Team, Group } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // Importar Skeleton
import { Badge } from '@/components/ui/badge'; // Importar Badge para os times

interface GroupsTabProps {
  championshipId: string;
  teams: Team[]; // New prop: all teams in the championship
  groups: Group[]; // Groups passed as prop
  isLoading: boolean;
  onDataChange: () => void; // Callback to notify parent of data changes
}

export function GroupsTab({ championshipId, teams, groups, isLoading, onDataChange }: GroupsTabProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    setIsDeleting(true);
    
    // First, set group_id to null for all teams in this group
    const { error: updateError } = await supabase
      .from('teams')
      .update({ group_id: null })
      .eq('group_id', groupId);

    if (updateError) {
      showError(`Erro ao desvincular times do grupo "${groupName}": ${updateError.message}`);
      setIsDeleting(false);
      return;
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
    
    setIsDeleting(false);

    if (error) {
      showError(`Erro ao excluir grupo "${groupName}": ${error.message}`);
    } else {
      showSuccess(`Grupo "${groupName}" excluído com sucesso!`);
      onDataChange(); // Notify parent to refetch all championship data
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Grupos</CardTitle>
            <CardDescription>Organize os times em grupos para as fases do campeonato.</CardDescription>
          </div>
          <CreateGroupDialog championshipId={championshipId} onGroupCreated={onDataChange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => ( // Render 2 skeleton cards
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
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
            <p className="text-gray-500">Nenhum grupo cadastrado.</p>
            <p className="text-gray-500 mt-2">Crie grupos para organizar seu campeonato.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-base font-medium">{group.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {/* Edit Group Dialog (to be implemented later) */}
                      <DropdownMenuItem disabled>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo "{group.name}" e desvinculará todos os times e partidas associadas a ele.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGroup(group.id, group.name)} disabled={isDeleting}>
                              {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <h4 className="text-sm font-semibold mb-2">Times no Grupo:</h4>
                  {teams.filter(team => team.group_id === group.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum time neste grupo.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teams.filter(team => team.group_id === group.id).map(team => (
                        <Badge key={team.id} variant="secondary" className="flex items-center gap-1">
                          {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-4 w-4 object-contain" loading="lazy" />}
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