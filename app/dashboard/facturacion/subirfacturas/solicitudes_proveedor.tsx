"use client";
import React from "react";

export type AsociacionSolicitudProveedor = {
  id_solicitud: string;
  id_proveedor: string;
  monto_asociar: string;
  raw?: any;
};

interface VistaPreviaSolicitudesBatchProps {
  isProveedorBatch: boolean;
  isProveedorMode?: boolean;

  monedaFactura: string;
  requiereConversionProveedor: boolean;
  tipoCambioFactura: number;
  totalFactura: number;

  batchAsociaciones: AsociacionSolicitudProveedor[];
  batchTotalAsociar: number;
  batchTotalAsociarMXN: number;
  restanteFacturaMXN: number;

  loadingFacturado: boolean;
  facturadoMap: Record<string, any>;

  handleChangeMontoBatch: (idx: number, raw: string) => void;

  singleAsociacion?: AsociacionSolicitudProveedor | null;
  singleMontoAsociar?: string;
  handleChangeMontoSingle?: (raw: string) => void;

  formatCurrency: (value: string | number, currency?: string) => string;
  fromMXNToOriginal: (amount: any) => number;
  getPreviewConversion: (amount: any) => {
    original: number;
    currencyOriginal: string;
    mxn: number;
    hasConversion: boolean;
  };
}

export default function VistaPreviaSolicitudesBatch({
  isProveedorBatch,
  isProveedorMode = false,
  monedaFactura,
  requiereConversionProveedor,
  tipoCambioFactura,
  totalFactura,
  batchAsociaciones,
  batchTotalAsociar,
  batchTotalAsociarMXN,
  restanteFacturaMXN,
  loadingFacturado,
  facturadoMap,
  handleChangeMontoBatch,
  singleAsociacion = null,
  singleMontoAsociar = "",
  handleChangeMontoSingle,
  formatCurrency,
  fromMXNToOriginal,
  getPreviewConversion,
}: VistaPreviaSolicitudesBatchProps) {
  const isProveedorPreview = isProveedorBatch || isProveedorMode;
  if (!isProveedorPreview) return null;

  const asociaciones = isProveedorBatch
    ? batchAsociaciones
    : singleAsociacion
    ? [
        {
          ...singleAsociacion,
          monto_asociar: singleMontoAsociar ?? "",
        },
      ]
    : [];

  const totalAsociadoOriginal = isProveedorBatch
    ? batchTotalAsociar
    : Number(singleMontoAsociar || 0);

  return (
    <div className="mt-4 mb-4">
      <p className="text-xs text-gray-500 mb-2">
        Captura en {monedaFactura}
        {requiereConversionProveedor
          ? ` · se convertirá a MXN con TC ${tipoCambioFactura}`
          : ""}
      </p>

      <label className="block mb-2 font-medium">
        {isProveedorBatch
          ? `Montos a asociar por solicitud (${monedaFactura})`
          : `Monto a asociar a la solicitud (${monedaFactura})`}
      </label>

      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 border-t pt-3">
        {asociaciones.map((it, idx) => {
          const proveedorLabel =
            it.raw?.proveedor || it.raw?.hotel || `Proveedor ${it.id_proveedor}`;

          const idSolicitud = String(it?.id_solicitud ?? "").trim();
          const infoFacturado = facturadoMap?.[idSolicitud] ?? null;

          const maxBackendMXN = Number(infoFacturado?.maximo_asignar ?? 0);
          const montoSolicitadoMXN = Number(infoFacturado?.monto_solicitado ?? 0);
          const totalFacturadoMXN = Number(infoFacturado?.total_facturado ?? 0);

          const sumOthersOriginal = asociaciones.reduce((acc, x, i) => {
            if (i === idx) return acc;
            const n = Number(x.monto_asociar || 0);
            return acc + (Number.isFinite(n) ? n : 0);
          }, 0);

          const maxPorFacturaOriginal = Math.max(0, totalFactura - sumOthersOriginal);
          const maxBackendOriginal = fromMXNToOriginal(maxBackendMXN);

          const maxThisOriginal = Number(infoFacturado?.maximo_asignar ?? 0);

          const montoActual = isProveedorBatch
            ? it.monto_asociar || 0
            : singleMontoAsociar || 0;

          const montoPreview = getPreviewConversion(montoActual);

          return (
            <div
              key={`${it.id_solicitud}-${it.id_proveedor}-${idx}`}
              className="p-3 rounded border bg-white"
            >
              <div className="text-xs text-gray-600 mb-2">
                <div>
                  <strong>Solicitud:</strong> {it.id_solicitud}
                </div>
                <div>
                  <strong>Proveedor:</strong> {proveedorLabel}
                </div>
                <div className="mt-1">
                  <strong>Monto solicitado:</strong>{" "}
                  {formatCurrency(montoSolicitadoMXN, "MXN")}
                </div>
                <div>
                  <strong>Ya facturado:</strong>{" "}
                  {formatCurrency(totalFacturadoMXN, "MXN")}
                </div>
                <div>
                  <strong>Máximo asignable:</strong>{" "}
                  {requiereConversionProveedor
                    ? `${formatCurrency(maxThisOriginal, monedaFactura)} (${formatCurrency(
                        maxBackendMXN,
                        "MXN"
                      )})`
                    : formatCurrency(maxThisOriginal, "MXN")}
                </div>
              </div>

              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={isProveedorBatch ? it.monto_asociar : singleMontoAsociar}
                onChange={(e) => {
                  if (isProveedorBatch) {
                    handleChangeMontoBatch(idx, e.target.value);
                  } else {
                    handleChangeMontoSingle?.(e.target.value);
                  }
                }}
                className="w-full p-2 border rounded border-gray-300"
                disabled={loadingFacturado || !facturadoMap?.[idSolicitud]}
              />

              {Number(montoActual || 0) > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <div>
                    <strong>Capturado:</strong>{" "}
                    {formatCurrency(montoPreview.original, monedaFactura)}
                  </div>

                  {montoPreview.hasConversion && (
                    <div>
                      <strong>Equivalente en MXN:</strong>{" "}
                      {formatCurrency(montoPreview.mxn, "MXN")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-gray-700">
        <strong>Total asociado:</strong>{" "}
        {formatCurrency(totalAsociadoOriginal, monedaFactura)}

        {requiereConversionProveedor && (
          <span className="ml-3">
            <strong>Equivalente MXN:</strong>{" "}
            {formatCurrency(batchTotalAsociarMXN, "MXN")}
          </span>
        )}

        <span className="ml-3">
          <strong>Restante:</strong>{" "}
          {formatCurrency(
            Math.max(0, totalFactura - totalAsociadoOriginal),
            monedaFactura
          )}
        </span>

        {requiereConversionProveedor && (
          <span className="ml-3">
            <strong>Restante MXN:</strong>{" "}
            {formatCurrency(restanteFacturaMXN, "MXN")}
          </span>
        )}
      </div>
    </div>
  );
}