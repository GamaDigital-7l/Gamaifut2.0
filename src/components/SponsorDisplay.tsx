import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importar useMemo
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  const [rawSponsors, setRawSponsors] = useState<Sponsor[]>([]); // Store raw data
  const [loading, setLoading] = useState(true);

  const fetchActiveSponsors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, name, level, logo_url, target_url, is_active')
      .eq('championship_id', championshipId)
      .eq('is_active', true)
      .order('level', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active sponsors:', error);
    } else {
      setRawSponsors(data as Sponsor[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchActiveSponsors();
  }, [fetchActiveSponsors]);

  const sponsors = useMemo(() => rawSponsors, [rawSponsors]); // Memoize the list

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-center justify-center">
            {sponsors.map(sponsor => (
              <a 
                key={sponsor.id} 
                href={sponsor.target_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-2 border rounded-lg hover:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center"
              >
                <AspectRatio ratio={16 / 9} className="w-full max-w-[120px]">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="object-contain w-full h-full" loading="lazy" />
                  ) : (
                    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm h-full">
                      {sponsor.name}
                    </div>
                  )}
                </AspectRatio>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}