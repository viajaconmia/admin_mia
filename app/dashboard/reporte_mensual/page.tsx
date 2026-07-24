"use client";

import BaseCard from "@/components/atom/BaseCard";
import { DropdownValues } from "@/components/atom/Input";
import { Table5 } from "@/components/Table5";
import { useState } from "react";

type Option = {
  label: string;
  value: string;
  item: any;
};

type RegistroPreview = {
  periodo: string;
  total_reservaciones: number;
  reservas_facturadas: number;
  reservas_por_facturar: number;
  reservas_canceladas: number;
  reservas_confirmadas: number;
  monto_total_reservas: number;
  total_facturado: number;
  monto_por_facturar: number;
};

export default function Page() {
  const [periodo, setPeriodo] = useState<Option | null>(null);

  const customColumns = [
    "periodo",
    "total_reservaciones",
    "reservas_facturadas",
    "reservas_por_facturar",
    "reservas_canceladas",
    "reservas_confirmadas",
    "monto_total_reservas",
    "total_facturado",
    "monto_por_facturar",
  ];

  const registros: RegistroPreview[] = [
    {
      periodo: "1 a 7 de Junio 2026",
      total_reservaciones: 3458,
      reservas_facturadas: 2352,
      reservas_por_facturar: 1000,
      reservas_canceladas: 50,
      reservas_confirmadas: 3408,
      monto_total_reservas: 1242234,
      total_facturado: 1000000,
      monto_por_facturar: 242234,
    },
    {
      periodo: "7 a 14 Junio 2026",
      total_reservaciones: 3458,
      reservas_facturadas: 2352,
      reservas_por_facturar: 1000,
      reservas_canceladas: 50,
      reservas_confirmadas: 3408,
      monto_total_reservas: 1242234,
      total_facturado: 1000000,
      monto_por_facturar: 242234,
    },
    {
      periodo: "14 a 21 Junio 2026",
      total_reservaciones: 5258,
      reservas_facturadas: 2352,
      reservas_por_facturar: 1000,
      reservas_canceladas: 50,
      reservas_confirmadas: 3408,
      monto_total_reservas: 1242234,
      total_facturado: 1000000,
      monto_por_facturar: 242234,
    },
    {
      periodo: "21 a 31 Junio 2026",
      total_reservaciones: 8464,
      reservas_facturadas: 6352,
      reservas_por_facturar: 3000,
      reservas_canceladas: 150,
      reservas_confirmadas: 7320,
      monto_total_reservas: 7242234,
      total_facturado: 3000000,
      monto_por_facturar: 442234,
    },
  ];

  const renderers = {
    periodo: ({ value }: { value: string }) => (
      <span className="text-xs font-bold text-gray-900">{value}</span>
    ),

    total_reservaciones: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    reservas_facturadas: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    reservas_por_facturar: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    reservas_canceladas: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    reservas_confirmadas: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    monto_total_reservas: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    total_facturado: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),

    monto_por_facturar: ({ value }: { value: number }) => (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    ),
  };

  const opcionesPeriodo: Option[] = [
    { label: "Enero", value: "January", item: null },
    { label: "Febrero", value: "February", item: null },
    { label: "Marzo", value: "March", item: null },
    { label: "Abril", value: "April", item: null },
    { label: "Mayo", value: "May", item: null },
    { label: "Junio", value: "June", item: null },
    { label: "Julio", value: "July", item: null },
    { label: "Agosto", value: "August", item: null },
    { label: "Septiembre", value: "September", item: null },
    { label: "Octubre", value: "October", item: null },
    { label: "Noviembre", value: "November", item: null },
    { label: "Diciembre", value: "December", item: null },
  ];

  return (
    <div className="flex max-h-full w-full flex-col gap-4 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Total reservaciones
            </h3>
          }
          color="blue"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            12
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Proveedores contado
            </h3>
          }
          color="green"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            8
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Solicitudes crédito
            </h3>
          }
          color="sky"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            31
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Solicitudes contado
            </h3>
          }
          color="orange"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            19
          </div>
        </BaseCard>
      </div>

      <div className="max-w-sm p-4">
        <DropdownValues
          label="Periodo"
          value={periodo}
          onChange={setPeriodo}
          options={opcionesPeriodo}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-white p-3">
        <Table5<RegistroPreview>
          registros={registros}
          renderers={renderers}
          customColumns={customColumns}
          respectCustomColumnOrder={true}
          sortable={false}
          expandableColumns={[]}
          exportButton={true}
          isExport={false}
          horizontalScroll={true}
          maxHeight="calc(100vh - 320px)"
        />
      </div>
    </div>
  );
}
