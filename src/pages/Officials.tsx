import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string; // Assuming email can be fetched or is part of the profile
}

const Officials = () => {
  const [officials, setOfficials] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficials = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch profiles and join with auth.users to get email
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        role,
        auth_users(email)
      `)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching officials:', error);
      setError('Erro ao carregar a lista de mesários.');
    } else {
      const formattedData: Profile[] = data.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
        email: profile.auth_users?.email || 'N/A',
      }));
      setOfficials(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOfficials();
  }, [fetchOfficials]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciar Mesários</h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie os usuários que podem atuar como mesários.</p>
        </div>
        {/* Futuramente, pode haver um botão para convidar novos mesários ou editar roles */}
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
      ) : officials.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Nenhum mesário encontrado.</p>
          <p className="text-gray-500 mt-2">Convide usuários para se tornarem mesários.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {officials.map((official) => (
            <Card key={official.id}>
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={official.avatar_url || undefined} alt={official.first_name || 'User'} />
                  <AvatarFallback>
                    <User className="h-6 w-6 text-gray-500" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{official.first_name} {official.last_name}</CardTitle>
                  <CardDescription className="text-sm">{official.email}</CardDescription>
                  <span className="text-xs text-muted-foreground capitalize">{official.role}</span>
                </div>
                {/* Futuramente, botões de ação como "Editar Role" ou "Remover" */}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Officials;