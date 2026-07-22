"use client";

import { useEffect, useState } from "react";
import {
  pagoProveedorService,
  FiltrosReservasProveedor,
} from "@/angel/services/pago_proveedor";
import { CompleteTable } from "@/v3/template/Table";
import { FilterInput } from "@/component/atom/FilterInput";
import { FiltrosPanel } from "@/angel/components/molecules/FiltrosPanel";
import { AccionesSeleccion } from "@/angel/components/molecules/AccionesSeleccion";
import { useSeleccionTabla } from "@/angel/hooks/useSeleccionTabla";
import { useAlert } from "@/context/useAlert";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SolicitudProveedorItem,
  mapSolicitud,
  createSolicitudRenderers,
} from "./_components/schema";
import Button from "@/components/atom/Button";

export default function ReservasProveedorPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudProveedorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [filtros, setFiltros] = useState<FiltrosReservasProveedor>({});
  const { error } = useAlert();
  const { seleccionados, toggleFila, limpiar, estaSeleccionado, toggleTodos } =
    useSeleccionTabla<SolicitudProveedorItem>((item) => item._seleccion);

  const renderers = {
    _seleccion: ({ value }: { value: string }) => (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 hover:cursor-pointer hover:bg-black/10 transition-colors rounded-full"
          onClick={() => toggleFila(value)}
        >
          <Checkbox
            checked={estaSeleccionado(value)}
            onCheckedChange={() => {}}
          />
        </div>
      </div>
    ),
    ...createSolicitudRenderers(),
  };

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
      <FiltrosPanel
        always={
          <>
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
              type="select"
              onChange={handleFilterChange}
              propiedad="estado_solicitud"
              value={filtros.estado_solicitud || null}
              label="Estado solicitud"
              options={[
                "PAGADO LINK",
                "PAGADO TARJETA",
                "PAGADO TRANSFERENCIA",
                "CANCELADA",
                "TRANSFERENCIA_SOLICITADA",
                "CUPON ENVIADO",
                "CARTA_ENVIADA",
                "SOLICITADA",
                "DISPERSION",
              ]}
            />
          </>
        }
        extra={
          <>
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
          </>
        }
      />

      <CompleteTable<SolicitudProveedorItem>
        pageTracking={tracking}
        label={`Reservas proveedor (${tracking.total})`}
        fetchData={fetchSolicitudes}
        registros={solicitudes}
        loading={loading}
        renderers={renderers}
      />

      <AccionesSeleccion count={seleccionados.length} onLimpiar={limpiar}>
        <Button
          onClick={() => toggleTodos(solicitudes)}
          variant="secondary"
          size="sm"
        >
          {seleccionados.length === solicitudes.length
            ? "Deseleccionar todos"
            : "Seleccionar todos"}
        </Button>
      </AccionesSeleccion>
    </div>
  );
}

const PAGE_SIZE = 100;
