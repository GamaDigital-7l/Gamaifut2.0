import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';

export type Sponsor = {
  id: string;
  name: string;
  level: 'ouro' | 'prata' | 'bronze';
  logo_url: string | null;
  target_url: string | null;
  is_active: boolean;
};

interface SponsorDisplayProps {
  championshipId: string;
}

export function SponsorDisplay({ championshipId }: SponsorDisplayProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveSponsors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('championship_id', championshipId)
      .eq('is_active', true)
      .order('level', { ascending: false }) // Ouro, Prata, Bronze
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active sponsors:', error);
    } else {
      setSponsors(data as Sponsor[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchActiveSponsors();
  }, [fetchActiveSponsors]);

  const sponsorsByLevel = {
    ouro: sponsors.filter(s => s.level === 'ouro'),
    prata: sponsors.filter(s => s.level === 'prata'),
    bronze: sponsors.filter(s => s.level === 'bronze'),
  };

  const hasSponsors = sponsors.length > 0;

  if (loading) {
    return <div className="text-center py-4">Carregando patrocinadores...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Patrocinadores Oficiais</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSponsors ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhum patrocinador ativo para este campeonato.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sponsorsByLevel.ouro.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-yellow-600 dark:text-yellow-400">Ouro</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sponsorsByLevel.ouro.map(sponsor => (
                    <a key={sponsor.id} href={sponsor.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block p-2 border rounded-lg hover:shadow-md transition-shadow">
                      <AspectRatio ratio={16 / 9}>
                        {sponsor.logo_url ? (
                          <img src={sponsor.logo_url} alt={sponsor.name} className="object-contain w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">
                            {sponsor.name}
                          </div>
                        )}
                      </AspectRatio>
                    </a>
                  ))}
                </div>
                {(sponsorsByLevel.prata.length > 0 || sponsorsByLevel.bronze.length > 0) && <Separator className="my-6" />}
              </div>
            )}

            {sponsorsByLevel.prata.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-500 dark:text-gray-400">Prata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sponsorsByLevel.prata.map(sponsor => (
                    <a key={sponsor.id} href={sponsor.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block p-2 border rounded-lg hover:shadow-md transition-shadow">
                      <AspectRatio ratio={16 / 9}>
                        {sponsor.logo_url ? (
                          <img src={sponsor.logo_url} alt={sponsor.name} className="object-contain w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">
                            {sponsor.name}
                          </div>
                        )}
                      </AspectRatio>
                    </a>
                  ))}
                </div>
                {sponsorsByLevel.bronze.length > 0 && <Separator className="my-6" />}
              </div>
            )}

            {sponsorsByLevel.bronze.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-amber-700 dark:text-amber-500">Bronze</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sponsorsByLevel.bronze.map(sponsor => (
                    <a key={sponsor.id} href={sponsor.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block p-2 border rounded-lg hover:shadow-md transition-shadow">
                      <AspectRatio ratio={16 / 9}>
                        {sponsor.logo_url ? (
                          <img src={sponsor.logo_url} alt={sponsor.name} className="object-contain w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">
                            {sponsor.name}
                          </div>
                        )}
                      </AspectRatio>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}