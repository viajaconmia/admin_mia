"use client";
import { useCallback, useState } from "react";
import {
  conciliacionService,
  type FacturaProveedorDetalle,
} from "@/angel/services/conciliacion";
import { useAlert } from "@/context/useAlert";
import { mensajeError } from "@/angel/lib/mensajeError";

export function useFacturaProveedor() {
  const [factura, setFactura] = useState<FacturaProveedorDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [propina, setPropina] = useState("");
  const [guardandoPropina, setGuardandoPropina] = useState(false);
  const { error, success } = useAlert();

  const cargar = useCallback((uuid_factura: string) => {
    if (!uuid_factura) return;
    setLoading(true);
    conciliacionService
      .getFacturaByUuid(uuid_factura)
      .then(({ data }) => {
        setFactura(data);
        setPropina(data?.propina ?? "");
      })
      .catch(() => {
        setFactura(null);
        setPropina("");
      })
      .finally(() => setLoading(false));
  }, []);

  const guardarPropina = useCallback(() => {
    if (!factura) return;
    const monto = Number(propina);
    if (!propina || Number.isNaN(monto) || monto < 0) {
      error("La propina debe ser un número mayor o igual a 0");
      return;
    }
    setGuardandoPropina(true);
    conciliacionService
      .editarPropina(factura.id_factura, monto)
      .then(({ data }) => {
        const propinaGuardada = String(data?.propina ?? monto);
        setFactura((prev) =>
          prev ? { ...prev, propina: propinaGuardada } : prev,
        );
        setPropina(propinaGuardada);
        success("Propina actualizada correctamente");
      })
      .catch((err) => error(mensajeError(err, "Error al guardar la propina")))
      .finally(() => setGuardandoPropina(false));
  }, [factura, propina, error, success]);

  const reset = useCallback(() => {
    setFactura(null);
    setLoading(false);
    setPropina("");
    setGuardandoPropina(false);
  }, []);

  return {
    factura,
    loading,
    propina,
    setPropina,
    guardandoPropina,
    cargar,
    guardarPropina,
    reset,
  };
}
