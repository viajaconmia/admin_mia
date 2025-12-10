"use client";

import React, { useState } from "react";
import { Table5 } from "@/components/Table5";
import useApi from "@/hooks/useApi";
import { formatDate } from "@/helpers/utils";


/* ─────────────────────────────
   Tipos reutilizables
────────────────────────────── */

export interface Factura {
  rfc: string;
  saldo: number;
  total: number;
  estado: string;
  url_pdf: string | null;
  url_xml: string | null;
  subtotal: number;
  id_agente: string | null;
  impuestos: number;
  created_at: string;
  id_empresa: string;
  id_factura: string;
  rfc_emisor: string | null;
  updated_at: string;
  id_facturama: string | null;
  uuid_factura: string;
  fecha_emision: string;
  usuario_creador: string | null;
  fecha_vencimiento: string | null;
  diasRestantes: number;
  diasCredito: number;
  [key: string]: any;
}

/* ─────────────────────────────
   Modal: listado de facturas
────────────────────────────── */

export interface DetallesFacturasProps {
  open: boolean;
  onClose: () => void;
  agente: {
    id_agente: string | null;
    nombre_agente: string;
  } | null;
  facturas: Factura[];
  money: (n: number) => string;

  /** Abre el modal de detalle de factura */
  onOpenFacturaDetalle?: (factura: Factura) => void;
  
  /** Funciones para descargar facturas - OPCIONALES */
  descargarFactura?: (id: string) => Promise<{ Content: string }>;
  descargarFacturaXML?: (id: string) => Promise<{ Content: string }>;
  downloadFile?: (url: string, filename: string) => void;
}

export const DetallesFacturas: React.FC<DetallesFacturasProps> = ({
  open,
  onClose,
  agente,
  facturas,
  money,
  onOpenFacturaDetalle,
  // Estas props son opcionales y se pasan al modal de detalle
  descargarFactura,
  descargarFacturaXML,
  downloadFile,
}) => {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const handleOpenDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);
    
    // Si hay un callback externo, también lo llamamos
    if (onOpenFacturaDetalle) {
      onOpenFacturaDetalle(factura);
    }
  };

  const handleCloseDetalle = () => {
    setDetalleAbierto(false);
  };

  const handleCloseAll = () => {
    setDetalleAbierto(false);
    setFacturaSeleccionada(null);
    onClose();
  };

  if (!open) return null;

  const registros = facturas.map((f) => ({
    uuid_factura: f.uuid_factura,
    fecha_emision: f.fecha_emision,
    fecha_vencimiento: f.fecha_vencimiento,
    rfc: f.rfc,
    total: f.total,
    saldo: f.saldo,
    dias_a_credito: f.diasCredito,
    dias_restantes: f.diasRestantes,
    item: f,
  }));

const renderers: {
  [key: string]: React.FC<{ value: any; item: any; index: number }>;
} = {
  id_factura: ({ value }) => (
    <span className="font-mono text-[10px] md:text-xs" title={value}>
      {value ? `${String(value).substring(0, 12)}...` : "—"}
    </span>
  ),

  uuid_factura: ({ value, item }) => (
    <button
      type="button"
      onClick={() => handleOpenDetalle(item as Factura)}
      className="font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] md:text-xs transition-colors"
      title={value}
    >
      {value ? `${String(value).substring(0, 8)}...` : "—"}
    </button>
  ),

  rfc: ({ value }) => (
    <div className="flex justify-center">
      <span className="text-gray-700">{value || "—"}</span>
    </div>
  ),

  fecha_emision: ({ value }) => (
    <div className="flex justify-center">
      <span className="text-gray-600">{formatDate(value ?? null)}</span>
    </div>
  ),

  fecha_vencimiento: ({ value }) => (
    <div className="flex justify-center">
      <span className="text-gray-600">{formatDate(value ?? null)}</span>
    </div>
  ),

  total: ({ value }) => (
    <div className="flex justify-end">
      <span className="font-bold text-blue-600">
        {money(parseFloat(value) || 0)}
      </span>
    </div>
  ),

  saldo: ({ value, item }) => {
    const saldo = parseFloat(value) || 0;
    const total = parseFloat(item.total) || 0;
    const porcentajePagado = total > 0 ? ((total - saldo) / total) * 100 : 0;
    const vencido = (item.diasRestantes ?? 0) <= 0;

    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className={`font-bold ${
            !vencido ? "text-green-600" : "text-red-500"
          }`}
        >
          {money(saldo)}
        </span>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`${!vencido ? "bg-green-600" : "bg-red-600"} h-1.5 rounded-full`}
            style={{
              width: `${100 - porcentajePagado}%`,
            }}
          />
        </div>
      </div>
    );
  },

  dias_a_credito: ({ value }) => (
    <div className="flex justify-center">
      <span className="text-xs text-gray-700">
        {value ?? "—"}
      </span>
    </div>
  ),

  dias_restantes: ({ value }) => {
    const dias = Number(value ?? 0);
    const vencida = dias <= 0;

    return (
      <div className="flex justify-center">
        <span
          className={`text-xs font-semibold ${
            vencida ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {vencida ? "Vencida" : `${dias} día(s)`}
        </span>
      </div>
    );
  },
};


  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Facturas del cliente
              </h2>
              {agente && (
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-semibold">{agente.nombre_agente}</span>{" "}
                  {agente.id_agente && (
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {agente.id_agente}
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Body */}
          <div className="p-4 flex-1 overflow-auto">
            {facturas.length === 0 ? (
              <p className="text-sm text-gray-500">
                Este agente no tiene facturas pendientes.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2">
                  <Table5<any>
                    registros={registros}
                    renderers={renderers}
                    exportButton={false}
                    leyenda={`Mostrando ${facturas.length} factura(s)`}
                    maxHeight="60vh"
                    customColumns={[
                      "id_factura",
                      "rfc",
                      "uuid_factura",
                      "fecha_emision",
                      "total",
                      "saldo",
                      "dias_a_credito",
                      "dias_restantes",
                      "fecha_vencimiento"
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Factura */}
      <DetalleFacturaModal
        open={detalleAbierto}
        factura={facturaSeleccionada}
        onClose={handleCloseDetalle}
        onCloseAll={handleCloseAll}
        formatDate={formatDate}
        money={money}
        // Pasamos las funciones de descarga al modal
        descargarFactura={descargarFactura}
        descargarFacturaXML={descargarFacturaXML}
        downloadFile={downloadFile}
      />
    </>
  );
};

/* Si quieres que este sea el default: */
export default DetallesFacturas;

/* ─────────────────────────────
   Modal: detalle de una factura
────────────────────────────── */

export interface DetalleFacturaModalProps {
  open: boolean;
  factura: Factura | null;
  onClose: () => void;    // Regresar a ver facturas
  onCloseAll: () => void; // Regresar a menú principal
  formatDate: (d: string | Date | null) => string;
  money: (n: number) => string;
  

  downloadFile?: (url: string, filename: string) => void;
}

export const DetalleFacturaModal: React.FC<DetalleFacturaModalProps> = ({
  open,
  factura,
  onClose,
  onCloseAll,
  formatDate,
  money,

  downloadFile,
}) => {
    const { descargarFactura, descargarFacturaXML } = useApi();
  
  const [descargando, setDescargando] = useState<"pdf" | "xml" | null>(null);

  if (!open || !factura) return null;

  const vencida = (factura.diasRestantes ?? 0) <= 0;

  // Función para descargar desde Facturama - IDÉNTICA a la de tu ejemplo
  const handleDescargarFacturaInterno = async (tipo: "pdf" | "xml") => {
    if (!factura.id_facturama) {
      alert("No hay ID de Facturama disponible para descargar");
      return;
    }

    // Verificar que las funciones de descarga estén disponibles
    if (!descargarFactura || !descargarFacturaXML) {
      alert("Funcionalidad de descarga no disponible");
      return;
    }

    try {
      if (tipo === "pdf") {
        const obj = await descargarFactura(factura.id_facturama);
        const a = document.createElement("a");
        a.href = `data:application/pdf;base64,${obj.Content}`;
        a.download = "factura.pdf";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      } else {
        const obj = await descargarFacturaXML(factura.id_facturama);
        const a = document.createElement("a");
        a.href = `data:application/xml;base64,${obj.Content}`;
        a.download = `factura_${Date.now()}.xml`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      }
    } catch {
      alert("Ha ocurrido un error al descargar la factura");
    }
  };

  // Función para descargar desde URL - Usa la utilidad downloadFile si está disponible
  const handleDownloadFileInterno = (url: string, filename: string) => {
    if (downloadFile) {
      downloadFile(url, filename);
    } else {
      // Implementación alternativa si no se proporciona la función
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    }
  };

  console.log("factura",factura)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Detalles de la factura
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              UUID:{" "}
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {factura.uuid_factura}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCloseAll}
              className="text-xs md:text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Regresar a menú principal
            </button>
            <button
              onClick={onClose}
              className="text-xs md:text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Regresar a ver facturas
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-auto space-y-4">
          {/* Encabezado tipo factura */}
          <div className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Emisor
              </h3>
              <p className="text-xs text-gray-600">
                RFC Emisor:{" "}
                <span className="font-mono">
                  {factura.rfc_emisor ?? "NAL190807BU2"}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Empresa ID:{" "}
                <span className="font-mono">
                  {factura.id_empresa}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Receptor
              </h3>
              <p className="text-xs text-gray-600">
                RFC Receptor:{" "}
                <span className="font-mono">{factura.rfc}</span>
              </p>
              <p className="text-xs text-gray-600">
                Agente:{" "}
                <span className="font-mono">
                  {factura.id_agente ?? "N/D"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Fechas
              </h3>
              <p className="text-xs text-gray-600">
                Emisión:{" "}
                <span className="font-medium">
                  {formatDate(factura.fecha_emision)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Vencimiento:{" "}
                <span className="font-medium">
                  {factura.fecha_vencimiento
                    ? formatDate(factura.fecha_vencimiento)
                    : "N/D"}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Días de crédito: {factura.diasCredito ?? "N/D"}
              </p>
              <p className="text-xs text-gray-600">
                Días restantes:{" "}
                <span
                  className={
                    vencida ? "text-red-600 font-semibold" : "text-green-600 font-semibold"
                  }
                >
                  {factura.diasRestantes}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Estado / Montos
              </h3>
              <p className="text-xs text-gray-600 flex items-center gap-2">
                Estado:
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    factura.estado === "Confirmada"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {factura.estado}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Subtotal:{" "}
                <span className="font-semibold">
                  {money(factura.subtotal)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Impuestos:{" "}
                <span className="font-semibold">
                  {money(factura.impuestos)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Total:{" "}
                <span className="font-bold text-blue-700">
                  {money(factura.total)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Saldo pendiente:{" "}
                <span
                  className={`font-bold ${
                    vencida ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {money(factura.saldo)}
                </span>
              </p>
            </div>
          </div>

          {/* Espacio para XML y PDF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF */}
            <div className="border rounded-lg p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Archivo PDF
              </h3>
              
              {factura.url_pdf ? (
                <>
                  <p className="text-xs text-gray-600">
                    Aquí puedes ver o descargar el PDF de la factura.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={factura.url_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Ver PDF en nueva pestaña
                    </a>
                    <button
                      onClick={() => handleDownloadFileInterno(factura.url_pdf!, `factura_${factura.uuid_factura}.pdf`)}
                      className="inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Descargar PDF
                    </button>
                  </div>
                </>
              ) : factura.id_facturama ? (
                <>
                  <p className="text-xs text-gray-600">
                    PDF disponible para descargar desde Facturama.
                  </p>
                  <button
                    onClick={() => handleDescargarFacturaInterno("pdf")}
                    disabled={descargando === "pdf"}
                    className={`inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded ${
                      descargando === "pdf" 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white transition-colors`}
                  >
                    {descargando === "pdf" ? "Descargando..." : "Descargar PDF desde Facturama"}
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500">
                    No se ha cargado un PDF para esta factura.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    (No hay URL ni ID de Facturama disponible)
                  </p>
                </div>
              )}
            </div>

            {/* XML */}
            <div className="border rounded-lg p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Archivo XML
              </h3>
              
              {factura.url_xml ? (
                <>
                  <p className="text-xs text-gray-600">
                    Aquí puedes ver o descargar el XML de la factura.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={factura.url_xml}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Ver XML en nueva pestaña
                    </a>
                    <button
                      onClick={() => handleDownloadFileInterno(factura.url_xml!, `factura_${factura.uuid_factura}.xml`)}
                      className="inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Descargar XML
                    </button>
                  </div>
                </>
              ) : factura.id_facturama ? (
                <>
                  <p className="text-xs text-gray-600">
                    XML disponible para descargar desde Facturama.
                  </p>
                  <button
                    onClick={() => handleDescargarFacturaInterno("xml")}
                    disabled={descargando === "xml"}
                    className={`inline-flex items-center justify-center text-xs md:text-sm px-3 py-1.5 rounded ${
                      descargando === "xml" 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-emerald-600 hover:bg-emerald-700"
                    } text-white transition-colors`}
                  >
                    {descargando === "xml" ? "Descargando..." : "Descargar XML desde Facturama"}
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500">
                    No se ha cargado un XML para esta factura.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    (No hay URL ni ID de Facturama disponible)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info técnica extra */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Información técnica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-gray-600">
              <p>
                ID Factura:{" "}
                <span className="font-mono">{factura.id_factura}</span>
              </p>
              <p>
                ID Facturama:{" "}
                <span className="font-mono">
                  {factura.id_facturama ?? "N/D"}
                </span>
              </p>
              <p>
                Creada:{" "}
                <span className="font-mono">
                  {formatDate(factura.created_at)}
                </span>
              </p>
              <p>
                Actualizada:{" "}
                <span className="font-mono">
                  {formatDate(factura.updated_at)}
                </span>
              </p>
              <p>
                Usuario creador:{" "}
                <span className="font-mono">
                  {factura.usuario_creador ?? "N/D"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};