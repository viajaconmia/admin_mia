"use client";

import React from "react";

interface DetallesFacturasProps {
  open: boolean;
  onClose: () => void;
  agente: {
    id_agente: string | null;
    nombre_agente: string;
  } | null;
  facturas: any[];
  // Reutilizamos helpers que ya tienes en la página
  formatDate: (d: string | Date | null) => string;
  money: (n: number) => string;
}

const DetallesFacturas: React.FC<DetallesFacturasProps> = ({
  open,
  onClose,
  agente,
  facturas,
  formatDate,
  money,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Facturas del agente
            </h2>
            {agente && (
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold">
                  {agente.nombre_agente}
                </span>{" "}
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
              <div className="max-h-[60vh] overflow-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium text-gray-700">
                        ID Factura
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        RFC
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        UUID
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        Emisión
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        Total
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        Saldo
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        Subtotal
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        Impuestos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((factura, idx) => {
                      const saldo = parseFloat(factura.saldo) || 0;
                      const total = parseFloat(factura.total) || 0;
                      const porcentajePagado =
                        total > 0
                          ? ((total - saldo) / total) * 100
                          : 0;

                      return (
                        <tr
                          key={factura.id_factura || idx}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-3 py-2">
                            <span
                              className="font-mono text-[10px] md:text-xs"
                              title={factura.id_factura}
                            >
                              {factura.id_factura
                                ? `${String(
                                    factura.id_factura
                                  ).substring(0, 12)}...`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {factura.rfc || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="font-mono bg-gray-100 px-2 py-1 rounded text-[10px] md:text-xs"
                              title={factura.uuid_factura}
                            >
                              {factura.uuid_factura
                                ? `${String(
                                    factura.uuid_factura
                                  ).substring(0, 8)}...`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {formatDate(factura.fecha_emision)}
                          </td>
                          <td className="px-3 py-2 font-bold text-blue-600">
                            {money(total)}
                          </td>
                          <td
                            className={`px-3 py-2 font-bold ${
                              saldo > 0
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span>{money(saldo)}</span>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${100 - porcentajePagado}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {money(
                              parseFloat(factura.subtotal) || 0
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {money(
                              parseFloat(factura.impuestos) || 0
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-3 py-2 border-t text-xs text-gray-600">
                <span>Mostrando {facturas.length} factura(s)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetallesFacturas;