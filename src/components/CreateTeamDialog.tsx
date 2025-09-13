import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';

interface CreateTeamDialogProps {
  championshipId: string;
  onTeamCreated: () => void;
}

export function CreateTeamDialog({ championshipId, onTeamCreated }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for the selected file
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    } else {
      setLogoFile(null);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${championshipId}-${name.replace(/\s/g, '-')}-${Math.random()}.${fileExt}`;
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
    if (!name.trim() || !session?.user) {
      showError("O nome do time é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    let logo_url = null;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logo_url = uploadedUrl;
      } else {
        setIsSubmitting(false);
        return; // Stop if upload failed
      }
    }

    const { error } = await supabase
      .from('teams')
      .insert([{ 
        name, 
        championship_id: championshipId,
        user_id: session.user.id,
        logo_url,
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar time: ${error.message}`);
    } else {
      showSuccess("Time criado com sucesso!");
      setName('');
      setLogoFile(null);
      setOpen(false);
      onTeamCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Time</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Time</DialogTitle>
          <DialogDescription>
            Preencha o nome do time e adicione um escudo (opcional).
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
                placeholder="Nome do Time"
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
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}