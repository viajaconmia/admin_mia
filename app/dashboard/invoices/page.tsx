"use client";

import { useEffect, useState } from "react";
import { facturasService, ReservaSeleccion } from "@/angel/services/facturas";
import * as schema from "@/schemas/tables/facturas";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import { CompleteTable } from "@/v3/template/Table";
import { useAlert } from "@/context/useAlert";
import { FilterInput } from "@/component/atom/FilterInput";
import ModalDetalleFactura from "@/app/dashboard/invoices/_components/detalles";
import { useDescargarFactura } from "@/angel/hooks/useDescargarFactura";
import Modal from "@/components/organism/Modal";
import { ReservasPendientesFacturaContainer } from "@/angel/components/ReservasPendientesFacturaContainer";
import { fmtMoney } from "@/angel/lib/format/number";
import Button from "@/components/atom/Button";

const PAGE_SIZE = 50;

function ResumenSaldoFactura({
  saldo,
  seleccion,
}: {
  saldo: string;
  seleccion: ReservaSeleccion[];
}) {
  const totalSeleccionado = seleccion.reduce(
    (sum, r) => sum + Number(r.monto ?? 0),
    0,
  );
  const restante = Number(saldo) - totalSeleccionado;
  return (
    <div className="flex items-center gap-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm mb-4">
      <div>
        <span className="text-gray-500">Saldo factura: </span>
        <span className="font-semibold text-gray-800">{fmtMoney(saldo)}</span>
      </div>
      <div>
        <span className="text-gray-500">Seleccionado: </span>
        <span className="font-semibold text-blue-700">
          {fmtMoney(totalSeleccionado)}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Restante: </span>
        <span
          className={`font-semibold ${restante < 0 ? "text-red-600" : "text-green-700"}`}
        >
          {fmtMoney(restante)}
        </span>
      </div>
    </div>
  );
}

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
  const [seleccionAsignar, setSeleccionAsignar] = useState<ReservaSeleccion[]>(
    [],
  );
  const { error } = useAlert();
  const { handleDescargar } = useDescargarFactura();

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
        <Modal
          onClose={() => {
            setAsignarOpen(false);
            setSeleccionAsignar([]);
          }}
          title="Asigna la cantidad que deseas a las facturas"
          subtitle="Si quieres asignar montos parciales debes abrir los items de las reservas"
        >
          <ResumenSaldoFactura
            saldo={detalleFactura.saldo || null}
            seleccion={seleccionAsignar}
          />
          <ReservasPendientesFacturaContainer
            id_agente={(detalleFactura as any).id_agente}
            onSelectionChange={setSeleccionAsignar}
          />
          <Button
            onClick={() => {
              console.log(seleccionAsignar);
            }}
          >
            Asignar
          </Button>
        </Modal>
      )}
    </div>
  );
}
