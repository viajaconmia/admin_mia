"use client";
import { useEffect, useState } from "react";
import {
  DateRenderer,
  GetBadgeRenderer,
  MonoRenderer,
  PrecioRenderer,
  TextRenderer,
} from "@/v3/atom/TableItemsComponent";
import type { CellRenderer } from "@/angel/components/atoms/TableCore";
import type { AgenteReportRow } from "@/angel/services/facturas/agentesReport";
import type { CampoEditableFactura } from "@/angel/services/facturas";
import type { CampoEditableBooking } from "@/angel/services/reservas";

export type ColumnaDisponible = { key: string; label: string };

/** Set y orden de columnas por default — igual al `customColumns` que usa hoy
 * la pantalla legacy (app/dashboard/detalles_facturas/page.tsx), más los 6
 * campos editables de bookings. Alimenta el orden inicial de `useColumnConfig`
 * y la lista que muestra `ColumnConfigPanel`. */
export const AGENTES_REPORT_COLUMNAS_DEFAULT: ColumnaDisponible[] = [
  { key: "viajero", label: "Viajero" },
  { key: "numero_empleado", label: "Número empleado" },
  { key: "host", label: "Hotel" },
  { key: "tipo_habitacion", label: "Tipo de habitación" },
  { key: "chin", label: "Check-in" },
  { key: "chout", label: "Check-out" },
  { key: "noches", label: "Noches" },
  { key: "tarifa_por_noche", label: "Tarifa por noche" },
  { key: "monto_total_por_estancia", label: "Monto total estancia" },
  { key: "fecha_emision", label: "Fecha de emisión" },
  { key: "estado_reserva", label: "Estado" },
  { key: "codigo_confirmacion", label: "Código confirmación" },
  { key: "folio", label: "Folio" },
  { key: "uuid_factura", label: "UUID factura" },
  { key: "booking_subtotal", label: "Subtotal" },
  { key: "booking_iva", label: "IVA" },
  { key: "booking_total", label: "Total" },
  { key: "ticket_zoho", label: "Ticket Zoho" },
  { key: "portal", label: "Portal" },
  { key: "orden_compra", label: "Orden de compra" },
  { key: "cliente_solicitante_reserva", label: "Cliente solicitante" },
  { key: "fecha_pago_ar", label: "Fecha pago AR" },
  { key: "estatus_pago_ar", label: "Estatus pago AR" },
  { key: "uuid_crp", label: "UUID CRP" },
];

type CampoConfig = { maxLength?: number; type?: "text" | "date" };

const CAMPO_CONFIG: Record<CampoEditableBooking, CampoConfig> = {
  ticket_zoho: { maxLength: 50 },
  portal: { maxLength: 100 },
  orden_compra: { maxLength: 100 },
  cliente_solicitante_reserva: { maxLength: 100 },
  fecha_pago_ar: { type: "date" },
  estatus_pago_ar: { maxLength: 100 },
};

const CAMPO_CONFIG_FACTURA: Record<CampoEditableFactura, CampoConfig> = {
  uuid_crp: { maxLength: 50 },
};

export type OnEditarCampoBooking = (
  id_booking: string,
  campo: CampoEditableBooking,
  valor: string,
) => Promise<boolean>;

export type OnEditarCampoFactura = (
  id_factura: string,
  campo: CampoEditableFactura,
  valor: string,
) => Promise<boolean>;

/**
 * Celda editable: el valor se ve como texto plano hasta que se le da foco.
 * Al enfocarla aparece el botón "Guardar" (solo si el valor cambió), así el
 * PATCH se dispara por acción explícita y no en cada tecla. Blur sin guardar
 * descarta el draft.
 */
function EditableTextCell({
  value,
  maxLength,
  type = "text",
  onGuardar,
}: {
  value: string | null | undefined;
  maxLength?: number;
  type?: "text" | "date";
  onGuardar: (nuevoValor: string) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!editando) setDraft(value ?? "");
  }, [value, editando]);

  const dirty = draft !== (value ?? "");

  const guardar = async () => {
    if (!dirty || guardando) return;
    setGuardando(true);
    const ok = await onGuardar(draft);
    setGuardando(false);
    if (ok) setEditando(false);
  };

  const cancelar = () => {
    setDraft(value ?? "");
    setEditando(false);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={draft}
        maxLength={maxLength}
        disabled={guardando}
        onFocus={() => setEditando(true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!guardando) cancelar();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") cancelar();
        }}
        className={`${type === "date" ? "w-36" : "w-32"} rounded px-1.5 py-0.5 text-xs text-gray-800 outline-none ${
          editando
            ? "border border-blue-300 bg-white"
            : "border border-transparent bg-transparent"
        }`}
      />
      {editando && dirty && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={guardar}
          disabled={guardando}
          className="shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? "..." : "Guardar"}
        </button>
      )}
    </div>
  );
}

function campoEditableRenderer(
  campo: CampoEditableBooking,
  onEditarCampo: OnEditarCampoBooking,
): CellRenderer {
  const { maxLength, type } = CAMPO_CONFIG[campo];
  return ({ value, row }) => {
    const fila = row as AgenteReportRow | undefined;
    if (!fila?.id_booking) return <TextRenderer value={value as string} />;
    return (
      <EditableTextCell
        value={value as string | null}
        maxLength={maxLength}
        type={type}
        onGuardar={(nuevoValor) =>
          onEditarCampo(fila.id_booking, campo, nuevoValor)
        }
      />
    );
  };
}

// La edición de estos campos va directo a la factura (PATCH /v2/mia/factura/:id_factura),
// no al booking — la fila necesita id_factura, no id_booking.
function campoEditableFacturaRenderer(
  campo: CampoEditableFactura,
  onEditarCampo: OnEditarCampoFactura,
): CellRenderer {
  const { maxLength, type } = CAMPO_CONFIG_FACTURA[campo];
  return ({ value, row }) => {
    const fila = row as AgenteReportRow | undefined;
    if (!fila?.id_factura) return <TextRenderer value={value as string} />;
    return (
      <EditableTextCell
        value={value as string | null}
        maxLength={maxLength}
        type={type}
        onGuardar={(nuevoValor) =>
          onEditarCampo(fila.id_factura as string, campo, nuevoValor)
        }
      />
    );
  };
}

export function createAgentesReportRenderers(
  onEditarCampo: OnEditarCampoBooking,
  onEditarCampoFactura: OnEditarCampoFactura,
): Partial<Record<string, CellRenderer>> {
  return {
    chin: DateRenderer,
    chout: DateRenderer,
    fecha_emision: DateRenderer,
    viajero: TextRenderer,
    host: TextRenderer,
    codigo_empleado: TextRenderer,
    numero_empleado: TextRenderer,
    tarifa_por_noche: PrecioRenderer,
    monto_total_por_estancia: PrecioRenderer,
    booking_subtotal: PrecioRenderer,
    booking_iva: PrecioRenderer,
    booking_total: PrecioRenderer,
    folio: MonoRenderer,
    codigo_confirmacion: MonoRenderer,
    uuid_factura: MonoRenderer,
    tipo_habitacion: GetBadgeRenderer({}, undefined, "bg-gray-100 text-gray-700"),
    estado_reserva: GetBadgeRenderer({
      confirmada: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      completada: "bg-blue-100 text-blue-800",
    }),
    ticket_zoho: campoEditableRenderer("ticket_zoho", onEditarCampo),
    portal: campoEditableRenderer("portal", onEditarCampo),
    orden_compra: campoEditableRenderer("orden_compra", onEditarCampo),
    cliente_solicitante_reserva: campoEditableRenderer(
      "cliente_solicitante_reserva",
      onEditarCampo,
    ),
    fecha_pago_ar: campoEditableRenderer("fecha_pago_ar", onEditarCampo),
    estatus_pago_ar: campoEditableRenderer("estatus_pago_ar", onEditarCampo),
    uuid_crp: campoEditableFacturaRenderer("uuid_crp", onEditarCampoFactura),
  };
}
