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
  comprobante_cuenta: string | null;
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
  comprobante_cuenta: raw.cuenta?.url_caratula ?? null,
});

const VerComprobante = ({
  value,
  emptyLabel = "Pendiente",
}: {
  value: string | null;
  emptyLabel?: string;
}) =>
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
    <span className="text-gray-400 text-xs">{emptyLabel}</span>
  );

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
  url_comprobante: ({ value }: { value: string | null }) => (
    <VerComprobante value={value} emptyLabel="Pendiente" />
  ),
  comprobante_cuenta: ({ value }: { value: string | null }) => (
    <VerComprobante value={value} emptyLabel="Sin carátula" />
  ),
});

export const createDispersionCard = (
  seleccionarGrupo: (codigo: string) => void,
  toggleFila: (id: string) => void,
  estaSeleccionado: (id: string) => boolean,
) => (item: DispersionRow) => {
  const seleccionable = item._seleccion !== "";
  const seleccionado = seleccionable && estaSeleccionado(item._seleccion);

  return (
    <div
      onClick={() => seleccionable && toggleFila(item._seleccion)}
      className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors ${
        seleccionable ? "cursor-pointer" : ""
      } ${
        seleccionado
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            seleccionarGrupo(item.codigo_dispersion);
          }}
          title="Seleccionar todas las filas pendientes de este código"
        >
          <Badge
            label={item.codigo_dispersion}
            style="bg-blue-100 text-blue-700 border border-blue-300"
          />
        </button>

        {seleccionable ? (
          <Checkbox checked={seleccionado} onCheckedChange={() => {}} />
        ) : (
          <div
            className="flex items-center justify-center"
            title="Ya tiene comprobante"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <BoldRenderer value={item.proveedor} />
        <MonoRenderer value={item.codigo_confirmacion} />
      </div>
      <TextRenderer value={item.cliente} />

      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Solicitado
          </p>
          <PrecioRenderer value={item.monto_solicitado} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Venta
          </p>
          <PrecioRenderer value={item.px_venta} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Costo
          </p>
          <PrecioRenderer value={item.px_costo} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <PorcentajeRenderer value={item.markup} />
        {item.url_comprobante ? (
          <a
            href={item.url_comprobante}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Ver comprobante
          </a>
        ) : (
          <span className="text-xs text-gray-400">Pendiente comprobante</span>
        )}
      </div>

      {item.datos_bancarios && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs leading-tight text-gray-500">
          <span>
            <span className="font-medium text-gray-700">
              {item.datos_bancarios.alias || item.datos_bancarios.banco || "Cuenta"}
            </span>
            {item.datos_bancarios.cuenta ? ` · ${item.datos_bancarios.cuenta}` : ""}
          </span>
          <span onClick={(e) => e.stopPropagation()}>
            <VerComprobante
              value={item.comprobante_cuenta}
              emptyLabel="Sin carátula"
            />
          </span>
        </div>
      )}
    </div>
  );
};
