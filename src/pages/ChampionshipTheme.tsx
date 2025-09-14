import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useSession } from '@/components/SessionProvider';
import { hexToHsl } from '@/lib/utils'; // Import the new utility

type ChampionshipThemeData = {
  logo_url: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  theme_accent: string | null;
  theme_bg: string | null;
  theme_text: string | null;
  theme_mode: string | null;
};

const ChampionshipTheme = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoUrl, setLogoUrl] = useState(''); // This holds the URL for display/preview (either from DB or local blob)
  const [logoFile, setLogoFile] = useState<File | null>(null); // This holds the actual file to upload
  const [originalLogoUrl, setOriginalLogoUrl] = useState(''); // To keep track of the logo from DB

  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [secondaryColor, setSecondaryColor] = useState('#6c757d');
  const [accentColor, setAccentColor] = useState('#28a745');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#212529');
  // Removed themeMode state as it's no longer configurable by admin

  const fetchChampionshipTheme = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url, theme_primary, theme_secondary, theme_accent, theme_bg, theme_text, theme_mode')
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar tema do campeonato: ' + error.message);
      console.error('Error fetching championship theme:', error);
    } else if (data) {
      setLogoUrl(data.logo_url || ''); // Set initial logoUrl from DB
      setOriginalLogoUrl(data.logo_url || ''); // Store original URL
      setPrimaryColor(data.theme_primary || '#007bff');
      setSecondaryColor(data.theme_secondary || '#6c757d');
      setAccentColor(data.theme_accent || '#28a745');
      setBgColor(data.theme_bg || '#ffffff');
      setTextColor(data.theme_text || '#212529');
      // themeMode is no longer set here as it's fixed
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchChampionshipTheme();
  }, [fetchChampionshipTheme]);

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

  const handleSaveTheme = async (event: FormEvent) => {
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

    const updates: ChampionshipThemeData = {
      logo_url: newLogoUrl,
      theme_primary: primaryColor,
      theme_secondary: secondaryColor,
      theme_accent: accentColor,
      theme_bg: bgColor,
      theme_text: textColor,
      theme_mode: 'dark', // Always save as dark mode
    };

    const { error } = await supabase
      .from('championships')
      .update(updates)
      .eq('id', id);

    setIsSubmitting(false);

    if (error) {
      showError('Erro ao salvar tema: ' + error.message);
      console.error('Error saving championship theme:', error);
    } else {
      showSuccess('Tema do campeonato atualizado com sucesso!');
      navigate(`/championship/${id}`); // Go back to detail page to see changes
    }
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Tema e Identidade Visual</CardTitle>
          <CardDescription>Personalize o logo e as cores do seu campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando configurações de tema...</p>
          ) : (
            <form onSubmit={handleSaveTheme} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Cor de Realce</Label>
                    <Input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bgColor">Cor de Fundo</Label>
                    <Input
                      id="bgColor"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Cor do Texto</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
                {/* Removed theme mode selection */}
                <div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pré-visualização</h3>
                <Card className="p-4" style={{ backgroundColor: bgColor, color: textColor }}>
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
                    {logoUrl ? (
                      <div className="w-16 h-16 relative">
                        <AspectRatio ratio={1 / 1}>
                          <img src={logoUrl} alt="Logo Preview" className="rounded-md object-contain" />
                        </AspectRatio>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                        Logo
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <h4 className="text-xl font-bold" style={{ color: textColor }}>Título do Campeonato</h4>
                    <p className="text-sm mt-2" style={{ color: textColor }}>
                      Esta é uma pré-visualização de como seu tema aparecerá.
                    </p>
                    <Button className="mt-4" style={{ backgroundColor: primaryColor, color: textColor }}>
                      Botão Primário
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionshipTheme;