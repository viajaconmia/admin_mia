"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Unlink, X, Loader2, FileText, DownloadCloud, Copy } from "lucide-react";
import { fetchFacturacionAviso, postAvisosFactura } from "@/services/avisos_reservas";
import { FacturacionModal } from "@/app/dashboard/facturacion/_components/reservations-main";
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";

import useApi from "@/hooks/useApi";
import { useAlert } from "@/context/useAlert";

// ── tipos ─────────────────────────────────────────────────────────────────────

export type ActionEndpoint = "prefacturar" | "desligar" | "aprobar" | "atendida";

type AvisoReserva = { [key: string]: any };
type CambioRow = { campo: string; anterior: any; nuevo: any };

// ── helpers ───────────────────────────────────────────────────────────────────

export function flattenCambios(cambios: any, prefix = ""): CambioRow[] {
  if (!cambios || typeof cambios !== "object") return [];
  const rows: CambioRow[] = [];
  for (const [key, val] of Object.entries(cambios)) {
    const campo = prefix ? `${prefix}.${key}` : key;
    const v = val as any;
    if (v && typeof v === "object" && "anterior" in v && "nuevo" in v) {
      rows.push({ campo, anterior: v.anterior, nuevo: v.nuevo });
    } else if (v && typeof v === "object") {
      rows.push(...flattenCambios(v, campo));
    }
  }
  return rows;
}

export function flattenItemComparison(anterior: any, nuevo: any): CambioRow[] {
  const rows: CambioRow[] = [];
  const allKeys = new Set([
    ...Object.keys(anterior ?? {}),
    ...Object.keys(nuevo ?? {}),
  ]);
  for (const key of allKeys) {
    if (key === "impuestos") continue;
    const antVal = anterior?.[key];
    const nvoVal = nuevo?.[key];
    const antIsObj = antVal !== null && typeof antVal === "object" && !Array.isArray(antVal);
    const nvoIsObj = nvoVal !== null && typeof nvoVal === "object" && !Array.isArray(nvoVal);
    if (antIsObj || nvoIsObj) {
      const subKeys = new Set([
        ...Object.keys(antVal ?? {}),
        ...Object.keys(nvoVal ?? {}),
      ]);
      for (const sub of subKeys) {
        if (antVal?.[sub] !== nvoVal?.[sub]) {
          rows.push({
            campo: `${key}.${sub}`,
            anterior: antVal?.[sub],
            nuevo: nvoVal?.[sub],
          });
        }
      }
    } else if (antVal !== nvoVal) {
      rows.push({ campo: key, anterior: antVal, nuevo: nvoVal });
    }
  }
  return rows;
}

export function parseDetalle(raw: any): any {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw;
  return null;
}

function formatVal(v: any): React.ReactNode {
  if (v === null || v === undefined)
    return <span className="text-gray-400 italic">—</span>;
  if (typeof v === "object")
    return (
      <pre className="text-xs whitespace-pre-wrap max-w-xs">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  return String(v);
}

function normalizeText(v: any): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toMoneyNumber(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;

  return Number(String(v).replace(/,/g, "")) || 0;
}

function CambiosTable({ rows }: { rows: CambioRow[] }) {
  if (!rows.length) return null;
  return (
    <table className="text-xs w-full border-collapse rounded overflow-hidden">
      <thead>
        <tr>
          <th className="border border-gray-200 px-3 py-1 bg-gray-100 text-left font-semibold text-gray-600">
            Campo
          </th>
          <th className="border border-gray-200 px-3 py-1 bg-red-50 text-left font-semibold text-red-600">
            Anterior
          </th>
          <th className="border border-gray-200 px-3 py-1 bg-green-50 text-left font-semibold text-green-600">
            Nuevo
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ campo, anterior, nuevo }, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="border border-gray-200 px-3 py-1 font-medium text-gray-700">
              {campo}
            </td>
            <td className="border border-gray-200 px-3 py-1 text-red-700">
              {formatVal(anterior)}
            </td>
            <td className="border border-gray-200 px-3 py-1 text-green-700">
              {formatVal(nuevo)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function DetalleModal({
  row,
  onClose,
  onAction,
  actionLoading,
}: {
  row: AvisoReserva;
  onClose: () => void;
  onAction: (
    endpoint: ActionEndpoint,
    ids: { id_relacion: any; id_booking: any }[],
  ) => void;
  actionLoading: boolean;
}) {
  const detalle = parseDetalle(row.item?.detalle ?? row.detalle);
  const hasFactura =
    Boolean(detalle?.id_factura) ||
    (Array.isArray(detalle?.id_facturas) && detalle.id_facturas.length > 0);

  const buildPayload = (id_factura?: any) => [
  {
    id_relacion: row?.id_relacion,
    id_booking: row?.id_booking,
    id_notificacion: row?.id_notificacion,
    id_factura: id_factura ?? detalle?.id_factura ?? null,
  },
];

const payload = buildPayload();

const getFacturaId = (f: any) =>
  f?.id_factura ?? f?.idFactura ?? f?.id ?? null;
  console.log(row,"✅✅✅✅✅")
  
  const [facturaData, setFacturaData] = useState<any[] | null>(null);
  const [facturaLoading, setFacturaLoading] = useState(false);
  const { descargarFactura, descargarFacturaXML } = useApi();
  const { showNotification } = useAlert();

  const [showFacturacionPrompt, setShowFacturacionPrompt] = useState(false);
  const [showSubirFactura, setShowSubirFactura] = useState(false);
  const [showFacturamaModal, setShowFacturamaModal] = useState(false);
  const [showDiferenciaPagada, setShowDiferenciaPagada] = useState(false);
  const [facturando, setFacturando] = useState(false);

  const handle_facturar = async (): Promise<"ok" | "diferencia_pagada" | "error"> => {
    try {
      setFacturando(true);
      await postAvisosFactura(row.id_relacion, detalle?.id_facturas);
      return "ok";
    } catch (e: any) {
      if (e?.message === "Diferencia ya pagada") return "diferencia_pagada";
      showNotification("error", e?.message || "Error al facturar");
      return "error";
    } finally {
      setFacturando(false);
    }
  };

  const copiarTexto = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      showNotification("success", "UUID copiado");
    } catch {
      showNotification("error", "No se pudo copiar el UUID");
    }
  };
  
  const handleDescargarFactura = async (
    idFacturama: string,
    tipo: "pdf" | "xml",
    nombre = "factura",
  ) => {
    try {
      if (!idFacturama) throw new Error("No existe id_facturama");

      if (tipo === "pdf") {
        const obj = await descargarFactura(idFacturama);
        const a = document.createElement("a");
        a.href = `data:application/pdf;base64,${obj.Content}`;
        a.download = nombre.endsWith(".pdf") ? nombre : `${nombre}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      } else {
        const obj = await descargarFacturaXML(idFacturama);
        const a = document.createElement("a");
        a.href = `data:application/xml;base64,${obj.Content}`;
        a.download = nombre.endsWith(".xml") ? nombre : `${nombre}.xml`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      }
    } catch {
      showNotification("error", "Ha ocurrido un error al descargar la factura");
    }
  };
  
  useEffect(() => {
    if (!hasFactura) return;
    setFacturaLoading(true);
    fetchFacturacionAviso(
      (data) => {
        let facturas: any[] = [];
        if (Array.isArray(data)) {
          facturas = data;
        } else if (Array.isArray(data?.resultados)) {
          facturas = data.resultados.flatMap((r: any) =>
            Array.isArray(r.data) ? r.data : [],
          );
        }
        setFacturaData(facturas);
        setFacturaLoading(false);
      },
      {
        id_factura: detalle.id_factura,
        id_facturas: detalle.id_facturas,
        id_relacion: row.id_relacion,
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambios = detalle?.cambios ?? {};
  const { items: itemsCambios, before: _before, cambios: _cambiosNested, current: _current, ...otherCambios } = cambios;
  const vuelosCambiosData = _cambiosNested?.vuelos;
  const hasVuelosCambios = Boolean(
    vuelosCambiosData &&
      (Array.isArray(vuelosCambiosData.anterior) || Array.isArray(vuelosCambiosData.nuevo)),
  );
  const cambiosRows = flattenCambios(otherCambios);
const facturaResumen = Array.isArray(facturaData) ? facturaData[0] : null;

const facturasVisibles = Array.isArray(facturaData) ? facturaData : [];

const tieneMultiplesFacturas =
  facturasVisibles.length > 1 ||
  (Array.isArray(detalle?.id_facturas) && detalle.id_facturas.length > 1);

const handleDesligarFactura = (factura: any) => {
  const id_factura = getFacturaId(factura);

  if (!id_factura) {
    showNotification("error", "No se encontró el id de la factura");
    return;
  }

  onAction("desligar", buildPayload(id_factura));
  onClose();
};

const estatus = normalizeText(
  detalle?.estatus ?? detalle?.estado ?? row?.estatus ?? row?.estado,
);
const tieneIdFacturama = Boolean(
  facturaResumen?.id_facturama ?? detalle?.id_facturama,
);

const totalReserva = toMoneyNumber(facturaResumen?.total_reserva);
const totalFacturado = toMoneyNumber(facturaResumen?.total_facturado);

const esCanceladaConFacturama =
estatus === "cancelada";

const esActivaConFactura =
hasFactura && (!estatus == false);

const mostrarAprobar =
esActivaConFactura && detalle.tipo!="reserva_cancelada" &&
totalReserva > totalFacturado;
const mostrarDesligar = hasFactura && totalFacturado != 0 && totalFacturado != totalReserva;

const mostrarAtendida = !hasFactura || (totalFacturado == 0 )|| totalFacturado == totalReserva;


const hasCambios =
  (itemsCambios && Object.keys(itemsCambios).length > 0) ||
  cambiosRows.length > 0 ||
  hasVuelosCambios;

  return (
  <>
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
        <h2 className="text-base font-semibold text-gray-800">
          Detalle de cambios
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
        {!detalle ? (
          <p className="text-xs text-gray-500">Sin detalle disponible</p>
        ) : (
          <>
            {/* Meta chips (siempre visibles) */}
            <div className="flex flex-wrap gap-2 text-xs">
              {detalle.tipo && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  Tipo: <b>{detalle.tipo}</b>
                </span>
              )}
              {detalle.estatus && (
                <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md border border-orange-200">
                  Estatus: <b>{detalle.estatus}</b>
                </span>
              )}
              {detalle.prefacturado && (
                <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                  Prefacturado: <b>{detalle.prefacturado}</b>
                </span>
              )}
              {detalle.id_confirmacion && (
                <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                  Confirmación: <b>{detalle.id_confirmacion}</b>
                </span>
              )}
            </div>

            {/* Si hay cambios: mostrarlos junto con la factura (si existe) */}
            {hasCambios && (
              <>
                {/* Noches ajustadas */}
                {itemsCambios && Object.keys(itemsCambios).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Noches ajustadas
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(itemsCambios).map(
                        ([key, item]: [string, any]) => {
                          const ant = item?.anterior ?? {};
                          const nvo = item?.nuevo ?? {};
                          const rows = flattenItemComparison(ant, nvo);
                          return (
                            <div
                              key={key}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="px-3 py-2 bg-amber-50 border-b border-gray-200 text-xs font-semibold text-amber-800">
                                Noche {Number(key) + 1}
                              </div>
                              {rows.length > 0 ? (
                                <CambiosTable rows={rows} />
                              ) : (
                                <p className="text-xs text-gray-400 px-3 py-2">
                                  Sin diferencias
                                </p>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Vuelos modificados */}
                {hasVuelosCambios && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Vuelos modificados
                    </h3>
                    <div className="space-y-3">
                      {(vuelosCambiosData.anterior ?? vuelosCambiosData.nuevo ?? []).map(
                        (_: any, idx: number) => {
                          const ant = vuelosCambiosData.anterior?.[idx] ?? {};
                          const nvo = vuelosCambiosData.nuevo?.[idx] ?? {};
                          const rows = flattenItemComparison(ant, nvo);
                          const tipo = ant.tipo ?? nvo.tipo ?? `Vuelo ${idx + 1}`;
                          const folio = ant.folio ?? nvo.folio ?? "";
                          return (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="px-3 py-2 bg-sky-50 border-b border-gray-200 text-xs font-semibold text-sky-800 capitalize">
                                {tipo}{folio ? ` — ${folio}` : ""}
                              </div>
                              {rows.length > 0 ? (
                                <CambiosTable rows={rows} />
                              ) : (
                                <p className="text-xs text-gray-400 px-3 py-2">
                                  Sin diferencias
                                </p>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Otros cambios */}
                {cambiosRows.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Cambios en la reserva
                    </h3>
                    <CambiosTable rows={cambiosRows} />
                  </div>
                )}

                {/* Factura asociada (cuando hay cambios y factura) */}
                {hasFactura && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Factura asociada
                    </h3>
                    {facturaLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cargando datos de factura...
                      </div>
                    ) : facturaData && facturaData.length > 0 ? (
                      <div className="space-y-3">
                        {facturaData.map((f, i) => (
                          <div
                            key={i}
                            className="border border-purple-200 rounded-xl bg-purple-50/30 p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2 text-purple-800">
                              <FileText className="w-5 h-5" />
                              <span className="font-semibold text-sm">
                                Factura {i + 1}
                              </span>
                            </div>
                            {f.uuid && (
  <div className="text-xs text-gray-600 flex items-center gap-2">
    <span className="font-medium">UUID:</span>

    <span className="font-mono break-all">{f.uuid}</span>

    <button
      type="button"
      onClick={() => copiarTexto(f.uuid)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
      title="Copiar UUID"
    >
      <Copy className="w-3 h-3" />
      Copiar
    </button>
  </div>
)}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                              {f.total_reserva != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total reserva
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_reserva}
                                  </span>
                                </>
                              )}
                              {f.total_facturado != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total facturado
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_facturado}
                                  </span>
                                </>
                              )}
                              {f.total_factura != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total factura
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_factura}
                                  </span>
                                </>
                              )}
                              {f.fecha_emision && (
                                <>
                                  <span className="text-gray-500">
                                    Fecha emisión
                                  </span>
                                  <span className="text-gray-800">
                                    {new Date(
                                      f.fecha_emision,
                                    ).toLocaleDateString("es-MX")}
                                  </span>
                                </>
                              )}
                              {f.id_facturama && (
                                <>
                                  <span className="text-gray-500">
                                    ID Facturama
                                  </span>
                                  <span className="text-gray-800 font-mono">
                                    {f.id_facturama}
                                  </span>
                                </>
                              )}
                            </div>
                            {(f.url_pdf || f.url_xml || f.id_facturama) && (
  <>
    <span className="text-gray-500 font-medium">Archivos</span>
    <span className="flex flex-wrap gap-2">
      {f.url_pdf ? (
        <a
          href={f.url_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Ver PDF
        </a>
      ) : f.id_facturama ? (
        <button
          type="button"
          onClick={() =>
            handleDescargarFactura(
              f.id_facturama,
              "pdf",
              `Factura-${f?.folio || f?.uuid || "sin-folio"}`
            )
          }
          className="inline-flex items-center gap-1 text-blue-600 underline"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          Descargar PDF
        </button>
      ) : null}

      {f.url_xml ? (
        <a
          href={f.url_xml}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Ver XML
        </a>
      ) : f.id_facturama ? (
        <button
          type="button"
          onClick={() =>
            handleDescargarFactura(
              f.id_facturama,
              "xml",
              `Factura-${f?.folio || f?.uuid || "sin-folio"}`
            )
          }
          className="inline-flex items-center gap-1 text-blue-600 underline"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          Descargar XML
        </button>
      ) : null}
    </span>
  </>
)}
{mostrarDesligar && tieneMultiplesFacturas && (
  <button
    type="button"
    disabled={actionLoading}
    onClick={() => handleDesligarFactura(f)}
    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors w-fit"
  >
    <Unlink className="w-3.5 h-3.5" />
    Desligar esta factura
  </button>
)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Sin datos de factura
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Cuando NO hay cambios */}
            {!hasCambios && (
              <>
                {hasFactura ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Factura asociada
                    </h3>
                    {facturaLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cargando datos de factura...
                      </div>
                    ) : facturaData && facturaData.length > 0 ? (
                      <div className="space-y-3">
                        {facturaData.map((f, i) => (
                          <div
                            key={i}
                            className="border border-purple-200 rounded-xl bg-purple-50/30 p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2 text-purple-800">
                              <FileText className="w-5 h-5" />
                              <span className="font-semibold text-sm">
                                Factura {i + 1}
                              </span>
                            </div>
                            {f.uuid && (
  <div className="text-xs text-gray-600 flex items-center gap-2">
    <span className="font-medium">UUID:</span>

    <span className="font-mono break-all">{f.uuid}</span>

    <button
      type="button"
      onClick={() => copiarTexto(f.uuid)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
      title="Copiar UUID"
    >
      <Copy className="w-3 h-3" />
      Copiar
    </button>
  </div>
)}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                              {f.total_reserva != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total reserva
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_reserva}
                                  </span>
                                </>
                              )}
                              {f.total_facturado != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total facturado
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_facturado}
                                  </span>
                                </>
                              )}
                              {f.total_factura != null && (
                                <>
                                  <span className="text-gray-500">
                                    Total factura
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {f.total_factura}
                                  </span>
                                </>
                              )}
                              {f.fecha_emision && (
                                <>
                                  <span className="text-gray-500">
                                    Fecha emisión
                                  </span>
                                  <span className="text-gray-800">
                                    {new Date(
                                      f.fecha_emision,
                                    ).toLocaleDateString("es-MX")}
                                  </span>
                                </>
                              )}
                              {f.id_facturama && (
                                <>
                                  <span className="text-gray-500">
                                    ID Facturama
                                  </span>
                                  <span className="text-gray-800 font-mono">
                                    {f.id_facturama}
                                  </span>
                                </>
                              )}
                            </div>
                            {(f.url_pdf || f.url_xml || f.id_facturama || detalle?.id_facturama) && (
  <div className="flex flex-wrap gap-3 mt-1">
    {f.url_pdf ? (
      <a
        href={f.url_pdf}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
      >
        <FileText className="w-3 h-3" />
        Ver PDF
      </a>
    ) : (f.id_facturama || detalle?.id_facturama) ? (
      <button
        type="button"
        onClick={() =>
          handleDescargarFactura(
            f.id_facturama || detalle?.id_facturama,
            "pdf",
            `Factura-${f?.folio || f?.uuid || "sin-folio"}`
          )
        }
        className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
      >
        <DownloadCloud className="w-3 h-3" />
        Descargar PDF
      </button>
    ) : null}

    {f.url_xml ? (
      <a
        href={f.url_xml}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
      >
        <FileText className="w-3 h-3" />
        Ver XML
      </a>
    ) : (f.id_facturama || detalle?.id_facturama) ? (
      <button
        type="button"
        onClick={() =>
          handleDescargarFactura(
            f.id_facturama || detalle?.id_facturama,
            "xml",
            `Factura-${f?.folio || f?.uuid || "sin-folio"}`
          )
        }
        className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
      >
        <DownloadCloud className="w-3 h-3" />
        Descargar XML
      </button>
    ) : null}
  </div>
)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Sin datos de factura
                      </p>
                    )}
                  </div>
                ) : estatus === "cancelada" ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
                    Reserva cancelada
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Sin cambios registrados
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer — acciones */}
      <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 shrink-0">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>

        {facturaLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cargando...
          </div>
        ) : (
          <>
            {mostrarAprobar && (
              <button
                disabled={actionLoading || facturando}
                onClick={async () => {
                  const result = await handle_facturar();
                  if (result === "ok") {
                    setShowFacturacionPrompt(true);
                  } else if (result === "diferencia_pagada") {
                    onAction("aprobar", payload);
                    setShowDiferenciaPagada(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aprobar
              </button>
            )}

            {mostrarDesligar && !tieneMultiplesFacturas && (
              <button
                disabled={actionLoading}
                onClick={() => {
                  onAction("desligar", payload);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desligar
              </button>
            )}

            {mostrarAtendida && (
              <button
                disabled={actionLoading}
                onClick={() => {
                  onAction("atendida", payload);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Atendida
              </button>
            )}
          </>
        )}
      </div>
    </div>
  </div>

  {/* ── Mini-modal: Diferencia ya pagada ────────────────────────────── */}
  {showDiferenciaPagada && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-xs w-full mx-4 flex flex-col gap-4">
        <p className="text-sm text-center text-gray-700 font-medium">
          Diferencia ya pagada — se aprobará el aviso automáticamente.
        </p>
        <button
          onClick={() => {
            setShowDiferenciaPagada(false);
            onClose();
          }}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )}

  {/* ── Mini-modal: ¿Desea facturar? ─────────────────────────────────── */}
  {showFacturacionPrompt && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-xs w-full mx-4 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-gray-800 text-center">
          ¿Desea facturar?
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setShowFacturacionPrompt(false);
              setShowSubirFactura(true);
            }}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Subir factura
          </button>
          <button
            onClick={() => {
              setShowFacturacionPrompt(false);
              setShowFacturamaModal(true);
            }}
            className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Facturama
          </button>
          <button
            onClick={() => {
              setShowFacturacionPrompt(false);
              onAction("aprobar", payload);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ── SubirFactura ─────────────────────────────────────────────────── */}
  {showSubirFactura && (
    <SubirFactura
      autoOpen
      agentId={row.id_agente}
      onSuccess={() => {
        setShowSubirFactura(false);
        onClose();
      }}
      onCloseExternal={() => {
        setShowSubirFactura(false);
        onClose();
      }}
    />
  )}

  {/* ── FacturacionModal (Facturama) ──────────────────────────────────── */}
  {showFacturamaModal && (
    <FacturacionModal
      selectedItems={{ [row.id_booking ?? ""]: [] }}
      selectedHospedaje={{
        [row.id_booking ?? ""]: row.id_relacion ? [row.id_relacion] : [],
      }}
      reservationsInit={[
        {
          id_servicio: row.id_booking ?? "",
          created_at: row.created_at ?? "",
          id_relacion: row.id_relacion ?? "",
          is_credito: null,
          id_solicitud: row.id_solicitud ?? "",
          confirmation_code: detalle?.id_confirmacion ?? "",
          nombre: row.nombre ?? "",
          proveedor: detalle?.hotel ?? detalle?.proveedor ?? row.proveedor ?? "",
          check_in: detalle?.check_in ?? row.check_in ?? "",
          check_out: detalle?.check_out ?? row.check_out ?? "",
          room: detalle?.tipo_cuarto ?? row.tipo_cuarto ?? "",
          total: String(detalle?.venta?.total?.nuevo ?? row.total ?? 0),
          id_usuario_generador: row.id_usuario_generador ?? row.id_agente ?? "",
          id_booking: row.id_booking ?? "",
          codigo_confirmacion: detalle?.id_confirmacion ?? null,
          id_pago: row.id_pago ?? "",
          pendiente_por_cobrar: row.pendiente_por_cobrar ?? 0,
          monto_a_credito: row.monto_a_credito ?? "0",
          id_factura: detalle?.id_factura ?? null,
          primer_nombre: null,
          apellido_paterno: null,
          id_agente: row.id_agente ?? row.id_usuario_generador ?? "",
          items: [],
        } as any,
      ]}
      onClose={() => {
        setShowFacturamaModal(false);
        onClose();
      }}
      onConfirm={() => {
        setShowFacturamaModal(false);
        onClose();
      }}
    />
  )}
  </>
);
}
