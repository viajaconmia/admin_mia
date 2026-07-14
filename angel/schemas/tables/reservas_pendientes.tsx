"use client";

import { Precio } from "@/v3/atom/TableItemsComponent";
import Button from "@/components/atom/Button";
import { SplitSquareHorizontal } from "lucide-react";
import { ItemPendienteFacturar, ReservaPendienteFacturar } from "@/angel/services/facturas";

export type ReservaItem = {
  seleccionado: string;
  codigo_confirmacion: string;
  proveedor: string;
  metodo_pago: string;
  total: string;
  pendiente_facturar: string;
  acciones: string;
};

export const mapReserva = (r: ReservaPendienteFacturar): ReservaItem => ({
  seleccionado: r.id_relacion,
  codigo_confirmacion: r.codigo_confirmacion,
  proveedor: r.proveedor,
  metodo_pago: r.metodo_pago,
  total: r.total,
  pendiente_facturar: r.pendiente_facturar,
  acciones: r.id_relacion,
});

type RendererOpts = {
  seleccionadas: Record<string, "completa" | "parcial">;
  itemsSeleccionados: Record<string, ItemPendienteFacturar[]>;
  toggleCompleta: (id: string) => void;
  setModalRelacionId: (id: string) => void;
};

export const createReservasPendientesRenderers = ({
  seleccionadas,
  itemsSeleccionados,
  toggleCompleta,
  setModalRelacionId,
}: RendererOpts) => ({
  seleccionado: ({ value }: { value: string }) => (
    <input
      type="checkbox"
      className="w-4 h-4 accent-blue-600 cursor-pointer"
      checked={!!seleccionadas[value]}
      onChange={() => toggleCompleta(value)}
    />
  ),
  total: ({ value }: { value: string }) => <Precio value={value} />,
  pendiente_facturar: ({ value }: { value: string }) => (
    <span className={Number(value) > 0 ? "font-semibold text-amber-600" : "text-gray-400"}>
      <Precio value={value} />
    </span>
  ),
  metodo_pago: ({ value }: { value: string }) => (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
      {value}
    </span>
  ),
  acciones: ({ value }: { value: string }) => {
    const itemsCount = itemsSeleccionados[value]?.length ?? 0;
    return (
      <Button
        size="sm"
        variant={seleccionadas[value] === "parcial" ? "primary" : "secondary"}
        icon={SplitSquareHorizontal}
        onClick={() => setModalRelacionId(value)}
      >
        {seleccionadas[value] === "parcial" ? `Parcial (${itemsCount})` : "Parcial"}
      </Button>
    );
  },
});
