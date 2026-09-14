"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/useAlert";
import { AuthService } from "@/services/AuthService";

/**
 * Banner visible solo cuando la sesión actual es una impersonación.
 * Deja claro "en nombre de quién" estás actuando y permite volver a tu
 * propia cuenta. Es el contrapeso de accountability de la impersonación.
 */
export function ImpersonationBanner() {
  const { user } = useAuth();
  const { showNotification } = useAlert();
  const [loading, setLoading] = useState(false);

  if (!user?.impersonator_email) return null;

  const handleStop = async () => {
    try {
      setLoading(true);
      await AuthService.getInstance().stopImpersonation();
      window.location.href = "/dashboard";
    } catch (error) {
      showNotification(
        "error",
        error.message || "No se pudo volver a tu cuenta",
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-amber-500 text-white text-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <UserCog className="w-4 h-4 shrink-0" />
        Estás actuando como <b>{user.email}</b> — impersonado por{" "}
        {user.impersonator_email}
      </span>
      <button
        onClick={handleStop}
        disabled={loading}
        className="underline font-semibold disabled:opacity-60"
      >
        {loading ? "Volviendo…" : "Volver a mi cuenta"}
      </button>
    </div>
  );
}
