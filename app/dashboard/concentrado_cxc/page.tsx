"use client";

import React, { useState, useEffect, useMemo } from "react";
import { API_KEY, URL } from "@/lib/constants";
import { Eye, Factory } from 'lucide-react';
import { Table5 } from "@/components/Table5";
import { formatNumberWithCommas } from "@/helpers/utils";
import DetallesFacturas from "./components/facturas";
import { formatDate } from "@/helpers/utils";


// Función para formatear dinero
const money = (n: number) =>
  `$${formatNumberWithCommas(Number(n || 0).toFixed(2))}`;

// Nombre de agente o "Sin asignar"
const getAgentName = (nombre: string | null) => nombre || "Sin asignar";

// ID de agente o "N/A"
const getAgentId = (id: string | null) => id || "N/A";

// Días de atraso desde la fecha_vencimiento hasta hoy
const getDiasVencida = (
  fecha_vencimiento: string | Date | null
): number | null => {
  if (!fecha_vencimiento) return null;
  const dt = new Date(fecha_vencimiento);
  if (isNaN(dt.getTime())) return null;

  const today = new Date();
  const hoy = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const fv = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();

  // días = hoy - vencimiento (positivo = ya se pasó la fecha)
  const diff = Math.floor((hoy - fv) / (1000 * 60 * 60 * 24));
  return diff;
};

// Convierte "2025-11-11 13:38:19.000000" o "2025-11-11" a Date UTC (solo fecha)
export const parseToUtcDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const [datePart] = value.trim().split(" "); // nos quedamos con "YYYY-MM-DD"
  const [y, m, d] = datePart.split("-").map(Number);

  if (!y || !m || !d) return null;

  return new Date(Date.UTC(y, m - 1, d)); // mes base 0
};

// Diferencia en días: end - start (puede ser negativo si end < start)
export const diffInDays = (
  start: string | null | undefined,
  end: string | null | undefined
): number | null => {
  const d1 = parseToUtcDate(start || "");
  const d2 = parseToUtcDate(end || "");

  if (!d1 || !d2) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = d2.getTime() - d1.getTime();

  return Math.floor(diffMs / msPerDay);
};


const getDatosFac = (factura: any) => {
  // Días de crédito: vencimiento - creación
  const diasCreditoRaw = diffInDays(
    factura.created_at,
    factura.fecha_vencimiento
  );

  const diasCredito =
    diasCreditoRaw != null ? Math.max(diasCreditoRaw, 0) : null;

  // Hoy en formato "YYYY-MM-DD"
  const hoyStr = new Date().toISOString().slice(0, 10);

  // Días restantes: vencimiento - hoy
  const diasRestantesRaw = diffInDays(
    hoyStr,
    factura.fecha_vencimiento
  );

  // Si ya está vencida, lo dejamos en 0 (no números negativos)
  const diasRestantes =
    diasRestantesRaw != null ? Math.max(diasRestantesRaw, 0) : null;

  console.log({ diasCredito, diasRestantes, facturaId: factura.id_factura });

  return {
    diasRestantes,
    diasCredito,
  };
};


// Estructura de cada agente con buckets de días
type GrupoAgente = {
  id_cliente: string | null;
  nombre_cliente: string;
  total_facturas: number;
  // Línea de tiempo por estado / días de atraso
  vigentes: number;        // fecha_vencimiento hoy o futura (<= 0 días)
  dia_7: number;
  dia_7_saldo:number;        // 1–7 días de atraso
  dia_15: number; 
    dia_15_saldo:number;        // 1–7 días de atraso
      // 8–15
  dia_20: number; 
    dia_20_saldo:number;        // 1–7 días de atraso
     // 16–20
  dias_30: number; 
    dia_30_saldo:number;        // 1–7 días de atraso
     // 21–30
  mas_30: number;  
    mas_30_saldo:number;        // 1–7 días de atraso
   // >30
  adeudo_total: number;
  facturas: any[];
  facturas_credito: any;
  adeudo_vigente?: number;
  adeudo_vencido?: number;
};

export default function ResumenAgentesPage() {
  const [datosAgentes, setDatosAgentes] = useState<GrupoAgente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agenteSeleccionado, setAgenteSeleccionado] =
    useState<GrupoAgente | null>(null);


  // Fetch de datos
  useEffect(() => {
    const fetchDatosAgentes = async () => {
      const endpoint = `${URL}/mia/factura/getfacturasPagoPendienteByAgente`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Respuesta POST recibida:", data);

        if (Array.isArray(data)) {
          const grupos: GrupoAgente[] = data.map(
            (agenteData: any): GrupoAgente => {
              const facturas = agenteData.facturas_json || [];

              const grupo: GrupoAgente = {
                id_cliente: agenteData.id_agente,
                nombre_cliente: getAgentName(agenteData.nombre_agente),
                total_facturas: facturas.length,
                facturas_credito:[],
                vigentes: 0,
                dia_7: 0,
                dia_7_saldo:0,
                dia_15: 0,
                                dia_15_saldo:0,

                dia_20: 0,
                                dia_20_saldo:0,

                dias_30: 0,
                                dia_30_saldo:0,

                mas_30: 0,
                                mas_30_saldo:0,

                adeudo_total: 0,
                facturas,
                adeudo_vencido : 0,
                adeudo_vigente : 0,
              };

              facturas.forEach((factura: any) => {
                const saldo = parseFloat(factura.saldo) || 0;
                grupo.adeudo_total += saldo;
                grupo.adeudo_vencido += getDiasVencida(factura.fecha_vencimiento)! > 0 ? saldo : 0;
                grupo.adeudo_vigente += getDiasVencida(factura.fecha_vencimiento)! <= 0 ? saldo : 0;

                const dias = getDiasVencida(factura.fecha_vencimiento);
                
                if (dias === null) {
                  // si no hay fecha de vencimiento, la podemos tratar como vigente
                  grupo.vigentes++;
                  return;
                }
                if (dias <= 0) {
                  // aún no llega o justo hoy
                  console.log("factura",factura)
                  grupo.vigentes++;
                  grupo.facturas_credito.push(getDatosFac(factura));
                } else if (dias <= 7) {
                  grupo.dia_7_saldo+=factura.saldo;
                                    grupo.dia_7++;

                } else if (dias <= 15) {
                  grupo.dia_15++;
                                    grupo.dia_15_saldo+=factura.saldo;

                } else if (dias <= 20) {
                  grupo.dia_20++;
                                    grupo.dia_20_saldo+=factura.saldo;

                } else if (dias <= 30) {
                  grupo.dias_30++;
                                    grupo.dia_30_saldo+=factura.saldo;

                } else {
                  grupo.mas_30++;
                                    grupo.mas_30_saldo+=factura.saldo;

                }
              });

              return grupo;
            }
          );

          setDatosAgentes(grupos);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (err: any) {
        console.error("Error en la consulta:", err);
        setError(err.message || "Error al obtener los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchDatosAgentes();
  }, []);


  // Abrir modal
  const handleVerFacturas = (agente: GrupoAgente) => {
    setAgenteSeleccionado(agente);
    setIsModalOpen(true);
  };

  // Preparar los datos para Table5
  const registros = useMemo(() => {
    return datosAgentes.map((agente) => {
     

      return {
        acciones: {
          onClick: () => handleVerFacturas(agente),
          totalFacturas: agente.total_facturas,
        },
        id_cliente: getAgentId(agente.id_cliente),
        nombre_cliente: agente.nombre_cliente,
        total_facturas: agente.total_facturas,
        // Lo importante para la “línea de tiempo”:
        vigentes: agente.vigentes,
        total_vigente:agente.adeudo_vigente,
        vencidas:agente.total_facturas-agente.vigentes,
        //credito expandible
        dia_7: agente.dia_7_saldo,
        dia_15: agente.dia_15_saldo,
        dia_20: agente.dia_20_saldo,
        dias_30: agente.dia_30_saldo,
        mas_30: agente.mas_30_saldo,

        adeudo_total: agente.adeudo_total,
        item: agente, // para los renderers que quieran el objeto completo
      };
    });
  }, [datosAgentes]);

  // Renderers personalizados
const renderers = {
  acciones: ({ value }) => (
    <button
      onClick={value.onClick}
      className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      <Eye size={12} />
      <span>({value.totalFacturas})</span>
    </button>
  ),

  nombre_cliente: ({ value }: { value: string }) => (
    <div className="flex justify-center">
      <span className="font-semibold text-xs text-gray-800">
        {value}
      </span>
    </div>
  ),

  id_cliente: ({ value }: { value: string }) => (
    <div className="flex justify-center">
      <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">
        {value === "N/A" ? "N/A" : `${value.substring(0, 8)}...`}
      </span>
    </div>
  ),

  total_facturas: ({ value }: { value: number }) => (
    <div className="flex justify-center">
      <span className="font-bold text-blue-600 text-xs">
        {value}
      </span>
    </div>
  ),

  vigentes: ({ value }: { value: number }) => (
    <div className="flex justify-center">
      <span className="font-semibold text-emerald-600 text-xs">
        {value}
      </span>
    </div>
  ),

  vencidas: ({ value }: { value: number }) => (
    <div className="flex justify-center">
      <span className="font-semibold text-red-600 text-xs">
        {value}
      </span>
    </div>
  ),

  // 🔹 total vigente (monto), derecha
  total_vigente: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-emerald-700 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  dia_7: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-yellow-400 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  dia_15: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-yellow-600 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  dia_20: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-orange-400 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  dias_30: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-orange-500 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  mas_30: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-semibold text-red-600 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),

  adeudo_total: ({ value }: { value: number }) => (
    <div className="flex justify-end">
      <span className="font-bold text-purple-600 text-xs">
        {money(Number(value) || 0)}
      </span>
    </div>
  ),
};

  // Columnas que se muestran en Table5
  const customColumns = [
    "acciones",
    "id_cliente",
    "nombre_cliente",
    "total_facturas",

    // “Línea de tiempo” por días (lo que quieres que se entienda visualmente)
    "vigentes",
    "vencidas",
    "dia_7",
    "dia_15",
    "dia_20",
    "dias_30",
    "mas_30",
    "credito",
    "adeudo_total",
    "total_vigente",
  ];

  // Totales generales para los cuadros de arriba
  const totales = useMemo(() => {
    return {
      totalAgentes: datosAgentes.length,
      totalFacturas: datosAgentes.reduce(
        (sum, agente) => sum + agente.total_facturas,
        0
      ),
      totalAdeudo: datosAgentes.reduce(
        (sum, agente) => sum + agente.adeudo_total,
        0
      ),
      totalVigente:datosAgentes.reduce(
        (sum,agente)=>sum + agente.adeudo_vigente,0
      ),
      totalVencido:datosAgentes.reduce(
        (sum,agente)=>sum + agente.adeudo_vencido,0
      ),
      totalFacVigentes: datosAgentes.reduce(
        (sum, agente) => sum + agente.vigentes,
        0
      ),
      total1a7: datosAgentes.reduce(
        (sum, agente) => sum + agente.dia_7,
        0
      ),
      total8a15: datosAgentes.reduce(
        (sum, agente) => sum + agente.dia_15,
        0
      ),
      total16a20: datosAgentes.reduce(
        (sum, agente) => sum + agente.dia_20,
        0
      ),
      total21a30: datosAgentes.reduce(
        (sum, agente) => sum + agente.dias_30,
        0
      ),
      totalMas30: datosAgentes.reduce(
        (sum, agente) => sum + agente.mas_30,
        0
      ),
    };
  }, [datosAgentes]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">
              Cargando información de agentes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 rounded-md">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Resumen de Cuentas por Cobrar por Cliente
        </h1>
      </header>
      {datosAgentes.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500">
            No hay datos de agentes disponibles
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2">
    <div className="min-w-[180px] bg-orange-50 p-4 rounded-lg border border-orange-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-orange-800 mb-1">Total Clientes</h3>
      <p className="text-2xl font-bold text-orange-600">{totales.totalAgentes}</p>
    </div>
    <div className="min-w-[180px] bg-blue-50 p-4 rounded-lg border border-blue-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-blue-800 mb-1">Total Facturas</h3>
      <p className="text-2xl font-bold text-blue-600">{totales.totalFacturas}</p>
    </div>
    <div className="min-w-[180px] bg-green-50 p-4 rounded-lg border border-green-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-green-800 mb-1">Facturas Vigentes</h3>
      <p className="text-2xl font-bold text-green-600">{totales.totalFacVigentes}</p>
    </div>
    <div className="min-w-[180px] bg-red-50 p-4 rounded-lg border border-red-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-red-800 mb-1">Facturas Vencidas</h3>
      <p className="text-2xl font-bold text-red-600">{totales.totalFacturas - totales.totalFacVigentes}</p>
    </div>
    <div className="min-w-[180px] bg-purple-50 p-4 rounded-lg border border-purple-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-purple-800 mb-1">Adeudo Total</h3>
      <p className="text-2xl font-bold text-purple-600">{money(totales.totalAdeudo)}</p>
    </div>
    <div className="min-w-[180px] bg-purple-50 p-4 rounded-lg border border-purple-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-purple-800 mb-1">Total Vigente</h3>
      <p className="text-2xl font-bold text-purple-600">{money(totales.totalVigente)}</p>
    </div>
    <div className="min-w-[180px] bg-purple-50 p-4 rounded-lg border border-purple-100 flex-shrink-0">
      <h3 className="text-sm font-semibold text-purple-800 mb-1">Total Vencido</h3>
      <p className="text-2xl font-bold text-purple-600">{money(totales.totalVencido)}</p>
    </div>
  </div>


          {/* Resumen tipo “línea de tiempo” global */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Estado de facturas por días de atraso
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
              <div>
                <div className="text-lg font-bold text-emerald-600">
                  {totales.totalFacVigentes}
                </div>
                <div className="text-gray-600">Vigentes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {totales.total1a7}
                </div>
                <div className="text-gray-600">1–7 días</div>
              </div>
              <div>
                <div className="text-lg font-bold text-lime-600">
                  {totales.total8a15}
                </div>
                <div className="text-gray-600">8–15 días</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-500">
                  {totales.total16a20}
                </div>
                <div className="text-gray-600">16–20 días</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-500">
                  {totales.total21a30}
                </div>
                <div className="text-gray-600">21–30 días</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {totales.totalMas30}
                </div>
                <div className="text-gray-600">&gt; 30 días</div>
              </div>
            </div>
          </div>

          {/* Tabla de resumen */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <Table5
              registros={registros}
              renderers={renderers}
              customColumns={customColumns}
              expandableColumns={["credito"]}
              exportButton={true}
              maxHeight="calc(100vh - 400px)"
            />
          </div>
        </div>
      )}

      {/* Modal de detalles de facturas */}
      <DetallesFacturas
  open={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  agente={agenteSeleccionado}
  facturas={
    (agenteSeleccionado?.facturas || []).map((factura) => ({
      ...factura,
      ...getDatosFac(factura),
    }))
  }
  formatDate={formatDate}
  money={money}
/>

    </div>
  );
}