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
  const [impsan, setImpsan] = useState("");
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
        setImpsan(data?.impsan ?? "");
      })
      .catch(() => {
        setFactura(null);
        setPropina("");
        setImpsan("");
      })
      .finally(() => setLoading(false));
  }, []);

  const guardarPropina = useCallback(() => {
    if (!factura) return;
    const montoPropina = Number(propina || 0);
    const montoImpsan = Number(impsan || 0);
    if (Number.isNaN(montoPropina) || montoPropina < 0) {
      error("La propina debe ser un número mayor o igual a 0");
      return;
    }
    if (Number.isNaN(montoImpsan) || montoImpsan < 0) {
      error("El impsan debe ser un número mayor o igual a 0");
      return;
    }
    setGuardandoPropina(true);
    conciliacionService
      .editarPropinaImpsan(factura.id_factura_proveedor, {
        propina: montoPropina,
        impsan: montoImpsan,
      })
      .then(() => cargar(factura.uuid_cfdi))
      .then(() => success("Propina e impsan actualizados correctamente"))
      .catch((err) => error(mensajeError(err, "Error al guardar la propina")))
      .finally(() => setGuardandoPropina(false));
  }, [factura, propina, impsan, cargar, error, success]);

  const reset = useCallback(() => {
    setFactura(null);
    setLoading(false);
    setPropina("");
    setImpsan("");
    setGuardandoPropina(false);
  }, []);

  return {
    factura,
    loading,
    propina,
    setPropina,
    impsan,
    setImpsan,
    guardandoPropina,
    cargar,
    guardarPropina,
    reset,
  };
}
