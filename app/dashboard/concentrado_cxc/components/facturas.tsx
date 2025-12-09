"use client";

import React from "react";
// 🔹 Ajusta la ruta según tu proyecto
import { Table5 } from "@/components/Table5";

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

  // Adaptamos facturas al formato que le gusta a Table5 (le agregamos item por si usas ese patrón)
  console.log("facturas",facturas)
  const registros = facturas.map((f) => ({
    uuid:f.uuid_factura,
    rfc:f.rfc,
    total:f.total,
    saldo:f.saldo,
    dias_a_credito:f.diasCredito,
    dias_restantes:f.diasRestantes,
    id_factura: f.id_factura,
    fecha_emision:f.fecha_emision,
    item: f,
  }));

  // Renderers específicos para columnas de facturas
  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = {
    id_factura: ({ value }) => (
      <span
        className="font-mono text-[10px] md:text-xs"
        title={value}
      >
        {value ? `${String(value).substring(0, 12)}...` : "—"}
      </span>
    ),

    uuid_factura: ({ value }) => (
      <span
        className="font-mono bg-gray-100 px-2 py-1 rounded text-[10px] md:text-xs"
        title={value}
      >
        {value ? `${String(value).substring(0, 8)}...` : "—"}
      </span>
    ),

    fecha_emision: ({ value }) => (
      <span className="text-gray-600">
        {formatDate(value ?? null)}
      </span>
    ),

    total: ({ value }) => (
      <span className="font-bold text-blue-600">
        {money(parseFloat(value) || 0)}
      </span>
    ),

    saldo: ({ value, item }) => {
      const saldo = parseFloat(value) || 0;
      const total = parseFloat(item.total) || 0;
      let vencido = false;
      const porcentajePagado =
        total > 0 ? ((total - saldo) / total) * 100 : 0;
      console.log("slado0",item)
      if (item.diasRestantes <= 0) {
        vencido = true;
        console.log(vencido,"entro")
      }
      return (
        <div className="flex flex-col gap-1">
          <span
            className={`font-bold ${
              vencido != true ? "text-green-600" : "text-red-500"
            }`}
          >
            {money(saldo)}
          </span>
          {vencido != true ? (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-600 h-1.5 rounded-full"
              style={{
                width: `${100 - porcentajePagado}%`,
              }}
            />
          </div>
          ):
(<div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-red-600 h-1.5 rounded-full"
              style={{
                width: `${100 - porcentajePagado}%`,
              }}
            />
          </div>)
          }
        </div>
      );
    },

    rfc: ({ value }) => (
      <span className="text-gray-700">{value || "—"}</span>
    ),
  };

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
              <div className="p-2">
                <Table5<any>
                  registros={registros}
                  renderers={renderers}
                  exportButton={false} // si quieres evitar botón CSV dentro del modal
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
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetallesFacturas;
