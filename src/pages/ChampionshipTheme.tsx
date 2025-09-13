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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [secondaryColor, setSecondaryColor] = useState('#6c757d');
  const [accentColor, setAccentColor] = useState('#28a745');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#212529');
  const [themeMode, setThemeMode] = useState('light'); // 'light' or 'dark'

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
      setLogoUrl(data.logo_url || '');
      setPrimaryColor(data.theme_primary || '#007bff');
      setSecondaryColor(data.theme_secondary || '#6c757d');
      setAccentColor(data.theme_accent || '#28a745');
      setBgColor(data.theme_bg || '#ffffff');
      setTextColor(data.theme_text || '#212529');
      setThemeMode(data.theme_mode || 'light');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchChampionshipTheme();
  }, [fetchChampionshipTheme]);

  const handleSaveTheme = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    const updates: ChampionshipThemeData = {
      logo_url: logoUrl,
      theme_primary: primaryColor,
      theme_secondary: secondaryColor,
      theme_accent: accentColor,
      theme_bg: bgColor,
      theme_text: textColor,
      theme_mode: themeMode,
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

  const previewStyles = {
    '--preview-primary': primaryColor,
    '--preview-secondary': secondaryColor,
    '--preview-accent': accentColor,
    '--preview-bg': bgColor,
    '--preview-text': textColor,
  } as React.CSSProperties;

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
                  <Label htmlFor="logoUrl">URL do Logo do Campeonato</Label>
                  <Input
                    id="logoUrl"
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://seulogo.com/logo.png"
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="themeMode">Modo do Tema</Label>
                  <Select value={themeMode} onValueChange={setThemeMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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