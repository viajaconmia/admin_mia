"use client";

import { useEffect, useState } from "react";
import { pagoProveedorService, FiltrosReservasProveedor } from "@/angel/services/pago_proveedor";
import { CompleteTable } from "@/v3/template/Table";
import { FilterInput } from "@/component/atom/FilterInput";
import { useAlert } from "@/context/useAlert";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import {
  SolicitudProveedorItem,
  mapSolicitud,
  createSolicitudRenderers,
} from "./_components/schema";

export default function ReservasProveedorPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudProveedorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [filtros, setFiltros] = useState<FiltrosReservasProveedor>({});
  const { error } = useAlert();

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  const fetchSolicitudes = (page: number = tracking.page) => {
    setLoading(true);
    pagoProveedorService
      .getReservas({ ...filtros, page, length: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setSolicitudes((data ?? []).map(mapSolicitud));
        setTracking((prev) => ({
          ...prev,
          page,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((er) => error(er.message || "Error al obtener las reservas"))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (value: string | null, propiedad: string) => {
    if (value == null) {
      setFiltros((prev) => {
        const next = { ...prev };
        delete next[propiedad as keyof FiltrosReservasProveedor];
        return next;
      });
      return;
    }
    setFiltros((prev) => ({ ...prev, [propiedad]: value as any }));
  };

  return (
    <div className="space-y-4 bg-white">
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Texto */}
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="codigo_confirmacion"
            value={filtros.codigo_confirmacion || null}
            label="Confirmación"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="cliente"
            value={filtros.cliente || null}
            label="Agente / Cliente"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="proveedor"
            value={filtros.proveedor || null}
            label="Proveedor"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="rfc"
            value={filtros.rfc || null}
            label="RFC"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="uuid"
            value={filtros.uuid || null}
            label="UUID"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="tipo_negociacion"
            value={filtros.tipo_negociacion || null}
            label="Tipo negociación"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="notas_internas"
            value={filtros.notas_internas || null}
            label="Notas internas"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="comentarios_ops"
            value={filtros.comentarios_ops || null}
            label="Comentarios OPS"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="comentarios_cxp"
            value={filtros.comentarios_cxp || null}
            label="Comentarios CXP"
          />

          {/* Select */}
          <FilterInput
            type="select"
            onChange={handleFilterChange}
            propiedad="servicio"
            value={filtros.servicio || null}
            label="Tipo de servicio"
            options={["flyght", "car_rental", "hotel"]}
          />
          <FilterInput
            type="select"
            onChange={handleFilterChange}
            propiedad="estado_solicitud"
            value={filtros.estado_solicitud || null}
            label="Estado solicitud"
            options={["PAGADO LINK","PAGADO TARJETA","PAGADO TRANSFERENCIA","CANCELADA","TRANSFERENCIA_SOLICITADA","CUPON ENVIADO","CARTA_ENVIADA","SOLICITADA","DISPERSION"]}
          />
          <FilterInput
            type="select"
            onChange={handleFilterChange}
            propiedad="estado_facturacion"
            value={filtros.estado_facturacion || null}
            label="Estado facturación"
            options={["pendiente", "facturado", "parcial"]}
          />
          <FilterInput
            type="select"
            onChange={handleFilterChange}
            propiedad="forma_pago"
            value={filtros.forma_pago || null}
            label="Forma de pago"
            options={["credit", "contado"]}
          />

          {/* Fechas de creación */}
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="fecha_inicio_creacion"
            value={filtros.fecha_inicio_creacion || null}
            label="Creación desde"
          />
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="fecha_fin_creacion"
            value={filtros.fecha_fin_creacion || null}
            label="Creación hasta"
          />

          {/* Fechas de solicitud */}
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="fecha_solicitud_inicio"
            value={filtros.fecha_solicitud_inicio || null}
            label="Solicitud desde"
          />
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="fecha_solicitud_fin"
            value={filtros.fecha_solicitud_fin || null}
            label="Solicitud hasta"
          />
        </div>
      </div>

      <CompleteTable<SolicitudProveedorItem>
        pageTracking={tracking}
        fetchData={fetchSolicitudes}
        registros={solicitudes}
        loading={loading}
        renderers={createSolicitudRenderers()}
      />
    </div>
  );
}

const PAGE_SIZE = 50;
