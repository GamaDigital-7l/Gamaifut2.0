import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Video, Star, Users, CalendarIcon, LayoutGrid, Download, MoreHorizontal, Edit, Trash2, X } from 'lucide-react';
import { Media, Match, Team, Round } from '@/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionProvider';
import { EditMediaDialog } from './EditMediaDialog';
import { DeleteMediaDialog } from './DeleteMediaDialog';

interface MediaGalleryProps {
  championshipId: string;
  matches: Match[];
  teams: Team[];
  rounds: Round[];
  teamId?: string;
}

export function MediaGallery({ championshipId, matches, teams, rounds, teamId }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userProfile, session } = useSession();

  const [selectedMediaForFullscreen, setSelectedMediaForFullscreen] = useState<Media | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterTeam, setFilterTeam] = useState<string>(teamId || 'all');
  const [filterRound, setFilterRound] = useState<string>('all');
  const [filterHighlight, setFilterHighlight] = useState<'all' | 'true'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('media')
      .select(`id, championship_id, user_id, type, url, thumbnail_url, description, tags, is_highlight, match_id, team_id, round_id, status, approved_by, approved_at, created_at`)
      .eq('championship_id', championshipId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }
    if (filterTeam !== 'all') {
      query = query.eq('team_id', filterTeam);
    }
    if (filterRound !== 'all') {
      query = query.eq('round_id', filterRound);
    }
    if (filterHighlight === 'true') {
      query = query.eq('is_highlight', true);
    }
    if (searchTerm.trim()) {
      query = query.ilike('description', `%${searchTerm.trim()}%`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching media:', fetchError);
      setError('Erro ao carregar mídias: ' + fetchError.message);
      setMediaItems([]);
    } else {
      const mappedData: Media[] = data.map(item => ({
        ...item,
        matches: matches.find(m => m.id === item.match_id) ? { team1: { name: matches.find(m => m.id === item.match_id)?.team1.name || '' }, team2: { name: matches.find(m => m.id === item.match_id)?.team2.name || '' } } : null,
        teams: teams.find(t => t.id === item.team_id) ? { name: teams.find(t => t.id === item.team_id)?.name || '' } : null,
        rounds: rounds.find(r => r.id === item.round_id) ? { name: rounds.find(r => r.id === item.round_id)?.name || '' } : null,
        profiles: null, 
      }));
      setMediaItems(mappedData);
    }
    setLoading(false);
  }, [championshipId, filterType, filterTeam, filterRound, filterHighlight, searchTerm, matches, teams, rounds]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    setFilterTeam(teamId || 'all');
  }, [teamId]);

  const getAssociatedText = (item: Media | null) => {
    if (!item) return '';
    const parts = [];
    if (item.matches?.team1?.name && item.matches?.team2?.name) {
      parts.push(`${item.matches.team1.name} vs ${item.matches.team2.name}`);
    }
    if (item.teams?.name) {
      parts.push(`Time: ${item.teams.name}`);
    }
    if (item.rounds?.name) {
      parts.push(`Rodada: ${item.rounds.name}`);
    }
    return parts.join(' | ');
  };

  const handleMediaClick = (item: Media) => {
    setSelectedMediaForFullscreen(item);
    setIsFullscreenOpen(true);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canManageMedia = (mediaItem: Media) => {
    if (!userProfile || !session) return false;
    if (userProfile.role === 'admin') return true;
    if (userProfile.id === mediaItem.user_id) return true;
    if (userProfile.role === 'official') return true; // Simplificação: oficiais podem gerenciar
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfólio do Campeonato</CardTitle>
        <CardDescription>Explore fotos e vídeos do campeonato.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <Label htmlFor="filter-type">Tipo</Label>
            <Select value={filterType} onValueChange={(value: 'all' | 'image' | 'video') => setFilterType(value)}>
              <SelectTrigger id="filter-type"><SelectValue placeholder="Todos os Tipos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="image">Fotos</SelectItem>
                <SelectItem value="video">Vídeos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-team">Time</Label>
            <Select value={filterTeam} onValueChange={setFilterTeam} disabled={!!teamId}>
              <SelectTrigger id="filter-team"><SelectValue placeholder="Todos os Times" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Times</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-round">Rodada</Label>
            <Select value={filterRound} onValueChange={setFilterRound}>
              <SelectTrigger id="filter-round"><SelectValue placeholder="Todas as Rodadas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Rodadas</SelectItem>
                {rounds.map(round => (
                  <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-highlight">Destaque</Label>
            <Select value={filterHighlight} onValueChange={(value: 'all' | 'true') => setFilterHighlight(value)}>
              <SelectTrigger id="filter-highlight"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Apenas Destaques</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 space-y-1">
            <Label htmlFor="search-term">Buscar por Descrição</Label>
            <Input
              id="search-term"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhuma mídia encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.description || 'Mídia do Campeonato'} 
                      className="object-cover w-full h-full cursor-pointer" 
                      loading="lazy" 
                      onClick={() => handleMediaClick(item)}
                    />
                  ) : (
                    <video 
                      src={item.url} 
                      className="object-cover w-full h-full cursor-pointer" 
                      poster={item.thumbnail_url || undefined}
                      onClick={() => handleMediaClick(item)}
                    >
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  )}
                  {item.is_highlight && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full text-xs flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> Destaque
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs">
                    {item.description && <p className="line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(item.url, item.url.split('/').pop() || 'download')}>
                          <Download className="mr-2 h-4 w-4" /> Baixar
                        </DropdownMenuItem>
                        {canManageMedia(item) && (
                          <>
                            <EditMediaDialog media={item} teams={teams} rounds={rounds} onMediaUpdated={fetchMedia}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                            </EditMediaDialog>
                            <DeleteMediaDialog media={item} onMediaDeleted={fetchMedia}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DeleteMediaDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {item.type === 'image' ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                    <span>{item.type === 'image' ? 'Foto' : 'Vídeo'}</span>
                    {item.profiles?.first_name && (
                      <span className="ml-auto text-xs">Por: {item.profiles.first_name}</span>
                    )}
                  </div>
                  {getAssociatedText(item) && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{getAssociatedText(item)}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-[0.6rem]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Full-screen Dialog for Media */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-full h-full sm:max-w-full sm:h-full p-0 bg-black/90 flex items-center justify-center">
          {/* Botão de fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={() => setIsFullscreenOpen(false)}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Fechar</span>
          </Button>

          {selectedMediaForFullscreen && (
            selectedMediaForFullscreen.type === 'image' ? (
              <img 
                src={selectedMediaForFullscreen.url} 
                alt={selectedMediaForFullscreen.description || 'Mídia do Campeonato'} 
                className="max-w-full max-h-full object-contain" 
              />
            ) : (
              <video 
                src={selectedMediaForFullscreen.url} 
                controls 
                autoPlay 
                onEnded={() => setIsFullscreenOpen(false)} {/* NOVO: Fecha o diálogo quando o vídeo termina */}
                className="max-w-full max-h-full object-contain"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            )
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}