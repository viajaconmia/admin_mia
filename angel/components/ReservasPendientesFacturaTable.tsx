"use client";

import React from "react";
import { ReservaPendienteFacturar } from "@/angel/services/facturas";

type Props = {
  reservas: ReservaPendienteFacturar[];
  loading: boolean;
  error: string | null;
};

export function ReservasPendientesFacturaTable({ reservas, loading, error }: Props) {
  if (loading) return <p className="text-sm text-gray-500">Cargando...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (reservas.length === 0) return <p className="text-sm text-gray-400">Sin reservas pendientes.</p>;

  return (
    <div>
      {/* aquí va la tabla */}
    </div>
  );
}
