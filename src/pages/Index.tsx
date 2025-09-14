import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { PublicHeader } from '@/components/PublicHeader';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

type ChampionshipResult = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChampionshipResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearched(true);
      return;
    }

    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('championships')
      .select('id, name, description, city, state')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`);

    if (error) {
      showError('Erro ao buscar campeonatos: ' + error.message);
      setSearchResults([]);
    } else {
      setSearchResults(data as ChampionshipResult[]);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Encontre Campeonatos</h1>
          <p className="text-muted-foreground">
            Busque por nome, cidade ou estado para encontrar o campeonato que você procura.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
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
              [...Array(3)].map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
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
            ) : searched && searchResults.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Nenhum resultado encontrado para "{searchTerm}".</p>
              </div>
            ) : (
              searchResults.map((championship) => (
                <Card key={championship.id}>
                  <CardHeader>
                    <CardTitle>{championship.name}</CardTitle>
                    <CardDescription>
                      {championship.city && championship.state 
                        ? `${championship.city}, ${championship.state}`
                        : 'Local não informado'}
                    </CardDescription>
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