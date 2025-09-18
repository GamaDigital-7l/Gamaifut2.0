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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider'; // Import useSession
import { showSuccess, showError } from '@/utils/toast';
import { Team, Group } from '@/types';

interface EditTeamDialogProps {
  team: Team;
  onTeamUpdated: () => void;
  children: React.ReactNode;
  groups: Group[]; // New prop for groups
}

export function EditTeamDialog({ team, onTeamUpdated, children, groups }: EditTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [logoUrl, setLogoUrl] = useState(team.logo_url || ''); // State for current logo URL
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for the selected new file
  const [groupId, setGroupId] = useState<string | undefined>(team.group_id || undefined); // New state for group
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession(); // Get session for user ID

  useEffect(() => {
    setName(team.name);
    setLogoUrl(team.logo_url || '');
    setLogoFile(null); // Clear file input on team change
    setGroupId(team.group_id || undefined); // Set initial group
  }, [team]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0])); // For live preview
    } else {
      setLogoFile(null);
      setLogoUrl(team.logo_url || ''); // Revert to original URL if no new file selected
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${team.id}-${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      showError('Erro ao fazer upload do logo do time: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('team-logos')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("O nome do time é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    let newLogoUrl = logoUrl;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        newLogoUrl = uploadedUrl;
      } else {
        setIsSubmitting(false);
        return; // Stop if upload failed
      }
    }

    const { error } = await supabase
      .from('teams')
      .update({ name, logo_url: newLogoUrl, group_id: groupId || null }) // Include group_id
      .eq('id', team.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar time: ${error.message}`);
    } else {
      showSuccess("Time atualizado com sucesso!");
      setOpen(false);
      onTeamUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Time</DialogTitle>
          <DialogDescription>
            Altere o nome, o escudo e o grupo do time e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoUpload" className="text-right">
                Escudo (PNG/SVG/JPG)
              </Label>
              <Input
                id="logoUpload"
                type="file"
                accept="image/png, image/svg+xml, image/jpeg"
                onChange={handleLogoFileChange}
                className="col-span-3"
              />
              {logoUrl && (
                <p className="col-span-4 text-sm text-muted-foreground mt-1 text-right">
                  Escudo atual: <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="underline">{logoUrl.split('/').pop()}</a>
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Grupo
              </Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}