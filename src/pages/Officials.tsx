import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon } from 'lucide-react'; // Renamed to avoid conflict with Supabase User type
import { useSession } from '@/components/SessionProvider'; // Import useSession

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
}

const Officials = () => {
  const { userProfile } = useSession(); // Get current user's profile
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch all profiles
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

    // Fetch emails from auth.users for all fetched profiles
    const userIds = profilesData.map(p => p.id);
    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      // Continue without emails if admin.listUsers fails (e.g., not service role)
      const formattedData: Profile[] = profilesData.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
        email: 'N/A', // Fallback if email cannot be fetched
      }));
      setProfiles(formattedData);
    } else {
      const userEmailMap = new Map(authUsersData.users.map(u => [u.id, u.email]));
      const formattedData: Profile[] = profilesData.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
        email: userEmailMap.get(profile.id) || 'N/A',
      }));
      setProfiles(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Only allow 'admin' role to manage other users' roles
  const canManageRoles = userProfile?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">Visualize todos os usuários cadastrados e suas funções.</p>
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
                  <span className="text-xs text-muted-foreground capitalize mt-2 block">Função: {profile.role}</span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Officials;