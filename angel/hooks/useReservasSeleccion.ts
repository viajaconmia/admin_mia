import { useEffect, useState } from "react";
import {
  ItemPendienteFacturar,
  ReservaPendienteFacturar,
  ReservaSeleccion,
} from "@/angel/services/facturas";
import { useReservasPendientes } from "@/angel/context/ReservasPendientesContext";

export function useReservasSeleccion(reservas: ReservaPendienteFacturar[]) {
  const { setSeleccion } = useReservasPendientes();

  const [seleccionadas, setSeleccionadas] = useState<Record<string, "completa" | "parcial">>({});
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Record<string, ItemPendienteFacturar[]>>({});
  const [modalRelacionId, setModalRelacionId] = useState<string | null>(null);

  // Sync local selection to context after render, never inside a state updater
  useEffect(() => {
    const seleccion: ReservaSeleccion[] = Object.entries(seleccionadas).map(([id_relacion, tipo]) => {
      const monto =
        tipo === "completa"
          ? (reservas.find((r) => r.id_relacion === id_relacion)?.pendiente_facturar ?? "0")
          : (itemsSeleccionados[id_relacion]?.reduce((s, i) => s + Number(i.monto_asignar ?? i.monto_por_facturar), 0).toString() ?? "0");
      return {
        id_relacion,
        tipo,
        monto,
        ...(tipo === "parcial" ? { items: itemsSeleccionados[id_relacion] ?? [] } : {}),
      };
    });
    setSeleccion(seleccion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionadas, itemsSeleccionados]);

  const toggleCompleta = (id: string) => {
    setSeleccionadas((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "completa";
      return next;
    });
  };

  const handleConfirmarParcial = (items: ItemPendienteFacturar[]) => {
    if (!modalRelacionId) return;
    const id = modalRelacionId;
    setItemsSeleccionados((prev) => ({ ...prev, [id]: items }));
    setSeleccionadas((prev) => ({ ...prev, [id]: "parcial" as const }));
  };

  return {
    seleccionadas,
    itemsSeleccionados,
    modalRelacionId,
    setModalRelacionId,
    toggleCompleta,
    handleConfirmarParcial,
  };
}
