"use client";

import React from "react";
import { NemoHotelSearch } from "@/components/organism/NemoHotelSearch";
import { Building2 } from "lucide-react";

export default function NemoHotelesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            Hoteles Nemo (PriceSurfer)
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Consulta disponibilidad, tipos de habitación y tarifas en tiempo real
          directamente desde el proveedor Nemo para operaciones y cotizaciones.
        </p>
      </div>

      {/* Componente Atómico de Búsqueda */}
      <NemoHotelSearch />
    </div>
  );
}
