// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtenemos tanto `isAuthenticated` como el crucial estado `loading`.
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 2. Esperamos a que la carga inicial termine. Si no, no hacemos nada.
    if (loading) {
      return;
    }

    // 3. Solo cuando la carga ha terminado, verificamos si está autenticado.
    if (!isAuthenticated) {
      router.push("/login");
    }

    // 4. El useEffect ahora depende de `loading` y `isAuthenticated`.
  }, [isAuthenticated, loading, router]);

  // 5. Mientras carga, o si no está autenticado (y la redirección está en curso),
  // mostramos un mensaje de carga. Esto previene cualquier parpadeo.
  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Verificando tu sesión...</p>
      </div>
    );
  }

  // 6. Solo si la carga ha terminado y el usuario está autenticado,
  // mostramos el contenido protegido. Ya no necesitamos el estado `isVerified`.
  return <>{children}</>;
}
