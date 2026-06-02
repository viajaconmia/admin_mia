"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, MapPin, Building } from "lucide-react";
import { Loader } from "@/components/atom/Loader";
import { AgentesService, ResumenAgente } from "@/services/AgentesService";
import { DestinosSection } from "@/components/organism/DestinosSection";

const MESES: Record<number, string> = {
  1: "Ene",
  2: "Feb",
  3: "Mar",
  4: "Abr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
};

export function FichaResumen({ id_agente }: { id_agente: string }) {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenAgente | null>(null);

  useEffect(() => {
    AgentesService.getInstance()
      .getResumen(id_agente)
      .then((res) => {
        if (res.data) setResumen(res.data);
      })
      .finally(() => setLoading(false));
  }, [id_agente]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-48 w-full">
        <Loader />
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="flex justify-center items-center min-h-48 w-full text-gray-400 text-sm">
        Sin información disponible
      </div>
    );
  }

  return (
    <div className="w-[900px] max-w-full space-y-8 p-4">
      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-sky-600" />
          Gasto mensual
        </h2>
        <div className="overflow-x-auto rounded-xl border border-sky-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-sky-600 uppercase tracking-wide w-36 border-r border-sky-200">
                  Concepto
                </th>
                {resumen.gasto_mensual.map((g) => (
                  <th
                    key={g.mes}
                    className="px-4 py-3 text-center text-xs font-semibold text-sky-700 uppercase tracking-wide"
                  >
                    {MESES[g.numero_mes]} {g.anio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-sky-100 bg-white hover:bg-sky-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Reservas
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-sky-900"
                  >
                    {g.total_reservas}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-sky-100 bg-sky-50/30 hover:bg-sky-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Noches
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-sky-900"
                  >
                    {g.noches}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-sky-200 bg-white hover:bg-sky-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Gasto total
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-emerald-700"
                  >
                    $
                    {Number(g.gasto_total).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          Destinos más utilizados
        </h2>
        <DestinosSection id_agente={id_agente} estados={resumen.estado} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-sky-600" />
          Tipo de negociación
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {resumen.tipo_negociacion.map((t) => (
            <div
              key={t.tipo_negociacion}
              className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between"
            >
              <p className="text-sm font-medium text-slate-700 truncate mr-3 capitalize lowercase first-letter:uppercase">
                {t.tipo_negociacion.charAt(0) +
                  t.tipo_negociacion.slice(1).toLowerCase()}
              </p>
              <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                <span>
                  <span className="font-bold text-slate-800">
                    {t.total_reservas}
                  </span>{" "}
                  Reservas.
                </span>
                <span>
                  <span className="font-bold text-slate-800">
                    {t.total_noches}
                  </span>{" "}
                  Noches.
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
