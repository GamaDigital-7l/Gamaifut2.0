import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Championship = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChampionship = async () => {
      if (!id) {
        setError('ID do campeonato não encontrado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching championship:', error);
        setError('Campeonato não encontrado ou erro ao carregar.');
        setChampionship(null);
      } else {
        setChampionship(data);
        setError(null);
      }
      setLoading(false);
    };

    fetchChampionship();
  }, [id]);

  if (loading) {
    return <div className="p-8">Carregando detalhes do campeonato...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!championship) {
    return (
       <div className="p-8 text-center">
        <p className="mb-4">Campeonato não encontrado.</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{championship.name}</h1>
        <p className="text-lg text-muted-foreground mt-2">{championship.description || 'Sem descrição.'}</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Times</h2>
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Ainda não há times neste campeonato.</p>
          <p className="text-gray-500 mt-2">Em breve você poderá adicioná-los aqui.</p>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipDetail;