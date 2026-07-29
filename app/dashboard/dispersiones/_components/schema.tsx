"use client";

import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Badge,
  MonoRenderer,
  BoldRenderer,
  TextRenderer,
  PrecioRenderer,
  DateRenderer,
  GetBadgeRenderer,
  PorcentajeRenderer,
} from "@/v3/atom/TableItemsComponent";
import { CuentaDispersion, DispersionItem } from "@/angel/services/dispersion";

export type { DispersionItem };

export type DispersionRow = {
  _seleccion: string; // "" cuando ya tiene comprobante (no seleccionable)
  codigo_dispersion: string;
  id: string;
  codigo_confirmacion: string;
  proveedor: string;
  cliente: string;
  monto_solicitado: number;
  px_venta: number;
  px_costo: number;
  markup: number;
  datos_bancarios: CuentaDispersion | null;
  url_comprobante: string | null;
};

export const mapDispersion = (raw: DispersionItem): DispersionRow => ({
  _seleccion: raw.url_comprobante
    ? ""
    : String(raw.id_dispersion_pagos_proveedor),
  codigo_dispersion: raw.codigo_dispersion,
  id: String(raw.id_solicitud_proveedor),
  proveedor: raw.proveedor,
  codigo_confirmacion: raw.codigo_confirmacion,
  cliente: raw.cliente,
  monto_solicitado: Number(raw.monto_solicitado || 0),
  px_venta: Number(raw.total),
  px_costo: Number(raw.costo_total),
  markup: Number(raw.markup),
  url_comprobante: raw.url_comprobante,
  datos_bancarios: raw.cuenta,
});

export const createDispersionRenderers = (
  seleccionarGrupo: (codigo: string) => void,
  toggleFila: (id: string) => void,
  estaSeleccionado: (id: string) => boolean,
) => ({
  _seleccion: ({ value }: { value: string }) =>
    value === "" ? (
      <div
        className="flex h-full w-full items-center justify-center"
        title="Ya tiene comprobante"
      >
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      </div>
    ) : (
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 hover:cursor-pointer hover:bg-black/30 transition-colors rounded-full"
          onClick={() => toggleFila(value)}
        >
          <Checkbox
            checked={estaSeleccionado(value)}
            onCheckedChange={() => {}}
          />
        </div>
      </div>
    ),
  datos_bancarios: ({ value }: { value: CuentaDispersion | null }) => {
    if (!value) {
      return <span className="text-xs text-gray-400">Sin cuenta</span>;
    }

    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="font-medium text-gray-800">
          {value.alias || value.banco || "Cuenta"}
        </span>
        {value.banco ? (
          <span className="text-gray-500">{value.banco}</span>
        ) : null}
        {value.cuenta ? (
          <span className="text-gray-500">{value.cuenta}</span>
        ) : null}
      </div>
    );
  },
  codigo_dispersion: ({ value }: { value: string }) => (
    <button
      type="button"
      onClick={() => seleccionarGrupo(value)}
      title="Seleccionar todas las filas pendientes de este código"
    >
      <Badge
        label={value}
        style="bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 cursor-pointer"
      />
    </button>
  ),
  id: MonoRenderer,
  codigo_confirmacion: MonoRenderer,
  proveedor: BoldRenderer,
  cliente: TextRenderer,
  monto_solicitado: PrecioRenderer,
  px_venta: PrecioRenderer,
  px_costo: PrecioRenderer,
  markup: PorcentajeRenderer,
  url_comprobante: ({ value }: { value: string | null }) =>
    value ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-xs font-medium"
      >
        Ver
      </a>
    ) : (
      <span className="text-gray-400 text-xs">Pendiente</span>
    ),
});
