import { useState, useCallback } from "react";
import { useAlert } from "@/context/useAlert";
import { URL, API_KEY } from "@/lib/constants/index";
import { FIELD_TO_API } from "@/constant/solicitudConstants";
import { EditableField } from "../Components/EditModal";
import { VistaCarpeta } from "../Components/CarpetasTabs";
import {
  getIdSolProv,
  getEstadoSolicitudPagado,
  getConciliacionInfo,
} from "../Components/helpers";

const editEndpoint = `${URL}/mia/pago_proveedor/edit`;

export function usePatchSolicitud(
  categoria: VistaCarpeta,
  clearSelection: () => void,
  handleFetchSolicitudesPago: () => void,
) {
  const { showNotification } = useAlert();

  const [editModal, setEditModal] = useState<{
    open: boolean;
    id_solicitud_proveedor: string;
    field: EditableField;
    value: string;
  }>({
    open: false,
    id_solicitud_proveedor: "",
    field: "costo_proveedor",
    value: "",
  });

  const patchSolicitudProveedor = useCallback(
    async (id_solicitud_proveedor: string, field: string, value: any) => {
      const apiField = (FIELD_TO_API as any)[field] ?? field;
      const needsNumber = ["costo_total", "monto_solicitado", "consolidado"].includes(apiField);
      const normalizedValue = needsNumber
        ? String(value).trim() === "" ? null : Number(value)
        : String(value).trim() === "" ? null : value;

      const payload = { id_solicitud_proveedor, [apiField]: normalizedValue };

      try {
        const resp = await fetch(editEndpoint, {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        showNotification("success", "Actualizado correctamente");
        return true;
      } catch (err: any) {
        console.error("❌ patch fail", err);
        showNotification("error", err?.message || "Error al actualizar");
        return false;
      }
    },
    [showNotification],
  );

  const patchSolicitudProveedorFields = useCallback(
    async (id_solicitud_proveedor: string, fields: Record<string, any>) => {
      const payload = { id_solicitud_proveedor, ...fields };

      try {
        const resp = await fetch(editEndpoint, {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(payload),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        showNotification("success", "Actualizado correctamente");
        return true;
      } catch (err: any) {
        console.error("❌ patch fail", err);
        showNotification("error", err?.message || "Error al actualizar");
        return false;
      }
    },
    [showNotification],
  );

  const openEditModal = useCallback(
    (raw: any, field: EditableField, currentValue: any) => {
      const idSolProv = getIdSolProv(raw);
      setEditModal({
        open: true,
        id_solicitud_proveedor: idSolProv,
        field,
        value: currentValue == null ? "" : String(currentValue),
      });
    },
    [],
  );

  const closeEditModal = useCallback(
    () => setEditModal((s) => ({ ...s, open: false })),
    [],
  );

  const saveEditModal = useCallback(async () => {
    const { id_solicitud_proveedor, field, value } = editModal;
    if (!id_solicitud_proveedor) return;
    const ok = await patchSolicitudProveedor(id_solicitud_proveedor, field, value);
    if (ok) {
      closeEditModal();
      handleFetchSolicitudesPago();
    }
  }, [editModal, patchSolicitudProveedor, closeEditModal, handleFetchSolicitudesPago]);

  const marcarSolicitudPagada = useCallback(
    async (raw: any) => {
      const idSolProv = getIdSolProv(raw);
      if (!idSolProv) return false;

      const estadoSolicitudPagado = getEstadoSolicitudPagado(raw, categoria);
      if (!estadoSolicitudPagado) {
        showNotification("error", "No se pudo determinar el estado_solicitud de pagado para esta solicitud.");
        return false;
      }

      const ok = await patchSolicitudProveedorFields(idSolProv, {
        estatus_pagos: "pagado",
        estado_solicitud: estadoSolicitudPagado,
      });

      if (ok) {
        clearSelection();
        handleFetchSolicitudesPago();
      }
      return ok;
    },
    [categoria, patchSolicitudProveedorFields, clearSelection, handleFetchSolicitudesPago, showNotification],
  );

  const cancelSolicitud = useCallback(
    async (id_solicitud_proveedor: string) => {
      const id = String(id_solicitud_proveedor ?? "").trim();
      if (!id) return false;

      const ok = await patchSolicitudProveedor(id, "estado_solicitud", "CANCELADA");
      if (ok) {
        clearSelection();
        handleFetchSolicitudesPago();
      }
      return ok;
    },
    [patchSolicitudProveedor, clearSelection, handleFetchSolicitudesPago],
  );

  const conciliarSolicitud = useCallback(
    async (raw: any) => {
      const idSolProv = getIdSolProv(raw);
      if (!idSolProv) return false;

      const { diferencia, totalPagado, totalFacturado, puedeConciliar } = getConciliacionInfo(raw);

      if (!puedeConciliar) {
        showNotification(
          "error",
          `No se puede conciliar. Diferencia actual: $${diferencia.toFixed(2)}. Pagado: $${totalPagado.toFixed(2)} / Facturado: $${totalFacturado.toFixed(2)}.`,
        );
        return false;
      }

      const okConfirm = window.confirm(
        `¿Conciliar la solicitud ${idSolProv}?\n\n` +
          `Pagado: $${totalPagado.toFixed(2)}\n` +
          `Facturado: $${totalFacturado.toFixed(2)}\n` +
          `Diferencia: $${diferencia.toFixed(2)}`,
      );
      if (!okConfirm) return false;

      const ok = await patchSolicitudProveedor(idSolProv, "consolidado", 1);
      if (ok) {
        clearSelection();
        handleFetchSolicitudesPago();
      }
      return ok;
    },
    [patchSolicitudProveedor, clearSelection, handleFetchSolicitudesPago, showNotification],
  );

  const cancelarDispersion = useCallback(
    async (id_solicitud_proveedor: string) => {
      const id = String(id_solicitud_proveedor ?? "").trim();
      if (!id) return false;
      try {
        const resp = await fetch(`${URL}/mia/pago_proveedor/cancelar_dispersion`, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          credentials: "include",
          body: JSON.stringify({ id_solicitud_proveedor: id }),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        showNotification("success", "Dispersión cancelada correctamente");
        clearSelection();
        handleFetchSolicitudesPago();
        return true;
      } catch (err: any) {
        showNotification("error", err?.message || "Error al cancelar dispersión");
        return false;
      }
    },
    [showNotification, clearSelection, handleFetchSolicitudesPago],
  );

  const marcarNotificadoPagado = useCallback(
    async (id_solicitud_proveedor: string, pagado: 0 | 1) => {
      const id = String(id_solicitud_proveedor ?? "").trim();
      if (!id) return false;

      const ok = await patchSolicitudProveedorFields(id, {
        estado_solicitud: "CANCELADA",
        pagado,
      });
      if (ok) {
        clearSelection();
        handleFetchSolicitudesPago();
      }
      return ok;
    },
    [patchSolicitudProveedorFields, clearSelection, handleFetchSolicitudesPago],
  );

  return {
    editModal,
    setEditModal,
    openEditModal,
    closeEditModal,
    saveEditModal,
    patchSolicitudProveedor,
    patchSolicitudProveedorFields,
    marcarSolicitudPagada,
    cancelSolicitud,
    conciliarSolicitud,
    marcarNotificadoPagado,
    cancelarDispersion,
  };
}
