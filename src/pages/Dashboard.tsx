import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CreateChampionshipDialog } from '@/components/CreateChampionshipDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Championship = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChampionships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('championships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching championships:', error);
    } else if (data) {
      setChampionships(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Meus Campeonatos</h2>
        <CreateChampionshipDialog onChampionshipCreated={fetchChampionships} />
      </div>

      {loading ? (
        <p>Carregando campeonatos...</p>
      ) : championships.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Você ainda não criou nenhum campeonato.</p>
          <p className="text-gray-500 mt-2">Clique em "Criar Campeonato" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((championship) => (
            <Link to={`/championship/${championship.id}`} key={championship.id}>
              <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                <CardHeader>
                  <CardTitle>{championship.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{championship.description || 'Sem descrição.'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;