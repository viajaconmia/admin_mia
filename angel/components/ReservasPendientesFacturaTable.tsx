"use client";

import { useState } from "react";
import { CompleteTable } from "@/v3/template/Table";
import {
  ItemPendienteFacturar,
  ReservaPendienteFacturar,
  ReservaSeleccion,
} from "@/angel/services/facturas";
import { Precio } from "@/v3/atom/TableItemsComponent";
import Button from "@/components/atom/Button";
import { SplitSquareHorizontal } from "lucide-react";
import { ItemsRelacionModal } from "./ItemsRelacionModal";

type Props = {
  reservas: ReservaPendienteFacturar[];
  loading: boolean;
  error: string | null;
  onSelectionChange?: (seleccion: ReservaSeleccion[]) => void;
};

type ReservaItem = {
  seleccionado: string;
  codigo_confirmacion: string;
  proveedor: string;
  metodo_pago: string;
  total: string;
  pendiente_facturar: string;
  acciones: string;
};

const mapReserva = (r: ReservaPendienteFacturar): ReservaItem => ({
  seleccionado: r.id_relacion,
  codigo_confirmacion: r.codigo_confirmacion,
  proveedor: r.proveedor,
  metodo_pago: r.metodo_pago,
  total: r.total,
  pendiente_facturar: r.pendiente_facturar,
  acciones: r.id_relacion,
});

export function ReservasPendientesFacturaTable({
  reservas,
  loading,
  error,
  onSelectionChange,
}: Props) {
  const [seleccionadas, setSeleccionadas] = useState<
    Record<string, "completa" | "parcial">
  >({});
  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    Record<string, ItemPendienteFacturar[]>
  >({});
  const [modalRelacionId, setModalRelacionId] = useState<string | null>(null);

  const emitir = (
    next: Record<string, "completa" | "parcial">,
    nextItems: Record<string, ItemPendienteFacturar[]>,
  ) => {
    const seleccion: ReservaSeleccion[] = Object.entries(next).map(
      ([id_relacion, tipo]) => {
        const monto =
          tipo === "completa"
            ? (reservas.find((r) => r.id_relacion === id_relacion)?.pendiente_facturar ?? "0")
            : (nextItems[id_relacion]?.reduce((s, i) => s + Number(i.monto_asignar ?? i.monto_por_facturar), 0).toString() ?? "0");
        return {
          id_relacion,
          tipo,
          monto,
          ...(tipo === "parcial" ? { items: nextItems[id_relacion] ?? [] } : {}),
        };
      },
    );
    onSelectionChange?.(seleccion);
  };

  const toggleCompleta = (id: string) => {
    setSeleccionadas((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = "completa";
      }
      emitir(next, itemsSeleccionados);
      return next;
    });
  };

  const handleConfirmarParcial = (items: ItemPendienteFacturar[]) => {
    if (!modalRelacionId) return;
    const id = modalRelacionId;
    setItemsSeleccionados((prevItems) => {
      const nextItems = { ...prevItems, [id]: items };
      setSeleccionadas((prev) => {
        const next = { ...prev, [id]: "parcial" as const };
        emitir(next, nextItems);
        return next;
      });
      return nextItems;
    });
  };

  const renderers = {
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
      <span
        className={
          Number(value) > 0 ? "font-semibold text-amber-600" : "text-gray-400"
        }
      >
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
          {seleccionadas[value] === "parcial"
            ? `Parcial (${itemsCount})`
            : "Parcial"}
        </Button>
      );
    },
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
      <CompleteTable<ReservaItem>
        pageTracking={{ total: reservas.length, page: 1, total_pages: 1 }}
        fetchData={() => {}}
        registros={reservas.map(mapReserva)}
        loading={loading}
        renderers={renderers}
      />

      {modalRelacionId && (
        <ItemsRelacionModal
          id_relacion={modalRelacionId}
          onConfirm={handleConfirmarParcial}
          onClose={() => setModalRelacionId(null)}
        />
      )}
    </>
  );
}
