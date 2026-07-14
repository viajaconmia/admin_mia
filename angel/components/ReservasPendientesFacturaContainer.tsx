"use client";

import React, { useEffect, useState } from "react";
import {
  facturasService,
  ReservaPendienteFacturar,
  ReservaSeleccion,
} from "@/angel/services/facturas";
import { ReservasPendientesFacturaTable } from "./ReservasPendientesFacturaTable";

type Props = {
  id_agente: string;
  onSelectionChange?: (seleccion: ReservaSeleccion[]) => void;
};

export function ReservasPendientesFacturaContainer({ id_agente, onSelectionChange }: Props) {
  const [reservas, setReservas] = useState<ReservaPendienteFacturar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_agente) return;

    setLoading(true);
    setError(null);

    facturasService
      .getReservasPendientesFacturar(id_agente)
      .then(({ data }) => {
        const result = data ?? [];
        console.log("reservas_pendientes_facturar:", result);
        setReservas(result);
      })
      .catch((err) => setError(err.message || "Error al cargar reservas"))
      .finally(() => setLoading(false));
  }, [id_agente]);

  return (
    <ReservasPendientesFacturaTable
      reservas={reservas}
      loading={loading}
      error={error}
      onSelectionChange={onSelectionChange}
    />
  );
}
