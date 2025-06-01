"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        login(email, password);
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido de vuelta",
        });
      } else {
        register(email, name, password);
        toast({
          title: "Registro exitoso",
          description: "Cuenta creada correctamente",
        });
      }
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Credenciales inválidas",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isLogin ? "Iniciar Sesión" : "Registrarse"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {isLogin ? "Ingresa a tu cuenta" : "Crea una nueva cuenta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isLogin ? "Iniciar Sesión" : "Registrarse"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Demo:</strong> demo@example.com / demo123
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
