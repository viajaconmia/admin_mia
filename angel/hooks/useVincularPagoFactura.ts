"use client";

import { useCallback, useState } from "react";
import { useAlert } from "@/context/useAlert";
import { ApiError } from "@/angel/services/apiClient";
import { facturasService } from "@/angel/services/facturas";

type UseVincularPagoFacturaParams = {
  onVinculado?: () => void;
};

// Cliente interno: se expone el error completo del backend como JSON legible.
const getErrorJson = (err: unknown) => {
  const detalle =
    err instanceof ApiError
      ? { status: err.status, message: err.message, response: err.response }
      : err instanceof Error
        ? { message: err.message }
        : err;
  try {
    return JSON.stringify(detalle, null, 2);
  } catch {
    return "No se pudo vincular el pago a la factura";
  }
};

export function useVincularPagoFactura({
  onVinculado,
}: UseVincularPagoFacturaParams = {}) {
  const { success } = useAlert();
  const [loading, setLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const vincular = useCallback(
    async (rawId: string, uuidFactura: string) => {
      setLoading(true);
      setErrorMensaje(null);
      try {
        const { data } = await facturasService.vincularPagoFactura({
          raw_id: rawId,
          uuid_factura: uuidFactura,
        });
        success(
          `Pago vinculado: se aplicaron $${data?.monto_aplicado ?? 0} (${data?.items_facturados ?? 0} reservas)`,
        );
        onVinculado?.();
        return true;
      } catch (err: unknown) {
        setErrorMensaje(getErrorJson(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [onVinculado, success],
  );

  const limpiarError = useCallback(() => setErrorMensaje(null), []);

  return { vincular, loading, errorMensaje, limpiarError };
}
