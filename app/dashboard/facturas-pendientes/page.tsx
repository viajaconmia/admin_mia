"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/components/Filters";
import { formatDate } from "@/helpers/utils";
import { Table4 } from "@/components/organism/Table4";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchAgentesWithFacturableSaldos } from "@/services/agentes";
import { ToolTip } from "@/components/atom/ToolTip";

// Definición de interfaces en el mismo archivo (o puedes moverlas a @/types)
interface SaldoFacturable {
  id_saldos: number;
  fecha_creacion: string;
  saldo: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  concepto: string;
  referencia: string;
  currency: string;
  tipo_tarjeta: string;
  ult_digits: string;
  comentario: string;
  link_stripe: string;
  is_facturable: boolean;
  is_descuento: boolean;
  comprobante: string;
  activo: boolean;
  numero_autorizacion: string;
  banco_tarjeta: string;
}

interface Agente {
  id_agente: string;
  nombre_agente_completo: string;
  correo: string;
  telefono: string;
  created_at: string;
  tiene_credito_consolidado: boolean;
  saldo?: number;
  wallet?: string;
  notas?: string;
  vendedor?: string;
  // Agrega aquí otras propiedades de Agente que necesites
}

interface AgenteConSaldos extends Agente {
  saldos_facturables: SaldoFacturable[];
}

const defaultFiltersSolicitudes: TypeFilters = {
  filterType: null,
  startDate: null,
  endDate: null,
  client: null,
  correo: null,
  telefono: null,
  estado_credito: null,
  vendedor: null,
  notas: null,
  startCantidad: null,
  endCantidad: null,
};

function PageSaldosFacturables() {
  const [agentes, setAgentes] = useState<AgenteConSaldos[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes);

  const handleFetchAgentes = async () => {
    try {
      setLoading(true);
      const data = await fetchAgentesWithFacturableSaldos(filters, {} as TypeFilters);

      // Transformar los datos
      const agentesTransformados = data.map(agente => ({
        ...agente,
        tiene_credito_consolidado: Boolean(agente.tiene_credito_consolidado)
      }));

      setAgentes(agentesTransformados);

      console.log("Todos los saldos facturables:");
      agentesTransformados.forEach(agente => {
        console.log(`Agente: ${agente.nombre_agente_completo} (${agente.id_agente})`);
        console.log("Saldos facturables:", agente.saldos_facturables);
      });
    } catch (error) {
      console.error("Error fetching agentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchAgentes();
  }, [filters]);

  // Formatear datos para la tabla
  const agentesParaTabla = agentes.map(agente => ({
    id: agente.id_agente,
    nombre: agente.nombre_agente_completo,
    correo: agente.correo,
    telefono: agente.telefono,
    saldos: agente.saldos_facturables.length,
    detalles: agente
  }));

  // Componentes para renderizar en la tabla
  const componentes = {
    id: (props: { value: string }) => (
      <span className="font-semibold text-sm">{props.value}</span>
    ),
    nombre: (props: { value: string }) => (
      <ToolTip content={props.value}>
        <span>{props.value}</span>
      </ToolTip>
    ),
    correo: (props: { value: string }) => <span>{props.value}</span>,
    telefono: (props: { value: string }) => <span>{props.value || 'N/A'}</span>,
    saldos: (props: { value: number }) => (
      <span className="font-medium">{props.value}</span>
    ),
    detalles: ({ value }: { value: AgenteConSaldos }) => (
      <button
        onClick={() => {
          console.log("Detalles del agente:", value);
          console.log("Saldos facturables:", value.saldos_facturables);
        }}
        className="text-blue-600 hover:underline"
      >
        Ver detalles
      </button>
    )
  };

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Agentes con Saldos Facturables
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={""}
            setSearchTerm={() => { }}
          />
        </div>

        <div className="overflow-hidden mt-4">
          {loading ? (
            <Loader />
          ) : (
            <Table4
              registros={agentesParaTabla}
              renderers={componentes}
              defaultSort={{ key: "nombre", sort: false }}
              leyenda={`Mostrando ${agentes.length} agentes con saldos facturables`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PageSaldosFacturables;