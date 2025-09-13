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

export type Group = {
  id: string;
  name: string;
  championship_id: string;
  created_at: string;
};

interface GroupsTabProps {
  championshipId: string;
}

export function GroupsTab({ championshipId }: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('championship_id', championshipId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      showError('Erro ao carregar grupos: ' + error.message);
    } else {
      setGroups(data as Group[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    setIsDeleting(true);
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
    
    setIsDeleting(false);

    if (error) {
      showError(`Erro ao excluir grupo "${groupName}": ${error.message}`);
    } else {
      showSuccess(`Grupo "${groupName}" excluído com sucesso!`);
      fetchGroups();
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
          <CreateGroupDialog championshipId={championshipId} onGroupCreated={fetchGroups} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando grupos...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhum grupo cadastrado.</p>
            <p className="text-gray-500 mt-2">Crie grupos para organizar seu campeonato.</p>
          </div>
        ) : (
          <div className="space-y-2">
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo "{group.name}" e desvinculará todas as partidas associadas a ele.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGroup(group.id, group.name)} disabled={isDeleting}>
                              {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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