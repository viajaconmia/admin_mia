"use client";
import { useCallback, useState } from "react";
import {
  conciliacionService,
  type FacturaProveedorDetalle,
} from "@/angel/services/conciliacion";

export function useFacturaProveedor() {
  const [factura, setFactura] = useState<FacturaProveedorDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [propina, setPropina] = useState("");

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

  const reset = useCallback(() => {
    setFactura(null);
    setLoading(false);
    setPropina("");
  }, []);

  return { factura, loading, propina, setPropina, cargar, reset };
}
