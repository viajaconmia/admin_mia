import { useState, useMemo, useCallback, useEffect } from "react";
import { SolicitudProveedor } from "@/types";
import { normUpper, hasPagosAsociados, isZero } from "@/helpers/cfdiHelpers";
import { VistaCarpeta } from "../Components/CarpetasTabs";
import { getFormaPago, getSaldo, isPagado } from "../Components/helpers";
import { DatosDispersion } from "../Components/types";

type SelectedSolicitudesMap = Record<string, SolicitudProveedor>;

export function useSeleccion(registrosVisibles: any[], categoria: VistaCarpeta) {
  const [solicitud, setSolicitud] = useState<SolicitudProveedor[]>([]);
  const [selectedSolicitudesMap, setSelectedSolicitudesMap] = useState<SelectedSolicitudesMap>({});
  const [datosDispersion, setDatosDispersion] = useState<DatosDispersion[]>([]);

  useEffect(() => {
    setSelectedSolicitudesMap({});
    setSolicitud([]);
    setDatosDispersion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  const clearSelection = useCallback(() => {
    setSelectedSolicitudesMap({});
    setSolicitud([]);
    setDatosDispersion([]);
  }, []);

  const seleccionables = useMemo(() => {
    return registrosVisibles.filter((row) => {
      const raw = (row as any)?.item ?? row;
      const forma = getFormaPago(raw);
      const estadoSolicitud = normUpper(raw?.solicitud_proveedor?.estado_solicitud ?? "");
      const isCancelada = estadoSolicitud.includes("CANCEL");
      const saldo = getSaldo(raw);
      const tieneDispersion = hasPagosAsociados(raw) || isZero(saldo);
      return (
        forma === "transfer" &&
        !isCancelada &&
        !tieneDispersion &&
        !isPagado(raw) &&
        categoria !== "pagada"
      );
    });
  }, [registrosVisibles, categoria]);

  const allSelected =
    seleccionables.length > 0 &&
    seleccionables.every((row) => {
      const raw = (row as any)?.item ?? row;
      const key = String(
        (raw as any).id_solicitud ??
          (raw as any).id ??
          raw?.solicitud_proveedor?.id_solicitud_proveedor ??
          "",
      );
      return !!selectedSolicitudesMap[key];
    });

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
      return;
    }

    const nextMap: SelectedSolicitudesMap = {};
    const nextSolicitud: SolicitudProveedor[] = [];
    const nextDispersion: DatosDispersion[] = [];

    seleccionables.forEach((row, idx) => {
      const raw = (row as any)?.item ?? row;
      const key = String(
        (raw as any).id_solicitud ??
          (raw as any).id ??
          raw?.solicitud_proveedor?.id_solicitud_proveedor ??
          idx,
      );
      nextMap[key] = raw;
      nextSolicitud.push(raw);

      const idSolProv = raw.solicitud_proveedor?.id_solicitud_proveedor ?? null;
      const idSol = (raw as any).id_solicitud ?? (raw as any).id ?? null;
      const exists = nextDispersion.some((d) => d.id_solicitud === idSol);
      if (!exists) {
        nextDispersion.push({
          codigo_reservacion_hotel: (raw as any).codigo_reservacion_hotel ?? null,
          costo_proveedor: Number((raw as any).costo_total) || 0,
          id_solicitud: idSol,
          id_solicitud_proveedor: idSolProv,
          monto_solicitado: Number(raw.solicitud_proveedor?.monto_solicitado) || 0,
          razon_social: (raw as any).proveedor?.razon_social ?? null,
          rfc: (raw as any).proveedor?.rfc ?? null,
          cuenta_banco: (raw as any).cuenta_de_deposito ?? null,
        });
      }
    });

    setSelectedSolicitudesMap(nextMap);
    setSolicitud(nextSolicitud);
    setDatosDispersion(nextDispersion);
  }, [allSelected, seleccionables, clearSelection]);

  return {
    solicitud,
    setSolicitud,
    selectedSolicitudesMap,
    setSelectedSolicitudesMap,
    datosDispersion,
    setDatosDispersion,
    clearSelection,
    seleccionables,
    allSelected,
    handleSelectAll,
  };
}
