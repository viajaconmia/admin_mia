'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { generarFacturaPDF } from "./parsePdf";
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";

type AsociacionSolicitudProveedor = {
  id_solicitud: string;
  id_proveedor: string;
  monto_asociar: string;
  raw?: any;
};

interface VistaPreviaProps {
  facturaData: any;
  pagoData: any;
  itemsTotal?: number;

  // ✅ PDF opcional (si viene, se usa; si no, se genera)
  archivoPDF?: File | null;

  // ✅ batch UI en vista previa
  isProveedorBatch?: boolean;
  batchAsociaciones?: AsociacionSolicitudProveedor[];
  updateMontoBatch?: (index: number, raw: string) => void;
  batchTotalAsociar?: number;

  onClose: () => void;
  onConfirm: (pdfUrl?: string | null, fecha_vencimiento?: string) => void;
  isLoading?: boolean;
}

export default function VistaPreviaModal({
  facturaData,
  itemsTotal,
  pagoData,
  archivoPDF = null,
  isProveedorBatch = false,
  batchAsociaciones = [],
  updateMontoBatch,
  batchTotalAsociar = 0,
  onClose,
  onConfirm,
  isLoading = false
}: VistaPreviaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState<string>("");

  const toggleView = () => setShowPdf(!showPdf);

  const totalFactura = useMemo(
    () => parseFloat(facturaData?.comprobante?.total || "0"),
    [facturaData]
  );

  const okItems = ((itemsTotal || 0) <= totalFactura);

  useEffect(() => {
    if (facturaData?.comprobante?.fecha) {
      const d = new Date(facturaData.comprobante.fecha);
      d.setDate(d.getDate() + 30);
      setFechaVencimiento(d.toISOString().split("T")[0]);
    }
  }, [facturaData]);

  const safeNumStr = (raw: string) => {
    const cleaned = String(raw ?? "").replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    return parts.length <= 1
      ? parts[0]
      : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
  };

  // ✅ clamp por input para que el total batch nunca exceda totalFactura
  const handleChangeMontoBatch = (idx: number, raw: string) => {
    const normalized = safeNumStr(raw);
    const val = Number(normalized || 0);

    const sumOthers = batchAsociaciones.reduce((acc, it, i) => {
      if (i === idx) return acc;
      const n = Number(it.monto_asociar || 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    const maxThis = Math.max(0, totalFactura - sumOthers);

    if (val > maxThis) {
      updateMontoBatch?.(idx, maxThis.toFixed(2));
      return;
    }

    updateMontoBatch?.(idx, normalized);
  };

  // ✅ Genera o usa PDF y lo sube a S3
  useEffect(() => {
    let localObjectUrl: string | null = null;
    let cancelled = false;

    async function generarOUsarYSubir() {
      try {
        setUploadingPdf(true);
        setPdfUrl(null);

        // 1) Obtener Blob (si viene PDF -> usarlo; si no -> generar)
        let pdfBlob: Blob;
        let fileName: string;

        if (archivoPDF) {
          pdfBlob = archivoPDF;
          fileName =
            archivoPDF.name ||
            `factura_${facturaData?.timbreFiscal?.uuid || Date.now()}.pdf`;
        } else {
          pdfBlob = await generarFacturaPDF(facturaData);
          fileName = `factura_${facturaData?.timbreFiscal?.uuid || Date.now()}.pdf`;
        }

        if (cancelled) return;

        // 2) Vista previa local
        localObjectUrl = URL.createObjectURL(pdfBlob);
        setPdfObjectUrl(localObjectUrl);

        // 3) Subir a S3 (presigned)
        const pdfFile = new File([pdfBlob], fileName, {
          type: 'application/pdf',
          lastModified: Date.now()
        });

        const { url: signedUrl, publicUrl } = await obtenerPresignedUrl(
          fileName,
          'application/pdf',
          'comprobantes'
        );

        await subirArchivoAS3(pdfFile, signedUrl);

        if (cancelled) return;
        setPdfUrl(publicUrl);
      } catch (e) {
        console.error("Error al generar/subir PDF:", e);
      } finally {
        if (!cancelled) setUploadingPdf(false);
      }
    }

    if (facturaData) generarOUsarYSubir();

    return () => {
      cancelled = true;
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [facturaData, archivoPDF]);

  const handleConfirm = () => {
    // ✅ Validación items vs total
    if (typeof itemsTotal === 'number' && itemsTotal > 0 && itemsTotal > totalFactura) {
      alert('El total de los ítems es mayor al total de la factura.');
      return;
    }

    // ✅ Validación batch
    if (isProveedorBatch) {
      const invalid = batchAsociaciones.some(
        (x) => !x.monto_asociar || Number(x.monto_asociar) <= 0
      );
      if (invalid) {
        alert("Debes capturar un monto válido para cada solicitud.");
        return;
      }
      if (batchTotalAsociar > totalFactura) {
        alert("El total asociado por proveedor excede el total de la factura.");
        return;
      }
    }

    if (!fechaVencimiento) {
      alert("Selecciona la fecha de vencimiento.");
      return;
    }

    onConfirm(pdfUrl, fechaVencimiento);
  };

  const formatCurrency = (value: string) =>
    parseFloat(value).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const diferenciaItems = totalFactura - (itemsTotal || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Vista Previa de Factura</h1>
            <p className="text-gray-500 text-sm">
              {showPdf ? "Visualización del PDF" : "Datos estructurados de la factura"}
            </p>

            {uploadingPdf && (
              <p className="text-sm text-blue-500">Generando/Subiendo PDF a S3...</p>
            )}
            {pdfUrl && (
              <p className="text-sm text-green-500">PDF listo para guardar</p>
            )}
            {!archivoPDF && (
              <p className="text-xs text-gray-500">
                No llegó PDF: se generó automáticamente.
              </p>
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

        {/* Resumen de Ítems Seleccionados */}
        {typeof itemsTotal === 'number' && itemsTotal > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Ítems seleccionados</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm">Total de ítems:</p>
                <p className="font-semibold">
                  {itemsTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </p>
              </div>
              <div>
                <p className="text-sm">Total de la factura:</p>
                <p className="font-semibold">
                  {formatCurrency(String(totalFactura))}
                </p>
              </div>
            </div>

            <div
              className={`mt-2 p-2 rounded ${okItems ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {okItems ? (
                <p className="font-semibold">
                  Diferencia (factura - ítems): {formatCurrency(diferenciaItems.toFixed(2))}
                </p>
              ) : (
                <p className="font-semibold">
                  El total de los ítems excede el total de la factura. Ajusta la selección o usa otra factura.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==============================
            ✅ BATCH proveedor: N inputs montos (en vista previa)
           ============================== */}
        {isProveedorBatch && (
          <div className="mt-4 mb-4">
            <label className="block mb-2 font-medium">
              Montos a asociar por solicitud (MXN)
            </label>

            <div className="space-y-3">
              {batchAsociaciones.map((it, idx) => {
                const proveedorLabel =
                  it.raw?.proveedor ||
                  it.raw?.hotel ||
                  `Proveedor ${it.id_proveedor}`;

                const sumOthers = batchAsociaciones.reduce((acc, x, i) => {
                  if (i === idx) return acc;
                  const n = Number(x.monto_asociar || 0);
                  return acc + (Number.isFinite(n) ? n : 0);
                }, 0);

                const maxThis = Math.max(0, totalFactura - sumOthers);

                return (
                  <div
                    key={`${it.id_solicitud}-${it.id_proveedor}-${idx}`}
                    className="p-3 rounded border bg-white"
                  >
                    <div className="text-xs text-gray-600 mb-2">
                      <div><strong>Solicitud:</strong> {it.id_solicitud}</div>
                      <div><strong>Proveedor:</strong> {proveedorLabel}</div>
                      <div className="mt-1">
                        <strong>Máximo para esta fila:</strong>{" "}
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
                          .format(maxThis)}
                      </div>
                    </div>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={it.monto_asociar}
                      onChange={(e) => handleChangeMontoBatch(idx, e.target.value)}
                      className="w-full p-2 border rounded border-gray-300"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-sm text-gray-700">
              <strong>Total asociado:</strong>{" "}
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
                .format(batchTotalAsociar)}
              <span className="ml-3">
                <strong>Restante:</strong>{" "}
                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
                  .format(Math.max(0, totalFactura - batchTotalAsociar))}
              </span>
            </div>
          </div>
        )}

        {/* Nuevo bloque para mostrar información de pago (si existe) */}
        {pagoData?.monto != null && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Información de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm">Saldo disponible:</p>
                <p className="font-semibold">{String(pagoData.monto)}</p>
              </div>
              <div>
                <p className="text-sm">Monto de la factura:</p>
                <p className="font-semibold">{formatCurrency(String(totalFactura))}</p>
              </div>
            </div>
          </div>
        )}

        {showPdf ? (
          pdfObjectUrl ? (
            <iframe src={pdfObjectUrl} className="w-full h-[600px] border" title="Vista PDF" />
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

        {/* Fecha de vencimiento */}
        <div className="mt-6 p-4 bg-gray-50 rounded border">
          <label className="block text-sm font-semibold mb-2" htmlFor="fecha-venc">
            Fecha de vencimiento
          </label>
          <input
            id="fecha-venc"
            type="date"
            className="border rounded p-2"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Define la fecha límite de pago para esta factura.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading || uploadingPdf}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isLoading || uploadingPdf || !pdfUrl || !okItems || !fechaVencimiento}
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

    <div className="mb-6 p-4 bg-gray-50 rounded">
      <h4 className="font-bold text-gray-700 mb-2">DATOS DEL RECEPTOR</h4>
      <p className="font-semibold">{facturaData.receptor.nombre}</p>
      <p className="text-sm">RFC: {facturaData.receptor.rfc}</p>
    </div>

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

    <div className="flex justify-end">
      <div className="w-1/2">
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">Subtotal:</span>
          <span>{formatCurrency(facturaData.comprobante.subtotal)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">
            IVA ({(facturaData.impuestos?.traslado?.tasa || 0) * 100}%):
          </span>
          <span>{formatCurrency(facturaData.impuestos?.traslado?.importe || "0")}</span>
        </div>
        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(facturaData.comprobante.total)}</span>
        </div>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t text-xs text-gray-500">
      <p className="font-semibold">TIMBRE FISCAL DIGITAL</p>
      <p>UUID: <span className="text-blue-500">{facturaData.timbreFiscal.uuid}</span></p>
      <p>Fecha de timbrado: {formatDate(facturaData.timbreFiscal.fechaTimbrado)}</p>
    </div>
  </div>
);
