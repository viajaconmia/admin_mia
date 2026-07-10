"use client";

import { useEffect, useState } from "react";
import { facturasService } from "@/angel/services/facturas";
import * as schema from "@/schemas/tables/facturas";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import { CompleteTable } from "@/v3/template/Table";
import { useAlert } from "@/context/useAlert";
import { FilterInput } from "@/component/atom/FilterInput";
import useApi from "@/hooks/useApi";
import ModalDetalleFactura from "@/app/dashboard/invoices/_components/detalles";
import Modal from "@/components/organism/Modal";
import { ReservasPendientesFacturaContainer } from "@/angel/components/ReservasPendientesFacturaContainer";

const PAGE_SIZE = 50;

type Filtros = {
  estatusFactura?: "Confirmada" | "Cancelada" | "En proceso" | "Sin Asignar";
  id_factura?: string;
  id_cliente?: string;
  cliente?: string;
  uuid?: string;
  rfc?: string;
  startDate?: string;
  endDate?: string;
};

export default function InvoicesPage() {
  const [facturas, setFacturas] = useState<schema.FacturaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [needRefresh, setNeedRefresh] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalleFactura, setDetalleFactura] =
    useState<schema.FacturaFiltradaRaw | null>(null);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const { error } = useAlert();
  const { descargarFactura, descargarFacturaXML } = useApi();

  const handleDescargar = async (
    id_facturama: string,
    tipo: "pdf" | "xml",
    nombre = "factura",
  ) => {
    try {
      if (tipo === "pdf") {
        const obj = await descargarFactura(id_facturama);
        const a = document.createElement("a");
        a.href = `data:application/pdf;base64,${obj.Content}`;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      } else {
        const obj = await descargarFacturaXML(id_facturama);
        const a = document.createElement("a");
        a.href = `data:application/xml;base64,${obj.Content}`;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      }
    } catch {
      error("Error al descargar la factura");
    }
  };

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  const fetchFacturas = async (page: number = tracking.page) => {
    setLoading(true);
    facturasService
      .filtrarFacturas({ ...filtros, page, length: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setFacturas((data ?? []).map((factura) => schema.mapFactura(factura)));
        setTracking((prev) => ({
          ...prev,
          page,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((er) => error(er.message || "Error al obtener las facturas"))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (value: string | null, propiedad: string) => {
    if (value == null) {
      setFiltros((prev) => {
        const next = { ...prev };
        delete next[propiedad as keyof Filtros];
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
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="id_factura"
            value={filtros.id_factura || null}
            label="ID Factura"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="id_cliente"
            value={filtros.id_cliente || null}
            label="ID Cliente"
          />
          <FilterInput
            type="text"
            onChange={handleFilterChange}
            propiedad="cliente"
            value={filtros.cliente || null}
            label="Cliente"
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
            type="select"
            onChange={handleFilterChange}
            propiedad="estatusFactura"
            value={filtros.estatusFactura || null}
            label="Estatus"
            options={["Confirmada", "Cancelada", "En proceso", "Sin Asignar"]}
          />
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="startDate"
            value={filtros.startDate || null}
            label="Fecha inicio"
          />
          <FilterInput
            type="date"
            onChange={handleFilterChange}
            propiedad="endDate"
            value={filtros.endDate || null}
            label="Fecha fin"
          />
        </div>
      </div>

      <CompleteTable<schema.FacturaItem>
        pageTracking={tracking}
        fetchData={fetchFacturas}
        registros={facturas}
        loading={loading}
        renderers={schema.createFacturaRenderers({
          onDescargar: handleDescargar,
          onVerDetalle: (id, factura) => {
            setDetalleId(id);
            setDetalleFactura(factura);
          },
          onAsignar: (_, factura) => {
            setDetalleFactura(factura);
            setAsignarOpen(true);
          },
        })}
      />

      <ModalDetalleFactura
        open={detalleId !== null}
        onClose={() => {
          if (needRefresh) {
            fetchFacturas();
            setNeedRefresh(false);
          }
          setDetalleId(null);
          setDetalleFactura(null);
        }}
        onDelete={() => setNeedRefresh(true)}
        id_factura={detalleId}
      />

      {asignarOpen && detalleFactura && (
        <Modal onClose={() => setAsignarOpen(false)}>
          <ReservasPendientesFacturaContainer
            id_agente={(detalleFactura as any).id_agente}
          />
        </Modal>
      )}
    </div>
  );
}
