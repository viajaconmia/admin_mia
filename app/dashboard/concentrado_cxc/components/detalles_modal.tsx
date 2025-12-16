"use clien"

import { Factura} from "./facturas";
import React, { useState } from "react";
import useApi from "@/hooks/useApi";


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