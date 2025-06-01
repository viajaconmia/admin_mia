"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  register: (email: string, name: string, password: string) => void;
  logout: () => void;
}

// Usuario de prueba predefinido
const DEMO_USER = {
  email: "demo@example.com",
  password: "demo123",
  name: "Usuario Demo",
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Verificar si hay un usuario en localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, password: string) => {
    // Simular autenticación con el usuario demo
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const loggedUser = { email: DEMO_USER.email, name: DEMO_USER.name };
      setUser(loggedUser);
      localStorage.setItem("user", JSON.stringify(loggedUser));
    } else {
      throw new Error("Credenciales inválidas");
    }
  };

  const register = (email: string, name: string, password: string) => {
    // Simular registro
    const newUser = { email, name };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
