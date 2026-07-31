"use client";

import { useEffect, useState } from "react";
import { facturasService } from "@/angel/services/facturas";
import * as schema from "@/schemas/tables/facturas";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import { CompleteTable } from "@/v3/template/Table";
import { useAlert } from "@/context/useAlert";
import { FilterInput } from "@/component/atom/FilterInput";
import ModalDetalleFactura from "@/app/dashboard/invoices/_components/detalles";
import { ModalCancelarFactura } from "@/app/dashboard/invoices/_components/traveler_main";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { useDescargarFactura } from "@/angel/hooks/useDescargarFactura";
import Modal from "@/components/organism/Modal";
import { ReservasPendientesFactura } from "@/angel/components/organisms/ReservasPendientesFactura";
import {
  ReservasPendientesProvider,
  useReservasPendientes,
} from "@/angel/context/ReservasPendientesContext";
import Button from "@/components/atom/Button";
import { ResumenSaldoFactura } from "@/angel/components/molecules/ResumenSaldoFactura";
import { CheckCircle2, Download } from "lucide-react";
import { useFile } from "@/hooks/useFile";

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
  const [cancelarFacturaId, setCancelarFacturaId] = useState<string | null>(null);
  const { error } = useAlert();
  const { handleDescargar } = useDescargarFactura();
  const { hasPermission } = usePermiso();
  const { csv, loadingFile, setLoadingFile } = useFile();

  const handleExport = async () => {
    setLoadingFile(true);
    facturasService
      .filtrarFacturas({ ...filtros })
      .then(({ data }) => {
        const rows = (data ?? []).map((f) => ({
          id_factura: f.id_factura,
          folio: f.folio ?? "",
          uuid: f.uuid_factura,
          estado: f.estado,
          estado_sat: f.estado_sat,
          cliente: f.nombre_cliente ?? f.razon_social ?? f.nombre_receptor ?? "",
          rfc: f.rfc_receptor || f.rfc,
          subtotal: f.subtotal,
          impuestos: f.impuestos,
          total: f.total,
          saldo: f.saldo_insoluto ?? f.saldo,
          saldo_x_items: f.saldo_x_aplicar_items,
          fecha_emision: f.fecha_emision,
          fecha_timbrado: f.fecha_timbrado ?? "",
          fecha_vencimiento: f.fecha_vencimiento ?? "",
          id_facturama: f.id_facturama ?? "",
          id_agente: f.id_agente ?? "",
        }));
        csv(rows, "Facturas");
      })
      .catch((er) => error(er.message || "Error al exportar"))
      .finally(() => setLoadingFile(false));
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
        <div className="flex justify-end">
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExport}
            disabled={loadingFile}
          >
            {loadingFile ? "Exportando..." : "Exportar CSV"}
          </Button>
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
          onCancelar: hasPermission(PERMISOS.COMPONENTES.BOTON.ACTUALIZAR_PDF_FACTURA)
            ? (id) => setCancelarFacturaId(id)
            : undefined,
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
        <ReservasPendientesProvider>
          <AsignarFacturaModal
            factura={detalleFactura}
            onClose={() => setAsignarOpen(false)}
            onSuccess={() => fetchFacturas()}
          />
        </ReservasPendientesProvider>
      )}

      {cancelarFacturaId && (
        <Modal onClose={() => setCancelarFacturaId(null)} title="Cancelar factura">
          <ModalCancelarFactura
            id={cancelarFacturaId}
            onClose={() => setCancelarFacturaId(null)}
            onConfirm={() => {
              fetchFacturas();
              setCancelarFacturaId(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

const PAGE_SIZE = 50;

function AsignarFacturaModal({
  factura,
  onClose,
  onSuccess,
}: {
  factura: schema.FacturaFiltradaRaw;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { seleccion } = useReservasPendientes();
  const { error: alertError, success } = useAlert();
  const [asignando, setAsignando] = useState(false);

  const handleAsignar = async () => {
    // Construir selección válida: completas con monto > 0, parciales con items con monto > 0
    const seleccionFiltrada = seleccion
      .map((r) => {
        if (r.tipo === "completa") return r;
        return {
          ...r,
          items: (r.items ?? []).filter((i) => Number(i.monto_asignar) > 0),
        };
      })
      .filter((r) =>
        r.tipo === "completa"
          ? Number(r.monto) > 0
          : (r.items ?? []).length > 0,
      );

    if (seleccionFiltrada.length === 0) {
      alertError("Selecciona al menos una reserva o item con monto mayor a 0");
      return;
    }

    const totalAsignar = seleccionFiltrada.reduce(
      (sum, r) => sum + Number(r.monto),
      0,
    );
    const saldoDisponible = Number(factura.saldo_x_aplicar_items || 0);

    if (Math.round(totalAsignar * 100) > Math.round(saldoDisponible * 100)) {
      alertError(
        `El monto a asignar ($${totalAsignar.toFixed(2)}) supera el saldo disponible ($${saldoDisponible.toFixed(2)})`,
      );
      return;
    }

    setAsignando(true);
    facturasService
      .asignarItemsFactura({ id_factura: factura.id_factura, seleccion: seleccionFiltrada })
      .then(() => {
        success("Asignación realizada correctamente");
        onSuccess();
        onClose();
      })
      .catch((err) => alertError(err.message || "Error al asignar"))
      .finally(() => setAsignando(false));
  };

  return (
    <Modal
      onClose={onClose}
      title="Asigna la cantidad que deseas a las facturas"
      subtitle="Si quieres asignar montos parciales debes abrir los items de las reservas"
    >
      <div className="flex justify-between items-center gap-4">
        <ResumenSaldoFactura
          saldo={Number(factura.saldo_x_aplicar_items || 0)}
          seleccionado={seleccion.reduce(
            (sum, r) => sum + Number(r.monto ?? 0),
            0,
          )}
          labelSaldo="Saldo factura"
        />
        <Button onClick={handleAsignar} icon={CheckCircle2} disabled={asignando} loading={asignando}>
          Asignar a factura
        </Button>
      </div>
      <ReservasPendientesFactura
        filtros={{ id_agente: factura.id_agente }}
        saldo={Number(factura.saldo_x_aplicar_items || 0)}
        hiddenHeaders={true}
      />
    </Modal>
  );
}
