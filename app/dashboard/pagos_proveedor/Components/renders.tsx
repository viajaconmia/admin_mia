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

import MetodoPagoModal from "@/app/dashboard/pagos_proveedor/Components/PaymentMethodSelector";
import { ReasignarPagoModal } from "./ReasignarPagoModal";
import { GenerarSaldoAFavorModal } from "./GenerarSaldoAFavorModal";
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

  openEditModal: (raw: any, field: EditableField, currentValue: any) => void;

  patchSolicitudProveedor: (
    id_solicitud_proveedor: string,
    field: string,
    value: any,
  ) => Promise<boolean>;

  patchSolicitudProveedorFields: (
    id_solicitud_proveedor: string,
    fields: Record<string, any>,
  ) => Promise<boolean>;

  handleFetchSolicitudesPago: () => void;
  marcarSolicitudPagada: (raw: any) => Promise<boolean>;
  cancelSolicitud: (id_solicitud_proveedor: string) => Promise<boolean>;
  conciliarSolicitud: (raw: any) => Promise<boolean>;
  marcarNotificadoPagado: (
    id_solicitud_proveedor: string,
    pagado: 0 | 1,
  ) => Promise<boolean>;
  getEstadoSolicitudPagado: (raw: any, categoria: string) => string | null;
  getConciliacionInfo: (raw: any) => {
    totalPagado: number;
    totalFacturado: number;
    diferencia: number;
    puedeConciliar: boolean;
  };
  onOpenDetalle: (id_solicitud_proveedor: string) => void;
  cancelarDispersion: (id_solicitud_proveedor: string) => Promise<boolean>;
};

const fmtMoney = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

const TruncatedComment = ({ texto }: { texto: string }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!texto) return <span className="text-gray-400">—</span>;

  const needsTruncation = texto.length > 10;
  const short = needsTruncation ? texto.slice(0, 10) + "…" : texto;

  return (
    <div className="relative" style={{ width: 90, maxWidth: 90, overflow: "visible" }}>
      <span
        className="block text-xs text-slate-800"
        style={{ width: 90, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={texto}
      >
        {short}
      </span>
      {needsTruncation && (
        <>
          <button
            type="button"
            className="text-[10px] text-blue-600 hover:underline whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            {expanded ? "Ocultar" : "Ver completo"}
          </button>
          {expanded && (
            <div
              className="absolute z-50 mt-1 rounded-md border border-slate-200 bg-white shadow-lg p-2"
              style={{ left: 0, top: "100%", width: 220, minWidth: 220 }}
            >
              <p className="text-xs text-slate-800 break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                {texto}
              </p>
              <button
                type="button"
                className="mt-1 text-[10px] text-blue-600 hover:underline"
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              >
                Ocultar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const InlineMoneyEdit = ({
  value,
  disabled,
  onSave,
}: {
  value: number;
  disabled?: boolean;
  onSave: (next: number, comentario: string) => Promise<boolean>;
}) => {
  const [phase, setPhase] = React.useState<"idle" | "monto" | "comentario">("idle");
  const [draft, setDraft] = React.useState(String(value ?? 0));
  const [comentario, setComentario] = React.useState("");
  const [comentarioError, setComentarioError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (phase === "idle") {
      setDraft(String(value ?? 0));
      setComentario("");
      setComentarioError(false);
    }
  }, [value, phase]);

  const goToComentario = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) return;
    setPhase("comentario");
    setComentario("");
    setComentarioError(false);
  };

  const commit = async () => {
    if (!comentario.trim()) {
      setComentarioError(true);
      return;
    }
    const n = Number(draft);
    if (!Number.isFinite(n)) return;

    setSaving(true);
    const ok = await onSave(n, comentario.trim());
    setSaving(false);

    if (ok) setPhase("idle");
  };

  const cancel = () => {
    setPhase("idle");
    setComentario("");
    setComentarioError(false);
  };

  if (disabled) {
    return <span title={String(value)}>{fmtMoney(Number(value || 0))}</span>;
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-md border border-transparent hover:border-slate-200"
        onClick={() => setPhase("monto")}
        title="Editar monto solicitado"
      >
        <span>{fmtMoney(Number(value || 0))}</span>
        <span className="text-[10px] text-slate-500">✎</span>
      </button>
    );
  }

  if (phase === "monto") {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          className="w-28 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-200"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToComentario();
            if (e.key === "Escape") cancel();
          }}
          autoFocus
        />
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          onClick={goToComentario}
        >
          Siguiente
        </button>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
          onClick={cancel}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[220px]">
      <span className="text-[10px] text-slate-500">
        Nuevo monto: <strong>{fmtMoney(Number(draft))}</strong>
      </span>
      <textarea
        rows={2}
        placeholder="Comentario obligatorio para el ajuste de monto..."
        className={`w-full border rounded-md px-2 py-1 text-xs outline-none focus:ring-2 resize-none ${
          comentarioError
            ? "border-red-400 focus:ring-red-200"
            : "border-slate-200 focus:ring-blue-200"
        }`}
        value={comentario}
        onChange={(e) => {
          setComentario(e.target.value);
          if (e.target.value.trim()) setComentarioError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        disabled={saving}
        autoFocus
      />
      {comentarioError && (
        <span className="text-[10px] text-red-500">El comentario es obligatorio.</span>
      )}
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          onClick={() => void commit()}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={cancel}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
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
  patchSolicitudProveedorFields,
  handleFetchSolicitudesPago,
  marcarSolicitudPagada,
  cancelSolicitud,
  conciliarSolicitud,
  marcarNotificadoPagado,
  getEstadoSolicitudPagado,
  getConciliacionInfo,
  onOpenDetalle,
  cancelarDispersion,
}: CreateSolicitudesRenderersParams): Record<
  string,
  React.FC<{ value: any; item: any; index: number }>
> {
  return {
    comentario_sistema: ({ value }) => {
      const texto = String(value ?? "").trim();
      return <TruncatedComment texto={texto} />;
    },

    seleccionar: ({ item, index }) => {
      const row = item as any;
      const raw: SolicitudProveedor | undefined = row?.item ?? row;

      const forma = getFormaPago(raw);
      const estadoSolicitud = normUpper(
        raw?.solicitud_proveedor?.estado_solicitud ?? "",
      );
      const isCancelada = estadoSolicitud.includes("CANCEL");
      const isDispersionRow =
        estadoSolicitud === "DISPERSION" || estadoSolicitud === "DISPERSADO";
      const estatusPagosSel = String(raw?.estatus_pagos ?? "").toLowerCase();

      if (categoria === "pagada") {
        return <span className="text-gray-300">—</span>;
      }

      if (estatusPagosSel === "pagado") {
        return (
          <span className="text-gray-300" title="Ya pagado">
            —
          </span>
        );
      }

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
          index,
      );

      const isSelected = !!selectedSolicitudesMap[key];

      // DISPERSION rows son seleccionables solo para subir comprobante
      if (!isDispersionRow && tieneDispersion) {
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
                (s) => ((s as any).id_solicitud ?? (s as any).id) !== rawId,
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
                  (d) => d.id_solicitud === nuevo.id_solicitud,
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
          value={Number(value || 0)}
          onSave={async (next, comentario) =>
            patchSolicitudProveedorFields(id, {
              monto_solicitado: next,
              comentarios_Ap: comentario,
            })
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
      return (
        <div className="flex items-start gap-1">
          <TruncatedComment texto={texto} />
          <button
            type="button"
            className="text-[10px] text-slate-400 hover:text-blue-600 shrink-0 mt-0.5"
            title="Editar notas internas"
            onClick={() => openEditModal(raw, "notas_internas", texto)}
          >✎</button>
        </div>
      );
    },

    comentarios_Ap: ({ value, item }) => {
      const raw = (item as any)?.item ?? item;
      const texto = String(value ?? "").trim();
      return (
        <div className="flex items-start gap-1">
          <TruncatedComment texto={texto} />
          <button
            type="button"
            className="text-[10px] text-slate-400 hover:text-blue-600 shrink-0 mt-0.5"
            title="Editar comentarios AP"
            onClick={() => openEditModal(raw, "comentarios_Ap", texto)}
          >✎</button>
        </div>
      );
    },

    comentarios_sp: ({ value }) => (
      <TruncatedComment texto={String(value ?? "").trim()} />
    ),

    comentarios_cxp: ({ value }) => (
      <TruncatedComment texto={String(value ?? "").trim()} />
    ),

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
                title={
                  value ? formatSatValue(value, CFDI_FORMA_PAGO_LABELS) : "—"
                }
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
                title={
                  value ? formatSatValue(value, CFDI_METODO_PAGO_LABELS) : "—"
                }
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
            const value = String(f?.moneda ?? "")
              .trim()
              .toUpperCase();
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
              <div
                key={`${uuid}-${idx}`}
                className="flex items-center gap-2 flex-wrap"
              >
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
    fecha_de_pago: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),

    fecha_facturacion: ({ value }) =>
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
    costo_proveedor: ({ item }) => {
      const raw = (item as any)?.item ?? item;
      const id = getIdSolProv(raw);
      const monto = Number(raw?.solicitud_proveedor?.monto_solicitado ?? (item as any)?.monto_solicitado ?? 0);
      return (
        <InlineMoneyEdit
          value={monto}
          onSave={async (next, comentario) =>
            patchSolicitudProveedorFields(id, {
              monto_solicitado: next,
              comentarios_Ap: comentario,
            })
          }
        />
      );
    },
    precio_de_venta: ({ value }) => {
      const n = parseFloat(String(value ?? "0").replace(/,/g, ""));
      return <p>{fmtMoney(Number.isFinite(n) ? n : 0)}</p>;
    },
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
          {fmtMoney(n)}
        </span>
      );
    },
    markup: ({ value }) => {
      const n = Number(value || 0);
      return (
        <span
          className={
            n >= 0
              ? "text-green-700 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {n.toFixed(2)}%
        </span>
      );
    },
    acciones: ({ item }) => {
      const row = item as any;
      const raw = row?.item ?? row;

      const idSolProv = getIdSolProv(raw);
      const forma = getFormaPago(raw);
      const pagado = isPagado(raw);

      const estadoSolicitud = normUpper(
        raw?.solicitud_proveedor?.estado_solicitud ??
          row?.estado_solicitud ??
          "",
      );

      const isCancelada = estadoSolicitud.includes("CANCEL");
      const cancelDisabled = pagado || isCancelada || categoria === "pagada";

  const [reasignarOpen, setReasignarOpen] = React.useState(false);
  const [saldoAFavorOpen, setSaldoAFavorOpen] = React.useState(false);

      const montoSolicitado = Number(
        raw?.solicitud_proveedor?.monto_solicitado ??
          raw?.monto_solicitado ??
          0,
      );
      const saldoNum = getSaldo(raw);
      const estatusPagos = String(
        raw?.estatus_pagos ?? raw?.solicitud_proveedor?.estatus_pagos ?? "",
      ).toLowerCase();
      const tieneReasignar =
        categoria === "canceladas" &&
        (saldoNum !== montoSolicitado || estatusPagos === "pagado");

      if (estadoSolicitud.includes("CUPON") && categoria !== "ap_credito") {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
              onClick={() => onOpenDetalle(idSolProv)}
              title="Ver detalle"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detalle</span>
            </button>
          </div>
        );
      }

      const costoActual = Number((raw as any)?.costo_total ?? 0) || 0;

      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
            onClick={() => onOpenDetalle(idSolProv)}
            title="Ver detalle"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detalle</span>
          </button>

          {categoria !== "canceladas" && (
            <>
              {(categoria === "ap_credito" || forma === "card") && (
                <MetodoPagoModal
                  idSolProv={idSolProv}
                  currentMethod={forma}
                  currentCardId={
                    raw?.solicitud_proveedor?.id_tarjeta_solicitada ?? null
                  }
                  cardOnly={categoria !== "ap_credito"}
                  onSetMethod={async (next) => {
                    const ok = await patchSolicitudProveedor(
                      idSolProv,
                      "forma_pago_solicitada",
                      next,
                    );
                    if (!ok) return false;

                    if (categoria === "ap_credito") {
                      const estadoSol =
                        next === "transfer"
                          ? "TRANSFERENCIA_SOLICITADA"
                          : "CARTA_ENVIADA";
                      await patchSolicitudProveedor(
                        idSolProv,
                        "estado_solicitud",
                        estadoSol,
                      );
                    }

                    handleFetchSolicitudesPago();
                    return true;
                  }}
                  onSetCard={async ({ id_tarjeta_solicitada, id_titular }) => {
                    const ok1 = await patchSolicitudProveedor(
                      idSolProv,
                      "id_tarjeta_solicitada",
                      id_tarjeta_solicitada,
                    );
                    if (!ok1) return false;

                    if (id_titular) {
                      await patchSolicitudProveedor(
                        idSolProv,
                        "id_titular",
                        id_titular,
                      );
                    }

                    handleFetchSolicitudesPago();
                    return true;
                  }}
                />
              )}

              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                onClick={() =>
                  openEditModal(raw, "costo_proveedor", costoActual)
                }
                title="Editar costo proveedor"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Costo</span>
              </button>

              {categoria === "notificados" &&
              estadoSolicitud === "DISPERSION" &&
              estatusPagos !== "pagado" ? (
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
                        `- pagado: ${pagadoValue}`,
                    );

                    if (!okConfirm) {
                      e.target.value = "";
                      return;
                    }

                    const ok = await marcarNotificadoPagado(
                      idSolProv,
                      pagadoValue as 0 | 1,
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
                      `¿Seguro que deseas CANCELAR la solicitud ${idSolProv}?`,
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

                      const estadoSolicitudPagado = getEstadoSolicitudPagado(
                        raw,
                        categoria,
                      );

                      const ok = window.confirm(
                        `¿Marcar como PAGADO la solicitud ${idSolProv}?\n\n` +
                          `Se enviará:\n` +
                          `- estatus_pagos: pagado\n` +
                          `- estado_solicitud: ${estadoSolicitudPagado ?? "N/D"}`,
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
                    0,
                );

                const {
                  diferencia,
                  totalPagado,
                  totalFacturado,
                  puedeConciliar,
                } = getConciliacionInfo(raw);

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
                          ? `No se puede conciliar. Diferencia actual: ${fmtMoney(diferencia)} (pagado: ${fmtMoney(totalPagado)}, facturado: ${fmtMoney(totalFacturado)})`
                          : "Conciliar (marca consolidado=1)"
                    }
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Conciliar</span>
                  </button>
                );
              })()}
            </>
          )}

          {/* Cancelar dispersión — solo SPEI en estado DISPERSION */}
          {categoria === "spei" && estadoSolicitud === "DISPERSION" && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-sm"
              title="Cancelar dispersión"
              onClick={async () => {
                const ok = window.confirm(
                  `¿Cancelar la dispersión de la solicitud ${idSolProv}?`,
                );
                if (!ok) return;
                await cancelarDispersion(idSolProv);
              }}
            >
              Cancelar dispersión
            </button>
          )}

          {/* Quitar ajuste — canceladas y notificados */}
          {(categoria === "canceladas" || categoria === "notificados") && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
              title="Quitar ajuste (is_ajuste = 0 y borra comentario)"
              onClick={async () => {
                const ok = window.confirm(
                  `¿Quitar ajuste de la solicitud ${idSolProv}?\n\nEsto limpiará el campo is_ajuste y el comentario del sistema.`,
                );
                if (!ok) return;
                const success = await patchSolicitudProveedorFields(idSolProv, {
                  is_ajuste: 0,
                  comentario_ajuste: null,
                });
                if (success) handleFetchSolicitudesPago();
              }}
            >
              Quitar ajuste
            </button>
          )}

      {/* Reasignar pago — canceladas con pago parcial o pagado */}
      {tieneReasignar && (
        <>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-sm"
            onClick={() => setReasignarOpen(true)}
            title="Reasignar pago a otra solicitud SPEI"
          >
            <span>Reasignar pago</span>
          </button>
          <ReasignarPagoModal
            open={reasignarOpen}
            onClose={() => setReasignarOpen(false)}
            idSolicitudProveedor={idSolProv}
            onSuccess={() => {
              setReasignarOpen(false);
              handleFetchSolicitudesPago();
            }}
          />

          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm"
            onClick={() => setSaldoAFavorOpen(true)}
            title="Generar saldo a favor para el proveedor"
          >
            <span>Generar saldo a favor</span>
          </button>
          <GenerarSaldoAFavorModal
            open={saldoAFavorOpen}
            onClose={() => setSaldoAFavorOpen(false)}
            idSolicitudProveedor={idSolProv}
            onSuccess={() => {
              setSaldoAFavorOpen(false);
              handleFetchSolicitudesPago();
            }}
          />
        </>
      )}
    </div>
  );
},
  };
}
