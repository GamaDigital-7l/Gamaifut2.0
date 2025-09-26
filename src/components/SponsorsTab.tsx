import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importar useMemo
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateSponsorDialog } from './CreateSponsorDialog';
import { EditSponsorDialog } from './EditSponsorDialog';
import { DeleteSponsorDialog } from './DeleteSponsorDialog';
import { Skeleton } from '@/components/ui/skeleton';

export type Sponsor = {
  id: string;
  name: string;
  level: 'ouro' | 'prata' | 'bronze';
  logo_url: string | null;
  target_url: string | null;
  is_active: boolean;
};

interface SponsorsTabProps {
  championshipId: string;
  onDataChange: () => void;
}

export function SponsorsTab({ championshipId, onDataChange }: SponsorsTabProps) {
  const [rawSponsors, setRawSponsors] = useState<Sponsor[]>([]); // Store raw data
  const [loading, setLoading] = useState(true);

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, name, level, logo_url, target_url, is_active')
      .eq('championship_id', championshipId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sponsors:', error);
    } else {
      setRawSponsors(data as Sponsor[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const sponsors = useMemo(() => rawSponsors, [rawSponsors]); // Memoize the list

  const handleSponsorChange = () => {
    fetchSponsors();
    onDataChange();
  };

  const levelVariant = useCallback((level: string) => {
    switch (level) {
      case 'ouro': return 'default';
      case 'prata': return 'secondary';
      case 'bronze': return 'outline';
      default: return 'outline';
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Patrocinadores</CardTitle>
            <CardDescription>Gerencie os patrocinadores do campeonato.</CardDescription>
          </div>
          <CreateSponsorDialog 
            championshipId={championshipId} 
            existingSponsors={sponsors}
            onSponsorCreated={handleSponsorChange} 
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhum patrocinador cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sponsors.map((sponsor) => (
              <Card key={sponsor.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {sponsor.logo_url && <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 w-10 object-contain" loading="lazy" />}
                    <CardTitle className="text-base font-medium">{sponsor.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={levelVariant(sponsor.level)}>{sponsor.level}</Badge>
                    <Badge variant={sponsor.is_active ? 'default' : 'destructive'}>
                      {sponsor.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <EditSponsorDialog sponsor={sponsor} existingSponsors={sponsors} onSponsorUpdated={handleSponsorChange}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                        </EditSponsorDialog>
                        <DeleteSponsorDialog sponsor={sponsor} onSponsorDeleted={handleSponsorChange}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir</DropdownMenuItem>
                        </DeleteSponsorDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}