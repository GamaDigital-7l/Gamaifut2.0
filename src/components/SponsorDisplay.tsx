import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
                className={cn(
                  "block p-2 border rounded-lg hover:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center",
                  sponsor.level === 'ouro' && "col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2 xl:col-span-2 p-4 border-2 border-yellow-500 shadow-lg scale-105", // Larger for Ouro
                  sponsor.level === 'prata' && "p-3 border-gray-400 shadow-md scale-100", // Slightly larger for Prata
                  sponsor.level === 'bronze' && "p-2 border-gray-300" // Standard for Bronze
                )}
              >
                <AspectRatio ratio={16 / 9} className={cn(
                  "w-full",
                  sponsor.level === 'ouro' && "max-w-[180px]", // Max width for ouro logo
                  sponsor.level === 'prata' && "max-w-[140px]", // Max width for prata logo
                  sponsor.level === 'bronze' && "max-w-[100px]" // Max width for bronze logo
                )}>
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="object-contain w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm h-full">
                      {sponsor.name}
                    </div>
                  )}
                </AspectRatio>
                {/* Optionally display name below logo for better visibility */}
                {/* <p className="mt-2 text-sm font-medium text-foreground">{sponsor.name}</p> */}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}