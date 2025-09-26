import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useSession } from '@/components/SessionProvider';
import { useChampionshipTheme } from '@/contexts/ThemeContext'; // Import useChampionshipTheme to update logo in context

const ChampionshipTheme = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const { fetchChampionshipLogo } = useChampionshipTheme(); // Use fetchChampionshipLogo from context
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoUrl, setLogoUrl] = useState(''); // This holds the URL for display/preview (either from DB or local blob)
  const [logoFile, setLogoFile] = useState<File | null>(null); // This holds the actual file to upload
  const [originalLogoUrl, setOriginalLogoUrl] = useState(''); // To keep track of the logo from DB

  const fetchChampionshipLogoData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url') // Optimized select
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar logo do campeonato: ' + error.message);
      console.error('Error fetching championship logo:', error);
    } else if (data) {
      setLogoUrl(data.logo_url || ''); // Set initial logoUrl from DB
      setOriginalLogoUrl(data.logo_url || ''); // Store original URL
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchChampionshipLogoData();
  }, [fetchChampionshipLogoData]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0])); // For live preview
    } else {
      setLogoFile(null);
      setLogoUrl(originalLogoUrl); // Revert to original DB URL if input is cleared
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${id}-${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('championship-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      showError('Erro ao fazer upload do logo: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('championship-logos')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSaveLogo = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;

    setIsSubmitting(true);
    let newLogoUrl: string | null = originalLogoUrl; // Start with the original URL from DB

    if (logoFile) { // If a new file was selected
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        newLogoUrl = uploadedUrl; // Use the newly uploaded URL
      } else {
        setIsSubmitting(false);
        return; // Stop if upload failed
      }
    } else if (logoUrl === '' && originalLogoUrl !== '') {
      // If logoFile is null, logoUrl is empty (user cleared it), and there was an original logo
      newLogoUrl = null; // Explicitly set to null to clear from DB
    }
    // If logoFile is null and logoUrl is the same as originalLogoUrl, no change needed.
    // If logoFile is null and logoUrl is empty and originalLogoUrl was also empty, no change needed.

    const updates = {
      logo_url: newLogoUrl,
    };

    const { error } = await supabase
      .from('championships')
      .update(updates)
      .eq('id', id);

    setIsSubmitting(false);

    if (error) {
      showError('Erro ao salvar logo: ' + error.message);
      console.error('Error saving championship logo:', error);
    } else {
      showSuccess('Logo do campeonato atualizado com sucesso!');
      fetchChampionshipLogo(id); // Update logo in context
      navigate(`/championship/${id}`); // Go back to detail page to see changes
    }
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Logo do Campeonato</CardTitle>
          <CardDescription>Gerencie o logo do seu campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando configurações de logo...</p>
          ) : (
            <form onSubmit={handleSaveLogo} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logoUpload">Upload do Logo do Campeonato</Label>
                <Input
                  id="logoUpload"
                  type="file"
                  accept="image/png, image/svg+xml, image/jpeg"
                  onChange={handleLogoFileChange}
                  className="col-span-3"
                />
                {(logoUrl || logoFile) && ( // Display if there's a logo URL or a file selected
                  <p className="text-sm text-muted-foreground mt-1">
                    Logo atual: {logoFile ? logoFile.name : <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="underline">{logoUrl.split('/').pop()}</a>}
                  </p>
                )}
              </div>
              
              {/* Live Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pré-visualização do Logo</h3>
                <Card className="p-4">
                  <CardContent className="p-0 flex items-center justify-center min-h-[100px]">
                    {logoUrl ? (
                      <div className="w-32 h-32 relative">
                        <AspectRatio ratio={1 / 1}>
                          <img src={logoUrl} alt="Logo Preview" className="rounded-md object-contain" loading="lazy" />
                        </AspectRatio>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                        Sem Logo
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionshipTheme;