import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Interface para configurações do tema
interface ThemeConfig {
  primaryColor: string;
  appName: string;
  logoUrl: string | null;
}

// Interface para o contexto
interface ThemeContextType {
  themeConfig: ThemeConfig;
  updateThemeConfig: (config: Partial<ThemeConfig>) => void;
}

// Configurações padrão
const defaultThemeConfig: ThemeConfig = {
  primaryColor: '#4CAF50',
  appName: 'FinTrack',
  logoUrl: null,
};

// Criação do contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props do provedor
interface ThemeProviderProps {
  children: ReactNode;
}

// Provedor de Tema
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Carregar configurações do localStorage ou usar padrão
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const savedConfig = localStorage.getItem('themeConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultThemeConfig;
  });

  // Atualizar configurações
  const updateThemeConfig = (config: Partial<ThemeConfig>) => {
    setThemeConfig(prev => {
      const newConfig = { ...prev, ...config };
      // Salvar no localStorage
      localStorage.setItem('themeConfig', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  // Atualizar variáveis CSS ao mudar a cor primária
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', themeConfig.primaryColor);
    
    // Ajustar cores relacionadas (mais escuras/claras para hover, etc.)
    const darkenColor = (color: string, amount = 0.1) => {
      const hex = color.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);
      
      r = Math.max(0, r * (1 - amount));
      g = Math.max(0, g * (1 - amount));
      b = Math.max(0, b * (1 - amount));
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    document.documentElement.style.setProperty('--primary-hover', darkenColor(themeConfig.primaryColor));
  }, [themeConfig.primaryColor]);

  return (
    <ThemeContext.Provider value={{ themeConfig, updateThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar o contexto
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}