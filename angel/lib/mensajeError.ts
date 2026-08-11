import { ApiError } from "@/angel/services/apiClient";

// Algunos endpoints de pago_proveedor/conciliación devuelven { error, details }
// en vez de { message, data } en sus respuestas de error, así que apiClient no
// logra extraer el mensaje real del backend (ApiError.message cae al genérico
// "HTTP error: status: xxx"). Lo recuperamos desde el body crudo.
export function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const raw = err.response as unknown as {
      error?: string;
      details?: string;
    } | null;
    return raw?.error || raw?.details || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
