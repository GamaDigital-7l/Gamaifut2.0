import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importar useMemo
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { showError } from '@/utils/toast';
import { useSession } from '@/components/SessionProvider';
import { Championship } from '@/types';

const OfficialDashboard = () => {
  const { userProfile } = useSession();
  const [rawChampionships, setRawChampionships] = useState<Championship[]>([]); // Store raw data
  const [loading, setLoading] = useState(true);

  const fetchChampionships = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('championships')
      .select('id, name, description, city, state, logo_url, user_id, points_for_win, sport_type, gender, age_category, tie_breaker_order');

    if (userProfile?.role === 'user') {
      setRawChampionships([]);
      setLoading(false);
      return;
    } else if (userProfile?.role === 'official') {
      query = supabase
        .from('championships')
        .select(`
          id, name, description, city, state, logo_url, user_id, points_for_win, sport_type, gender, age_category, tie_breaker_order,
          championship_users!inner(user_id, role_in_championship)
        `);
      query = query.or(`user_id.eq.${userProfile.id},championship_users.user_id.eq.${userProfile.id}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao buscar campeonatos: ' + error.message);
      setRawChampionships([]);
    } else {
      if (userProfile?.role === 'official') {
        const uniqueChampionships = Array.from(new Map(
          data.map((item: any) => [item.id, {
            id: item.id,
            name: item.name,
            description: item.description,
            city: item.city,
            state: item.state,
            logo_url: item.logo_url,
            user_id: item.user_id,
            points_for_win: item.points_for_win,
            sport_type: item.sport_type,
            gender: item.gender,
            age_category: item.age_category,
            tie_breaker_order: item.tie_breaker_order,
          }])
        ).values());
        setRawChampionships(uniqueChampionships as Championship[]);
      } else {
        setRawChampionships(data as Championship[]);
      }
    }
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      fetchChampionships();
    }
  }, [userProfile, fetchChampionships]);

  const championships = useMemo(() => rawChampionships, [rawChampionships]); // Memoize the list

  if (userProfile?.role === 'user') {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">Você não tem permissão para acessar este painel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Painel do Mesário</h1>
      <p className="text-muted-foreground">Gerencie os campeonatos aos quais você está associado.</p>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="flex flex-col justify-between">
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /></CardHeader>
              <CardContent className="flex-grow"><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-5/6" /></CardContent>
              <CardFooter className="flex justify-between items-center"><Skeleton className="h-8 w-24" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : championships.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Nenhum campeonato encontrado para você gerenciar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((championship) => (
            <Card key={championship.id} className="flex flex-col justify-between">
              <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-10 w-10 rounded-sm">
                  <AvatarImage src={championship.logo_url || undefined} alt={championship.name} loading="lazy" />
                  <AvatarFallback className="rounded-sm">
                    <Trophy className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>{championship.name}</CardTitle>
                  <CardDescription>
                    {championship.city && championship.state 
                      ? `${championship.city}, ${championship.state}`
                      : 'Local não informado'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {championship.description || 'Sem descrição.'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end items-center">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/official-championship-matches/${championship.id}`}>Gerenciar</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficialDashboard;