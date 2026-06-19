"use client";

import { useEffect, useState } from "react";
import { ProveedorRaw, ProveedoresService } from "@/services/ProveedoresService";
import { useAlert } from "@/context/useAlert";
import { FilterInput } from "@/component/atom/FilterInput";
import { CompleteTable } from "@/v3/template/Table";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import * as schema from "@/schemas/tables/proveedores_finanzas";
import { ModalProveedor } from "./_components/ModalProveedor";
import Button from "@/components/atom/Button";
import { Download } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  vuelo: "Vuelo",
  renta_carro: "Renta carro",
  hotel: "Hotel",
};

const exportarCSV = (proveedores: ProveedorRaw[]) => {
  const headers = [
    "Proveedor", "Tipo", "Estatus", "Tipo de pago",
    "Convenio", "Ciudad", "Estado", "País", "RFC(s)",
    "Días de crédito", "Creado",
  ];
  const rows = proveedores.flatMap((p) => {
    const rfcs = p.rfcs ? p.rfcs.split(",").map((r) => r.trim()).filter(Boolean) : [""];
    return rfcs.map((rfc) => [
      p.proveedor,
      p.type ? TYPE_LABELS[p.type] : "",
      p.estatus === 1 ? "Activo" : "Inactivo",
      p.tipo_pago ?? "",
      p.convenio === 1 ? "Sí" : "No",
      p.ciudad ?? "",
      p.estado ?? "",
      p.pais ?? "",
      rfc,
      p.vencimiento_credito ?? "",
      p.created_at?.split("T")[0] ?? "",
    ]);
  });

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proveedores_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

type Filtros = {
  proveedor?: string;
  type?: string;
  status?: string;
  rfc?: string;
  negociacion?: string;
};

const PAGE_SIZE = 50;

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [selected, setSelected] = useState<ProveedorRaw | null>(null);
  const [exportando, setExportando] = useState(false);
  const { showNotification } = useAlert();

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  const fetchProveedores = async (page: number = tracking.page) => {
    setLoading(true);
    ProveedoresService.getInstance()
      .getProveedores({ ...filtros, page, size: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setProveedores(data);
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((err) =>
        showNotification(
          "error",
          err.message || "Error al obtener los proveedores",
        ),
      )
      .finally(() => setLoading(false));
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      const { data } = await ProveedoresService.getInstance().getProveedores(filtros);
      exportarCSV(data);
    } catch (err) {
      showNotification("error", err.message || "Error al exportar");
    } finally {
      setExportando(false);
    }
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
    setFiltros((prev) => ({ ...prev, [propiedad]: value }));
  };

  return (
    <>
      <ModalProveedor proveedor={selected} onClose={() => setSelected(null)} />

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
          <div className="grid md:grid-cols-4 gap-4">
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
              type="select"
              onChange={handleFilterChange}
              propiedad="type"
              value={filtros.type || null}
              label="Tipo"
              options={["vuelo", "renta_carro", "hotel"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="status"
              value={filtros.status || null}
              label="Estado"
              options={["activo", "inactivo"]}
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="negociacion"
              value={filtros.negociacion || null}
              label="Tipo de negociación"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              onClick={handleExportar}
              disabled={exportando}
            >
              {exportando ? "Exportando..." : "Exportar CSV"}
            </Button>
          </div>
        </div>

        <CompleteTable<schema.ProveedorItem>
          pageTracking={tracking}
          fetchData={fetchProveedores}
          registros={proveedores.map(schema.mapProveedorItem)}
          loading={loading}
          renderers={schema.createRenderers({ onVerProveedor: setSelected })}
        />
      </div>
    </>
  );
}
