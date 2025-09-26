import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { PublicHeader } from '@/components/PublicHeader';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';

type ChampionshipResult = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [championships, setChampionships] = useState<ChampionshipResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChampionships = useCallback(async (term = '') => {
    setLoading(true);
    let query = supabase
      .from('championships')
      .select('id, name, description, city, state, logo_url') // Optimized select
      .order('created_at', { ascending: false });

    if (term.trim()) {
      query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      showError('Erro ao buscar campeonatos: ' + error.message);
      setChampionships([]);
    } else {
      setChampionships(data as ChampionshipResult[]);
    }
    setLoading(false);
  }, []); // Empty dependency array as term is passed as argument

  useEffect(() => {
    fetchChampionships(); // Fetch all on initial load
  }, [fetchChampionships]); // Dependency on useCallback

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchChampionships(searchTerm);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="grid w-full gap-6 text-center">
          <div className="flex justify-center">
            <img src="/logo-gama.png" alt="Gama Creative Logo" className="h-24 w-auto" loading="lazy" />
          </div>
          <h1 className="text-3xl font-semibold">Encontre Campeonatos</h1>
          <p className="text-muted-foreground">
            Busque por nome, cidade ou estado para encontrar o campeonato que você procura.
          </p>
        </div>
        <div className="grid w-full max-w-6xl mx-auto items-start gap-6">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Buscar por nome, cidade, estado..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" className="text-primary-foreground">Buscar</Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [...Array(6)].map((_, index) => (
                <Card key={index}>
                  <CardHeader className="flex-row items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-sm" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : championships.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Nenhum campeonato encontrado.</p>
              </div>
            ) : (
              championships.map((championship) => (
                <Card key={championship.id}>
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
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {championship.description || 'Sem descrição.'}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/public/championship/${championship.id}`} className="text-foreground">Ver Página</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;