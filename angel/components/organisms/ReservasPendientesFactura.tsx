"use client";

import { CompleteTable } from "@/v3/template/Table";
import { FiltrosReservasPendientes } from "@/angel/services/facturas";
import { ItemsRelacionModal } from "@/angel/components/organisms/ItemsRelacionModal";
import { useReservasPendientesData } from "@/angel/hooks/useReservasPendientesData";
import { useReservasSeleccion } from "@/angel/hooks/useReservasSeleccion";
import {
  ReservaItem,
  mapReserva,
  createReservasPendientesRenderers,
} from "@/angel/schemas/tables/reservas_pendientes";
import { useReservasPendientes } from "@/angel/context/ReservasPendientesContext";
import { useEffect, useMemo } from "react";

type Props = {
  filtros: FiltrosReservasPendientes;
  saldo?: number;
  hiddenHeaders?: boolean;
};

export function ReservasPendientesFactura({
  filtros,
  saldo,
  hiddenHeaders = false,
}: Props) {
  const { reservas, loading, error, tracking, fetchReservas } =
    useReservasPendientesData(filtros);

  const {
    seleccionadas,
    itemsSeleccionados,
    modalRelacionId,
    setModalRelacionId,
    toggleCompleta,
    handleConfirmarParcial,
  } = useReservasSeleccion(reservas);

  const { seleccion, limpiar } = useReservasPendientes();

  const saldoDisponibleParaModal = useMemo(() => {
    if (saldo == null || !modalRelacionId) return saldo;
    const comprometidoOtros = seleccion
      .filter((r) => r.id_relacion !== modalRelacionId)
      .reduce((sum, r) => sum + Number(r.monto ?? 0), 0);
    return saldo - comprometidoOtros;
  }, [saldo, modalRelacionId, seleccion]);

  const renderers = createReservasPendientesRenderers({
    seleccionadas,
    itemsSeleccionados,
    toggleCompleta,
    setModalRelacionId,
  });

  useEffect(() => {
    return () => limpiar();
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
      <CompleteTable<ReservaItem>
        pageTracking={tracking}
        fetchData={fetchReservas}
        registros={reservas.map(mapReserva)}
        loading={loading}
        renderers={renderers}
        hiddenHeaders={hiddenHeaders}
      />

      {modalRelacionId && (
        <ItemsRelacionModal
          saldo={saldoDisponibleParaModal}
          id_relacion={modalRelacionId}
          onConfirm={handleConfirmarParcial}
          onClose={() => setModalRelacionId(null)}
        />
      )}
    </>
  );
}
