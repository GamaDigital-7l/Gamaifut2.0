import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom'; // Re-adicionado useParams

interface ThemeContextType {
  championshipLogoUrl: string | null;
  globalThemeMode: 'light' | 'dark';
  toggleGlobalThemeMode: () => void;
  fetchChampionshipLogo: (championshipId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [championshipLogoUrl, setChampionshipLogoUrl] = useState<string | null>(null);
  const [globalThemeMode, setGlobalThemeMode] = useState<'light' | 'dark'>(() => {
    // Initialize theme from localStorage or default to 'dark'
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  const { id: championshipIdFromParams } = useParams<{ id: string }>(); // Re-adicionado useParams

  const applyGlobalThemeToDocument = useCallback((mode: 'light' | 'dark') => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', mode);
  }, []);

  const toggleGlobalThemeMode = useCallback(() => {
    setGlobalThemeMode(prevMode => {
      const newMode = prevMode === 'dark' ? 'light' : 'dark';
      applyGlobalThemeToDocument(newMode);
      return newMode;
    });
  }, [applyGlobalThemeToDocument]);

  const fetchChampionshipLogo = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching championship logo for context:', error);
      setChampionshipLogoUrl(null);
    } else if (data) {
      setChampionshipLogoUrl(data.logo_url);
    }
  }, []);

  // Effect to apply global theme mode on initial load and when it changes
  useEffect(() => {
    applyGlobalThemeToDocument(globalThemeMode);
  }, [globalThemeMode, applyGlobalThemeToDocument]);

  // Effect to fetch championship logo when championshipIdFromParams changes
  useEffect(() => {
    if (championshipIdFromParams) {
      fetchChampionshipLogo(championshipIdFromParams);
    } else {
      setChampionshipLogoUrl(null); // Clear logo if not on a championship page
    }
  }, [championshipIdFromParams, fetchChampionshipLogo]);

  return (
    <ThemeContext.Provider value={{ championshipLogoUrl, globalThemeMode, toggleGlobalThemeMode, fetchChampionshipLogo }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useChampionshipTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useChampionshipTheme must be used within a ThemeProvider');
  }
  return context;
};