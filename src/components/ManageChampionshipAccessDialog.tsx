import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, PlusCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Profile } from '@/types';
import { Badge } from '@/components/ui/badge'; // Importado Badge

interface ChampionshipUser {
  user_id: string;
  role_in_championship: string;
  profiles: Profile; // Nested profile data
}

interface ManageChampionshipAccessDialogProps {
  championshipId: string;
  championshipOwnerId: string;
  onAccessChanged: () => void;
  children: React.ReactNode;
}

export function ManageChampionshipAccessDialog({
  championshipId,
  championshipOwnerId,
  onAccessChanged,
  children,
}: ManageChampionshipAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [associatedUsers, setAssociatedUsers] = useState<ChampionshipUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string | undefined>(undefined);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useSession();

  const fetchAssociatedUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('championship_users')
      .select(`
        user_id,
        role_in_championship,
        profiles (id, first_name, last_name, avatar_url, role)
      `) // Removido 'email' da seleção de profiles
      .eq('championship_id', championshipId);

    if (error) {
      console.error('Error fetching associated users:', error);
      showError('Erro ao carregar usuários associados.');
      setAssociatedUsers([]);
    } else {
      // A tipagem do Supabase pode retornar 'profiles' como um array mesmo em 1:1.
      // Vamos garantir que seja um objeto único para cada ChampionshipUser.
      const formattedData = data.map((item: any) => ({
        user_id: item.user_id,
        role_in_championship: item.role_in_championship,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      })).filter((item: any) => item.profiles !== null); // Filtrar se o perfil não for encontrado

      setAssociatedUsers(formattedData as ChampionshipUser[]);
    }
    setIsLoading(false);
  }, [championshipId]);

  const fetchAvailableUsers = useCallback(async () => {
    // Fetch all profiles that are not the championship owner and not already associated
    const associatedUserIds = associatedUsers.map(cu => cu.user_id);
    const excludedIds = [championshipOwnerId, ...associatedUserIds];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, email')
      .not('id', 'in', `(${excludedIds.join(',')})`) // Exclude owner and already associated users
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching available users:', error);
      setAvailableUsers([]);
    } else {
      setAvailableUsers(data as Profile[]);
    }
  }, [championshipOwnerId, associatedUsers]);

  useEffect(() => {
    if (open) {
      fetchAssociatedUsers();
    }
  }, [open, fetchAssociatedUsers]);

  useEffect(() => {
    if (open && !isLoading) { // Only fetch available users once associated users are loaded
      fetchAvailableUsers();
    }
  }, [open, isLoading, associatedUsers, fetchAvailableUsers]);

  const handleAddUser = async () => {
    if (!selectedUserIdToAdd) {
      showError('Selecione um usuário para adicionar.');
      return;
    }
    setIsAddingUser(true);
    const { error } = await supabase
      .from('championship_users')
      .insert([{
        championship_id: championshipId,
        user_id: selectedUserIdToAdd,
        role_in_championship: 'viewer', // Default to viewer, can be changed later if needed
      }]);

    setIsAddingUser(false);

    if (error) {
      showError(`Erro ao adicionar usuário: ${error.message}`);
    } else {
      showSuccess('Usuário adicionado ao campeonato!');
      setSelectedUserIdToAdd(undefined);
      fetchAssociatedUsers(); // Refresh list
      onAccessChanged();
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from('championship_users')
      .delete()
      .eq('championship_id', championshipId)
      .eq('user_id', userId);

    if (error) {
      showError(`Erro ao remover usuário ${userName}: ${error.message}`);
    } else {
      showSuccess(`Usuário ${userName} removido do campeonato.`);
      fetchAssociatedUsers(); // Refresh list
      onAccessChanged();
    }
  };

  const canManage = userProfile?.id === championshipOwnerId && userProfile?.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Acesso ao Campeonato</DialogTitle>
          <DialogDescription>
            Adicione ou remova usuários que podem visualizar ou gerenciar este campeonato.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h3 className="text-lg font-semibold">Usuários com Acesso</h3>
          {isLoading ? (
            <p>Carregando usuários...</p>
          ) : associatedUsers.length === 0 && championshipOwnerId === userProfile?.id ? (
            <p className="text-muted-foreground">Você é o único usuário com acesso a este campeonato.</p>
          ) : (
            <div className="space-y-2">
              {/* Display owner first */}
              {userProfile?.id === championshipOwnerId && (
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.first_name || 'Owner'} loading="lazy" />
                      <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{userProfile.first_name} {userProfile.last_name} (Você)</span>
                  </div>
                  <Badge>Proprietário</Badge>
                </div>
              )}
              {associatedUsers.map((cu) => (
                <div key={cu.user_id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={cu.profiles.avatar_url || undefined} alt={cu.profiles.first_name || 'User'} loading="lazy" />
                      <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{cu.profiles.first_name} {cu.profiles.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cu.role_in_championship}</Badge>
                    {canManage && cu.user_id !== championshipOwnerId && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveUser(cu.user_id, `${cu.profiles.first_name} ${cu.profiles.last_name}`)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <>
              <h3 className="text-lg font-semibold mt-6">Adicionar Novo Usuário</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="select-user">Selecionar Usuário</Label>
                  <Select
                    value={selectedUserIdToAdd}
                    onValueChange={setSelectedUserIdToAdd}
                    disabled={availableUsers.length === 0}
                  >
                    <SelectTrigger id="select-user">
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <SelectItem value="no-users" disabled>Nenhum usuário disponível</SelectItem>
                      ) : (
                        availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email || 'N/A'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUser} disabled={!selectedUserIdToAdd || isAddingUser}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isAddingUser ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}