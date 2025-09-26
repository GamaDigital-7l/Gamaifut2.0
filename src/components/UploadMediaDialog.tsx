import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Match, Team, Round } from '@/types';
import { format } from 'date-fns'; // Import format for match date display

interface UploadMediaDialogProps {
  championshipId: string;
  matches: Match[]; // Still needed for context, but not for direct association in this dialog
  teams: Team[];
  rounds: Round[];
  onMediaUploaded: () => void;
}

export function UploadMediaDialog({ championshipId, matches, teams, rounds, onMediaUploaded }: UploadMediaDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isHighlight, setIsHighlight] = useState(false);
  // Removed selectedMatchId
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    if (!open) {
      // Reset form fields when dialog closes
      setFile(null);
      setDescription('');
      setTags('');
      setIsHighlight(false);
      // Removed setSelectedMatchId(undefined);
      setSelectedTeamId(undefined);
      setSelectedRoundId(undefined);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const uploadFileToMinIOViaEdgeFunction = async (file: File, champId: string): Promise<string | null> => {
    if (!session?.access_token) {
      showError("Usuário não autenticado.");
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('championshipId', champId);

    try {
      const edgeFunctionUrl = `https://rrwtsnecjuugqlwmpgzd.supabase.co/functions/v1/upload-media-to-minio`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge Function response error:', data);
        throw new Error(data.error || 'Erro desconhecido ao fazer upload via Edge Function.');
      }

      if (data && data.url) {
        return data.url;
      } else {
        throw new Error('URL do arquivo não retornada pela Edge Function.');
      }
    } catch (error: any) {
      console.error('Error calling Edge Function for upload:', error);
      showError('Erro ao fazer upload do arquivo: ' + error.message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showError("Por favor, selecione um arquivo para upload.");
      return;
    }
    if (!session?.user) {
      showError("Você precisa estar logado para fazer upload de mídia.");
      return;
    }

    setIsSubmitting(true);
    let fileUrl: string | null = null;
    let fileType: 'image' | 'video';

    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else {
      showError("Tipo de arquivo não suportado. Apenas imagens e vídeos são permitidos.");
      setIsSubmitting(false);
      return;
    }

    fileUrl = await uploadFileToMinIOViaEdgeFunction(file, championshipId);

    if (!fileUrl) {
      setIsSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('media')
      .insert([{
        championship_id: championshipId,
        user_id: session.user.id,
        type: fileType,
        url: fileUrl,
        description: description.trim() === '' ? null : description.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        is_highlight: isHighlight,
        match_id: null, // Always null now, as we removed match selection
        team_id: selectedTeamId || null,
        round_id: selectedRoundId || null,
        status: 'approved',
      }]);

    setIsSubmitting(false);

    if (dbError) {
      showError(`Erro ao salvar metadados da mídia: ${dbError.message}`);
    } else {
      showSuccess("Mídia enviada com sucesso!");
      setOpen(false);
      onMediaUploaded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload de Mídia</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Fotos e Vídeos</DialogTitle>
          <DialogDescription>
            Envie fotos dos times, da partida ou vídeos de lances.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mediaFile">Arquivo de Mídia (Imagem/Vídeo)</Label>
              <Input
                id="mediaFile"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição da mídia..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Separadas por vírgula, ex: gol, defesa, timeA)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="futebol, gol, timeA, final"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isHighlight"
                checked={isHighlight}
                onCheckedChange={setIsHighlight}
              />
              <Label htmlFor="isHighlight">Marcar como Destaque</Label>
            </div>

            {/* Removed "Associar a um Jogo" section */}

            <div className="space-y-2">
              <Label htmlFor="team">Associar a um Time (Opcional)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Selecione um time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem> {/* Option to clear association */}
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="round">Associar a uma Rodada (Opcional)</Label>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger id="round">
                  <SelectValue placeholder="Selecione uma rodada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem> {/* Option to clear association */}
                  {rounds.map(round => (
                    <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Fazer Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}