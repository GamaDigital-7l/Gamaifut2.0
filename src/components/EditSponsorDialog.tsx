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
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider'; // Import useSession
import { showSuccess, showError } from '@/utils/toast';
import { Sponsor } from './SponsorsTab';

interface EditSponsorDialogProps {
  sponsor: Sponsor;
  existingSponsors: Sponsor[];
  onSponsorUpdated: () => void;
  children: React.ReactNode;
}

export function EditSponsorDialog({ sponsor, existingSponsors, onSponsorUpdated, children }: EditSponsorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(sponsor.name);
  const [level, setLevel] = useState(sponsor.level);
  const [logoUrl, setLogoUrl] = useState(sponsor.logo_url || '');
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for the selected file
  const [targetUrl, setTargetUrl] = useState(sponsor.target_url || '');
  const [isActive, setIsActive] = useState(sponsor.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession(); // Get session for user ID

  useEffect(() => {
    setName(sponsor.name);
    setLevel(sponsor.level);
    setLogoUrl(sponsor.logo_url || '');
    setTargetUrl(sponsor.target_url || '');
    setIsActive(sponsor.is_active);
    setLogoFile(null); // Clear file input on sponsor change
  }, [sponsor]);

  const QUOTAS = {
    ouro: 1,
    prata: 2,
    bronze: 2,
  };

  const checkQuota = (selectedLevel: 'ouro' | 'prata' | 'bronze') => {
    if (selectedLevel === sponsor.level) return true; // It's the same level, so no change in count
    const count = existingSponsors.filter(s => s.level === selectedLevel).length;
    return count < QUOTAS[selectedLevel];
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0])); // For preview
    } else {
      setLogoFile(null);
      setLogoUrl(sponsor.logo_url || ''); // Revert to original URL if no new file selected
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${sponsor.id}-${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sponsor-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      showError('Erro ao fazer upload do logo do patrocinador: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('sponsor-logos')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !level) {
      showError("Nome e Nível são obrigatórios.");
      return;
    }

    if (!checkQuota(level)) {
      showError(`Limite de patrocinadores do nível "${level}" atingido.`);
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
      .from('sponsors')
      .update({
        name,
        level,
        logo_url: newLogoUrl,
        target_url: targetUrl,
        is_active: isActive,
      })
      .eq('id', sponsor.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar patrocinador: ${error.message}`);
    } else {
      showSuccess("Patrocinador atualizado com sucesso!");
      setOpen(false);
      onSponsorUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Patrocinador</DialogTitle>
          <DialogDescription>
            Atualize as informações do patrocinador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">Nível</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouro" disabled={!checkQuota('ouro')}>Ouro</SelectItem>
                  <SelectItem value="prata" disabled={!checkQuota('prata')}>Prata</SelectItem>
                  <SelectItem value="bronze" disabled={!checkQuota('bronze')}>Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoUpload" className="text-right">Logo (PNG/SVG/JPG)</Label>
              <Input id="logoUpload" type="file" accept="image/png, image/svg+xml, image/jpeg" onChange={handleLogoFileChange} className="col-span-3" />
              {logoUrl && (
                <p className="col-span-4 text-sm text-muted-foreground mt-1 text-right">
                  Logo atual: <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="underline">{logoUrl.split('/').pop()}</a>
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetUrl" className="text-right">URL de Destino</Label>
              <Input id="targetUrl" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Ativo</Label>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}