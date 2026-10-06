// Hermano de angel/lib/mensajeError.ts para los lugares que todavía hacen
// fetch() directo (no pasan por apiClient). Mismo problema: algunos
// endpoints (ej. /mia/factura/AsignarFacturaPagos) responden en error con
// { error, details } en vez de { message, data }. Extrae el mensaje real
// del body en vez de perderlo detrás de un texto genérico.
export async function parseFetchErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    return fallback;
  }

  if (typeof body?.error === "string") return body.error;
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.error?.message === "string") return body.error.message;

  return fallback;
}
