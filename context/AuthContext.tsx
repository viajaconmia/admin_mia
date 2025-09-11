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
import { AuthService } from "@/services/AuthService";
import { useNotification } from "./useNotificacion";

export type User = {
  name: string;
  id: string;
  token: string;
  permisos: string[];
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Ya teníamos este estado, ahora lo expondremos
  const router = useRouter();
  const { showNotification } = useNotification();

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const { data } = await AuthService.getInstance().verifySession();
        setUser(data);
      } catch (error) {
        console.log(error.message || "Error al verificar la sesion");
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await AuthService.getInstance().logIn({
        password,
        email,
      });

      setUser(data || null);
      router.push("/dashboard");
    } catch (error) {
      showNotification("error", error.message || "Error al hacer login");
      console.log(error.message || "Error al hacer login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.getInstance().logOut();
      setUser(null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
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
