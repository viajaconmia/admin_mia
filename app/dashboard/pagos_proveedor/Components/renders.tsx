"use client";

import React from "react";
import {
  Maximize2,
  CheckCircle2,
  Handshake,
  Eye,
  Ban,
  Download,
} from "lucide-react";

import MetodoPagoModal from "@/app/dashboard/pagos_proveedor/Components/MetodoPagoModal";
import { EditableField } from "./EditModal";
import { SolicitudProveedor } from "@/types";
import { formatDate } from "@/helpers/formater";
import {
  CFDI_USO_LABELS,
  CFDI_FORMA_PAGO_LABELS,
  CFDI_METODO_PAGO_LABELS,
  formatSatValue,
  normUpper,
  EPS,
  isZero,
  extractFacturas,
  openFacturaFile,
  downloadFacturaFile,
} from "@/helpers/cfdiHelpers";
import {
  getPaymentBadge,
  getStageBadge,
  getStatusBadge,
  getWhoCreateBadge,
} from "@/helpers/utils";

type DatosDispersion = {
  codigo_reservacion_hotel: string | null;
  costo_proveedor: number;
  id_solicitud: string | number | null;
  id_solicitud_proveedor: string | number | null;
  monto_solicitado: number;
  razon_social: string | null;
  cuenta_banco: string | null;
  rfc: string | null;
};

type SelectedSolicitudesMap = Record<string, SolicitudProveedor>;

type CreateSolicitudesRenderersParams = {
  categoria: string;
  selectedSolicitudesMap: SelectedSolicitudesMap;
  setSelectedSolicitudesMap: React.Dispatch<
    React.SetStateAction<SelectedSolicitudesMap>
  >;
  setSolicitud: React.Dispatch<React.SetStateAction<SolicitudProveedor[]>>;
  setDatosDispersion: React.Dispatch<React.SetStateAction<DatosDispersion[]>>;

  getIdSolProv: (raw: any, index?: number) => string;
  getFormaPago: (raw: any) => string;
  getSaldo: (raw: any) => number;
  isPagado: (raw: any) => boolean;
  hasPagosAsociados: (raw: any) => boolean;

  pagoTone3: (estado: string | null) => string;
  facturaTone: (estado: string) => string;

  openEditModal: (
    raw: any,
    field: EditableField,
    currentValue: any
  ) => void;

  patchSolicitudProveedor: (
    id_solicitud_proveedor: string,
    field: string,
    value: any
  ) => Promise<boolean>;

  handleFetchSolicitudesPago: () => void;
  marcarSolicitudPagada: (raw: any) => Promise<boolean>;
  cancelSolicitud: (id_solicitud_proveedor: string) => Promise<boolean>;
  conciliarSolicitud: (raw: any) => Promise<boolean>;
  marcarNotificadoPagado: (
    id_solicitud_proveedor: string,
    pagado: 0 | 1
  ) => Promise<boolean>;
  getEstadoSolicitudPagado: (raw: any, categoria: string) => string | null;
  getConciliacionInfo: (raw: any) => {
    totalPagado: number;
    totalFacturado: number;
    diferencia: number;
    puedeConciliar: boolean;
  };
};

const Pill = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "yellow" | "red" | "blue";
}) => {
  const tones: Record<string, string> = {
    gray: "bg-gray-50 text-gray-700 border-gray-200 shadow-sm",
    green: "bg-green-50 text-green-700 border-green-200 shadow-sm",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm",
    red: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone] || tones.gray}`}
    >
      {text}
    </span>
  );
};

const InlineMoneyEdit = ({
  id,
  value,
  disabled,
  onSave,
}: {
  id: string;
  value: number;
  disabled?: boolean;
  onSave: (next: number) => Promise<boolean>;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value ?? 0));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!editing) setDraft(String(value ?? 0));
  }, [value, editing]);

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) return;

    setSaving(true);
    const ok = await onSave(n);
    setSaving(false);

    if (ok) setEditing(false);
  };

  if (disabled) {
    return <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-md border border-transparent hover:border-slate-200"
        onClick={() => setEditing(true)}
        title="Editar monto solicitado"
      >
        <span>${Number(value || 0).toFixed(2)}</span>
        <span className="text-[10px] text-slate-500">✎</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        className="w-28 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-200"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={saving}
        autoFocus
      />
      <button
        type="button"
        className="text-xs px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        onClick={() => void commit()}
        disabled={saving}
      >
        OK
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
        onClick={() => setEditing(false)}
        disabled={saving}
      >
        Cancelar
      </button>
    </div>
  );
};

export function createSolicitudesRenderers({
  categoria,
  selectedSolicitudesMap,
  setSelectedSolicitudesMap,
  setSolicitud,
  setDatosDispersion,
  getIdSolProv,
  getFormaPago,
  getSaldo,
  isPagado,
  hasPagosAsociados,
  pagoTone3,
  facturaTone,
  openEditModal,
  patchSolicitudProveedor,
  handleFetchSolicitudesPago,
  marcarSolicitudPagada,
  cancelSolicitud,
  conciliarSolicitud,
  marcarNotificadoPagado,
  getEstadoSolicitudPagado,
  getConciliacionInfo,
}: CreateSolicitudesRenderersParams): Record<
  string,
  React.FC<{ value: any; item: any; index: number }>
> {
  return {
    comentario_sistema: ({ value }) => {
      const texto = String(value ?? "").trim();
      const preview = texto.length > 42 ? texto.slice(0, 42) + "…" : texto;

      return (
        <span className="text-xs text-sky-800" title={texto || "—"}>
          {texto ? preview : <span className="text-gray-400">—</span>}
        </span>
      );
    },

    seleccionar: ({ item, index }) => {
      const row = item as any;
      const raw: SolicitudProveedor | undefined = row?.item ?? row;

      const forma = getFormaPago(raw);
      const estadoSolicitud = normUpper(
        raw?.solicitud_proveedor?.estado_solicitud ?? ""
      );
      const isCancelada = estadoSolicitud.includes("CANCEL");

      if (forma !== "transfer") {
        return (
          <span
            className="text-gray-300"
            title="Solo Transferencia se puede seleccionar"
          >
            —
          </span>
        );
      }

      if (isCancelada) {
        return (
          <span className="text-gray-300" title="Solicitud cancelada">
            —
          </span>
        );
      }

      if (!raw) return null;

      const saldo = getSaldo(raw);
      const tieneDispersion = hasPagosAsociados(raw) || isZero(saldo);

      const key = String(
        (raw as any).id_solicitud ??
          (raw as any).id ??
          raw.solicitud_proveedor?.id_solicitud_proveedor ??
          index
      );

      const isSelected = !!selectedSolicitudesMap[key];

      if (categoria === "pagada") {
        return <span className="text-gray-300">—</span>;
      }

      if (tieneDispersion) {
        return (
          <input
            type="checkbox"
            checked={false}
            disabled
            title="Esta solicitud ya tiene pagos/dispersiones asociadas o saldo 0"
          />
        );
      }

      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            setSelectedSolicitudesMap((prev) => {
              const next = { ...prev };
              if (e.target.checked) next[key] = raw;
              else delete next[key];
              return next;
            });

            setSolicitud((prev) => {
              const rawId = (raw as any).id_solicitud ?? (raw as any).id;
              if (e.target.checked) return [...prev, raw];
              return prev.filter(
                (s) => ((s as any).id_solicitud ?? (s as any).id) !== rawId
              );
            });

            setDatosDispersion((prev) => {
              const idSolProv =
                raw.solicitud_proveedor?.id_solicitud_proveedor ?? null;
              const idSol =
                (raw as any).id_solicitud ?? (raw as any).id ?? null;

              if (e.target.checked) {
                const nuevo = {
                  codigo_reservacion_hotel:
                    (raw as any).codigo_reservacion_hotel ?? null,
                  costo_proveedor: Number((raw as any).costo_total) || 0,
                  id_solicitud: idSol,
                  id_solicitud_proveedor: idSolProv,
                  monto_solicitado:
                    Number(raw.solicitud_proveedor?.monto_solicitado) || 0,
                  razon_social: (raw as any).proveedor?.razon_social ?? null,
                  rfc: (raw as any).proveedor?.rfc ?? null,
                  cuenta_banco: (raw as any).cuenta_de_deposito ?? null,
                };

                const exists = prev.some(
                  (d) => d.id_solicitud === nuevo.id_solicitud
                );

                return exists ? prev : [...prev, nuevo];
              }

              return prev.filter((d) => d.id_solicitud !== idSol);
            });
          }}
        />
      );
    },

    id_solicitud_proveedor: ({ value }) => (
      <div className="px-1 py-0.5">
        <span className="font-mono text-xs" title={String(value)}>
          {String(value || "").slice(0, 10)}
        </span>
      </div>
    ),

    monto_solicitado: ({ value, item }) => {
      const raw = (item as any)?.item ?? item;
      const id = getIdSolProv(raw);

      return (
        <InlineMoneyEdit
          id={id}
          value={Number(value || 0)}
          onSave={async (next) =>
            patchSolicitudProveedor(id, "monto_solicitado", next)
          }
        />
      );
    },

    forma_pago_solicitada: ({ value }) => (
      <span className="font-semibold">
        {value
          ? String(value)
              .replace("transfer", "Transferencia")
              .replace("card", "Tarjeta")
              .replace("link", "Link")
              .replace("credit", "Ap Credito")
              .toUpperCase()
          : ""}
      </span>
    ),

    estatus_pagos: ({ value }) => (
      <Pill
        text={
          value
            ? String(value)
                .replace("enviado_a_pago", "Enviado a Pago")
                .replace("pagado", "Pagado")
                .toUpperCase()
            : "—"
        }
        tone={pagoTone3(value) as any}
      />
    ),

    notas_internas: ({ value, item }) => {
      const raw = (item as any)?.item ?? item;
      const texto = String(value ?? "").trim();
      const preview = texto.length > 40 ? texto.slice(0, 40) + "…" : texto;

      return (
        <button
          type="button"
          className="text-xs text-left text-slate-800 hover:text-blue-700 hover:underline"
          title={texto || "Editar notas internas"}
          onClick={() => openEditModal(raw, "notas_internas", texto)}
        >
          {texto ? preview : <span className="text-gray-400">—</span>}
        </button>
      );
    },

    comentarios_Ap: ({ value, item }) => {
      const raw = (item as any)?.item ?? item;
      const texto = String(value ?? "").trim();
      const preview = texto.length > 40 ? texto.slice(0, 40) + "…" : texto;

      return (
        <button
          type="button"
          className="text-xs text-left text-slate-800 hover:text-blue-700 hover:underline"
          title={texto || "Editar comentarios AP"}
          onClick={() => openEditModal(raw, "comentarios_Ap", texto)}
        >
          {texto ? preview : <span className="text-gray-400">—</span>}
        </button>
      );
    },

    uso_cfdi_factura: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {facturas.map((f, idx) => {
            const value = f?.uso_cfdi;
            return (
              <span
                key={`uso-cfdi-${idx}`}
                className="text-xs break-words whitespace-normal"
                title={value ? formatSatValue(value, CFDI_USO_LABELS) : "—"}
              >
                {value ? formatSatValue(value, CFDI_USO_LABELS) : "—"}
              </span>
            );
          })}
        </div>
      );
    },

    forma_pago_factura: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {facturas.map((f, idx) => {
            const value = f?.forma_pago;
            return (
              <span
                key={`forma-pago-${idx}`}
                className="text-xs break-words whitespace-normal"
                title={value ? formatSatValue(value, CFDI_FORMA_PAGO_LABELS) : "—"}
              >
                {value ? formatSatValue(value, CFDI_FORMA_PAGO_LABELS) : "—"}
              </span>
            );
          })}
        </div>
      );
    },

    metodo_pago_factura: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {facturas.map((f, idx) => {
            const value = f?.metodo_pago;
            return (
              <span
                key={`metodo-pago-${idx}`}
                className="text-xs break-words whitespace-normal"
                title={value ? formatSatValue(value, CFDI_METODO_PAGO_LABELS) : "—"}
              >
                {value ? formatSatValue(value, CFDI_METODO_PAGO_LABELS) : "—"}
              </span>
            );
          })}
        </div>
      );
    },

    moneda_factura: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {facturas.map((f, idx) => {
            const value = String(f?.moneda ?? "").trim().toUpperCase();
            return (
              <span
                key={`moneda-${idx}`}
                className="text-xs break-words whitespace-normal"
                title={value || "—"}
              >
                {value || "—"}
              </span>
            );
          })}
        </div>
      );
    },

    facturas_acciones: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-2">
          {facturas.map((factura, idx) => {
            const pdfUrl = factura?.url_pdf || null;
            const xmlUrl = factura?.url_xml || null;
            const viewUrl = pdfUrl || xmlUrl;
            const downloadUrl = pdfUrl || xmlUrl;

            const uuid =
              factura?.uuid_factura ||
              factura?.uuid_cfdi ||
              factura?.uuid ||
              `factura_${idx + 1}`;

            const extension = pdfUrl ? "pdf" : xmlUrl ? "xml" : "file";

            return (
              <div key={`${uuid}-${idx}`} className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-slate-600">
                  {String(uuid).slice(0, 8)}...
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!viewUrl}
                  onClick={() => openFacturaFile(viewUrl)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!downloadUrl}
                  onClick={() =>
                    downloadFacturaFile(downloadUrl, `${uuid}.${extension}`)
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            );
          })}
        </div>
      );
    },

    UUID: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const facturas = extractFacturas(raw);

      if (!facturas.length) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col gap-1">
          {facturas.map((f, idx) => {
            const uuid =
              f?.uuid_factura ||
              f?.uuid_cfdi ||
              f?.uuid ||
              `factura_${idx + 1}`;

            return (
              <span
                key={`${uuid}-${idx}`}
                className="font-mono text-xs break-all whitespace-normal"
              >
                CFDI: {String(uuid)}
              </span>
            );
          })}
        </div>
      );
    },

    metodo_de_pago: ({ value }) => getPaymentBadge(value),
    reservante: ({ value }) => getWhoCreateBadge(value),
    etapa_reservacion: ({ value }) => getStageBadge(value),
    estado: ({ value }) => getStatusBadge(value),

    estado_pago: ({ value }) => (
      <Pill
        text={(value ?? "—")
          .replace("pagado", "Pagado")
          .replace("enviado_a_pago", "Enviado a Pago")
          .toUpperCase()}
        tone={pagoTone3(value) as any}
      />
    ),

    creado: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
    check_in: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
    check_out: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),

      fecha_pagado: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),


    estado_factura_proveedor: ({ value }) => (
      <Pill
        text={(value || "—")
          .replace("facturado", "Facturado")
          .replace("parcial", "Parcial")
          .replace("pendiente", "Pendiente")
          .toUpperCase()}
        tone={facturaTone((value || "").toLowerCase()) as any}
      />
    ),

    monto_por_facturar: ({ value }) => {
      const n = Number(value || 0);
      return (
        <span
          className={
            n <= EPS
              ? "text-green-700 font-semibold"
              : "text-amber-700 font-semibold"
          }
        >
          ${n.toFixed(2)}
        </span>
      );
    },
markup: ({ value }) => {
      const n = Number(value || 0);
      return (
        <span
          className={
            n <= EPS
              ? "text-green-700 font-semibold"
              : "text-amber-700 font-semibold"
          }
        >
          ${n.toFixed(2)}
        </span>
      );
    },
    acciones: ({ item }) => {
      const row = item as any;
      const raw = row?.item ?? row;

      const idSolProv = getIdSolProv(raw);
      const forma = getFormaPago(raw);
      const pagado = isPagado(raw);

      if (categoria === "canceladas") return null;

      const estadoSolicitud = normUpper(
        raw?.solicitud_proveedor?.estado_solicitud ??
          row?.estado_solicitud ??
          ""
      );

      const isCancelada = estadoSolicitud.includes("CANCEL");
      const cancelDisabled = pagado || isCancelada || categoria === "pagada";

      if (estadoSolicitud.includes("CUPON") && categoria !== "ap_credito") {
        return null;
      }

      const costoActual = Number((raw as any)?.costo_total ?? 0) || 0;

      return (
        <div className="flex items-center gap-2">
          {categoria === "ap_credito" && (
            <MetodoPagoModal
              idSolProv={idSolProv}
              currentMethod={forma}
              currentCardId={raw?.solicitud_proveedor?.id_tarjeta_solicitada ?? null}
              onSetMethod={async (next) => {
                const ok = await patchSolicitudProveedor(
                  idSolProv,
                  "forma_pago_solicitada",
                  next
                );
                if (ok) handleFetchSolicitudesPago();
                return ok;
              }}
              onSetCard={async ({ id_tarjeta_solicitada }) => {
                const ok = await patchSolicitudProveedor(
                  idSolProv,
                  "id_tarjeta_solicitada",
                  id_tarjeta_solicitada
                );
                if (ok) handleFetchSolicitudesPago();
                return ok;
              }}
            />
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            onClick={() => openEditModal(raw, "costo_proveedor", costoActual)}
            title="Editar costo proveedor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Costo</span>
          </button>

          {categoria === "notificados" ? (
            <select
              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-sky-200 bg-sky-50 text-sky-800 shadow-sm outline-none focus:ring-2 focus:ring-sky-300"
              defaultValue=""
              onChange={async (e) => {
                const value = e.target.value;
                if (!value) return;

                const pagadoValue = value === "1" ? 1 : 0;

                const okConfirm = window.confirm(
                  `¿Seguro que deseas actualizar la solicitud ${idSolProv}?\n\n` +
                    `Se enviará:\n` +
                    `- estado_solicitud: CANCELADA\n` +
                    `- pagado: ${pagadoValue}`
                );

                if (!okConfirm) {
                  e.target.value = "";
                  return;
                }

                const ok = await marcarNotificadoPagado(
                  idSolProv,
                  pagadoValue as 0 | 1
                );

                if (!ok) e.target.value = "";
              }}
            >
              <option value="">Pagado / No pagado</option>
              <option value="1">Pagado</option>
              <option value="0">No pagado</option>
            </select>
          ) : (
            <button
              type="button"
              className={[
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-sm",
                cancelDisabled
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300",
              ].join(" ")}
              disabled={cancelDisabled}
              onClick={async () => {
                const okConfirm = window.confirm(
                  `¿Seguro que deseas CANCELAR la solicitud ${idSolProv}?`
                );
                if (!okConfirm) return;

                await cancelSolicitud(idSolProv);
              }}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          )}

          {forma !== "transfer" &&
            categoria !== "ap_credito" &&
            categoria !== "notificados" && (
              <button
                type="button"
                className={[
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-sm",
                  pagado
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
                ].join(" ")}
                disabled={pagado}
                onClick={async () => {
                  if (pagado) return;

                  const estadoSolicitudPagado =
                    getEstadoSolicitudPagado(raw, categoria);

                  const ok = window.confirm(
                    `¿Marcar como PAGADO la solicitud ${idSolProv}?\n\n` +
                      `Se enviará:\n` +
                      `- estatus_pagos: pagado\n` +
                      `- estado_solicitud: ${estadoSolicitudPagado ?? "N/D"}`
                  );
                  if (!ok) return;

                  await marcarSolicitudPagada(raw);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pagado</span>
              </button>
            )}

          {(() => {
            const consolidado = Number(
              (raw as any)?.consolidado ??
                (raw as any)?.estatus_conciliado ??
                (raw as any)?.conciliado ??
                0
            );

            const { diferencia, totalPagado, totalFacturado, puedeConciliar } =
              getConciliacionInfo(raw);

            if (!pagado) return null;

            const disabled = consolidado === 1 || !puedeConciliar;

            return (
              <button
                type="button"
                className={[
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-sm",
                  disabled
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300",
                ].join(" ")}
                disabled={disabled}
                onClick={async () => {
                  if (disabled) return;
                  await conciliarSolicitud(raw);
                }}
                title={
                  consolidado === 1
                    ? "Ya está conciliada"
                    : !puedeConciliar
                      ? `No se puede conciliar. Diferencia actual: $${diferencia.toFixed(
                          2
                        )} (pagado: $${totalPagado.toFixed(
                          2
                        )}, facturado: $${totalFacturado.toFixed(2)})`
                      : "Conciliar (marca consolidado=1)"
                }
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Conciliar</span>
              </button>
            );
          })()}
        </div>
      );
    },
  };
}