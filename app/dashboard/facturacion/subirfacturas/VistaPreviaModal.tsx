'use client';
import React, { useEffect, useState } from 'react';
import { generarFacturaPDF } from "./parsePdf";
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";

interface VistaPreviaProps {
  facturaData: any;
  onClose: () => void;
  onConfirm: (pdfUrl: string) => void; // Modificado para recibir la URL del PDF
  isLoading?: boolean;
}

export default function VistaPreviaModal({
  facturaData,
  onClose,
  onConfirm,
  isLoading = false
}: VistaPreviaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null); // Para la vista previa
  const [showPdf, setShowPdf] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    async function generarYSubirPDF() {
      try {
        // 1. Generar el PDF

        const pdfBlob = await generarFacturaPDF(facturaData);
        const objectUrl = URL.createObjectURL(pdfBlob);
        setPdfObjectUrl(objectUrl);

        // 2. Subir el PDF a S3
        setUploadingPdf(true);
        const fileName = `factura_${facturaData.timbreFiscal.uuid}.pdf`;

        const pdfFile = new File([pdfBlob], fileName, {
          type: 'application/pdf',
          lastModified: Date.now()
        });

        // Obtener URL firmada
        const { url: signedUrl, publicUrl } = await obtenerPresignedUrl(
          fileName,
          'application/pdf',
          'comprobantes'
        );

        // Subir el archivo
        await subirArchivoAS3(pdfFile, signedUrl);

        // Establecer la URL pública
        setPdfUrl(publicUrl);
      } catch (error) {
        console.error("Error al generar o subir PDF:", error);
      } finally {
        setUploadingPdf(false);
      }
    }

    if (facturaData) {
      generarYSubirPDF();
    }

    // Limpieza
    return () => {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
  }, [facturaData]);

  const toggleView = () => setShowPdf(!showPdf);

  const handleConfirm = () => {
    console.log(pdfUrl)
    onConfirm(pdfUrl);
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Vista Previa de Factura</h1>
            <p className="text-gray-500 text-sm">
              {showPdf ? "Visualización del PDF generado" : "Datos estructurados de la factura"}
            </p>
            {uploadingPdf && (
              <p className="text-sm text-blue-500">Subiendo PDF a S3...</p>
            )}
            {pdfUrl && (
              <p className="text-sm text-green-500">PDF listo para guardar</p>
            )}
          </div>
          <button
            onClick={toggleView}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            disabled={!pdfObjectUrl}
          >
            {showPdf ? 'Ver datos estructurados' : 'Ver vista PDF'}
          </button>
        </div>

        {showPdf ? (
          pdfObjectUrl ? (
            <iframe
              src={pdfObjectUrl}
              className="w-full h-[600px] border"
              title="Vista PDF"
            />
          ) : (
            <p>Generando vista previa PDF...</p>
          )
        ) : (
          <FacturaEstructurada
            facturaData={facturaData}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading && uploadingPdf}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isLoading || uploadingPdf || !pdfUrl}
          >
            {(isLoading || uploadingPdf) ? "Procesando..." : "Aceptar y Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const FacturaEstructurada = ({ facturaData, formatCurrency, formatDate }: any) => (
  <div className="border border-gray-200 rounded-lg p-6">
    {/* Encabezado */}
    <div className="flex justify-between items-start mb-8">
      <div>
        <h2 className="text-xl font-bold text-blue-800">{facturaData.emisor.nombre}</h2>
        <p className="text-sm text-gray-600">RFC: {facturaData.emisor.rfc}</p>
      </div>
      <div className="text-right">
        <h3 className="text-lg font-bold">FACTURA</h3>
        <p className="text-sm">No. {facturaData.comprobante.folio}</p>
        <p className="text-sm">{formatDate(facturaData.comprobante.fecha)}</p>
      </div>
    </div>

    {/* Datos del receptor */}
    <div className="mb-6 p-4 bg-gray-50 rounded">
      <h4 className="font-bold text-gray-700 mb-2">DATOS DEL RECEPTOR</h4>
      <p className="font-semibold">{facturaData.receptor.nombre}</p>
      <p className="text-sm">RFC: {facturaData.receptor.rfc}</p>
    </div>

    {/* Conceptos */}
    <div className="mb-6">
      <h4 className="font-bold text-gray-700 mb-3">CONCEPTOS</h4>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border">Descripción</th>
            <th className="p-2 text-center border">Cantidad</th>
            <th className="p-2 text-right border">P. Unitario</th>
            <th className="p-2 text-right border">Importe</th>
          </tr>
        </thead>
        <tbody>
          {facturaData.conceptos.map((concepto: any, index: number) => (
            <tr key={index} className="border-b">
              <td className="p-2 border">{concepto.descripcion}</td>
              <td className="p-2 text-center border">{concepto.cantidad}</td>
              <td className="p-2 text-right border">{formatCurrency(concepto.valorUnitario)}</td>
              <td className="p-2 text-right border">{formatCurrency(concepto.importe)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totales */}
    <div className="flex justify-end">
      <div className="w-1/2">
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">Subtotal:</span>
          <span>{formatCurrency(facturaData.comprobante.subtotal)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">IVA ({facturaData.impuestos.traslado.tasa * 100}%):</span>
          <span>{formatCurrency(facturaData.impuestos.traslado.importe)}</span>
        </div>
        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(facturaData.comprobante.total)}</span>
        </div>
      </div>
    </div>

    {/* Timbre fiscal */}
    <div className="mt-6 pt-4 border-t text-xs text-gray-500">
      <p className="font-semibold">TIMBRE FISCAL DIGITAL</p>
      <p>UUID: <span className="text-blue-500">{facturaData.timbreFiscal.uuid}</span></p>
      <p>Fecha de timbrado: {formatDate(facturaData.timbreFiscal.fechaTimbrado)}</p>
    </div>
  </div>
);