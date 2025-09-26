import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Trash2 } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { CreateUserDialog } from '@/components/CreateUserDialog'; // Import the new dialog

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'official' | 'admin';
  email: string;
}

const UserManagement = () => {
  const { userProfile, session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); // To track which user's role is being updated

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch profiles from the public.profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        role
      `)
      .order('first_name', { ascending: true });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setError('Erro ao carregar a lista de usuários.');
      setLoading(false);
      return;
    }

    // For security, emails from auth.users are not directly accessible client-side.
    // In a real app, you might fetch these via another secure Edge Function if needed.
    // For now, we'll use a placeholder or assume email is not strictly needed here.
    const formattedData: Profile[] = profilesData.map((profile: any) => ({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      email: 'N/A', // Placeholder, as direct client-side fetching of auth.users emails is insecure
    }));
    setProfiles(formattedData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'official' | 'admin') => {
    if (userProfile?.role !== 'admin') {
      showError('Você não tem permissão para alterar funções de usuário.');
      return;
    }
    setIsUpdatingRole(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    setIsUpdatingRole(null);

    if (error) {
      showError(`Erro ao atualizar função: ${error.message}`);
    } else {
      showSuccess('Função do usuário atualizada com sucesso!');
      fetchProfiles(); // Refresh the list
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userProfile?.role !== 'admin') {
      showError('Você não tem permissão para excluir usuários.');
      return;
    }
    if (userId === userProfile?.id) {
      showError('Você não pode excluir sua própria conta.');
      return;
    }

    // This operation requires service_role key, so it must be done via an Edge Function
    showError("A exclusão de usuários exige uma função de backend segura (Edge Function).");
    // For now, this button will just show an error.
    // In a real implementation, you'd invoke an Edge Function here.
  };

  // Only allow 'admin' role to manage other users' roles and create users
  const canManageRoles = userProfile?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie as funções dos usuários cadastrados.</p>
        </div>
        <div className="flex gap-2">
          {canManageRoles && <CreateUserDialog onUserCreated={fetchProfiles} />}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-red-500">
          <p>{error}</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || 'User'} />
                  <AvatarFallback>
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{profile.first_name} {profile.last_name}</CardTitle>
                  <CardDescription className="text-sm">{profile.email}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      value={profile.role}
                      onValueChange={(value: 'user' | 'official' | 'admin') => handleRoleChange(profile.id, value)}
                      disabled={!canManageRoles || isUpdatingRole === profile.id || profile.id === userProfile?.id} // Disable if not admin, or currently updating, or trying to change own role
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecionar Função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="official">Mesário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    {profile.id !== userProfile?.id && ( // Cannot delete own account
                      <Button
                        variant="destructive"
                        size="icon"
                        disabled={!canManageRoles}
                        onClick={() => handleDeleteUser(profile.id, `${profile.first_name} ${profile.last_name}`)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement;