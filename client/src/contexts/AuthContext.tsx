import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está logado ao carregar a página
    const storedUsername = localStorage.getItem("username");
    const storedLoggedIn = localStorage.getItem("isLoggedIn");

    if (storedUsername && storedLoggedIn === "true") {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }

    setIsLoading(false);
  }, []);

  const login = (username: string) => {
    localStorage.setItem("username", username);
    localStorage.setItem("isLoggedIn", "true");
    setIsAuthenticated(true);
    setUsername(username);
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
    setIsAuthenticated(false);
    setUsername(null);
  };

  // Enquanto estiver verificando o estado de autenticação, mostra nada
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}