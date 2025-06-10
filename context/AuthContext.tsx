// context/AuthContext.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: { token: string } | null;
  isAuthenticated: boolean;
  loading: boolean; // <-- AÑADIR ESTO
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true, // <-- AÑADIR ESTO (inicia en true)
  login: () => {},
  logout: () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true); // Ya teníamos este estado, ahora lo expondremos
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (token) {
      setUser({ token });
    }
    setLoading(false); // La verificación ha terminado
  }, []);

  const login = (token: string) => {
    localStorage.setItem("session_token", token);
    setUser({ token });
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("session_token");
    setUser(null);
    router.push("/login");
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
