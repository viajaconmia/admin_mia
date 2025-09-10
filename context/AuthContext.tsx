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

export type User = {
  username: string;
  id: string;
  token: string;
  permisos: string[];
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // <-- AÑADIR ESTO
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

  useEffect(() => {
    console.log("GALLETAS", document.cookie);
    const user = localStorage.getItem("session_token");
    // if (token) {
    //   setUser();
    // }
    setLoading(false); // La verificación ha terminado
  }, []);

  const login = async (email: string, password: string) => {
    const { message, data } = await AuthService.getInstance().logIn({
      password,
      email,
    });
    console.log(data);
    setUser(data);
    router.push("/dashboard");
    return { message };
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
