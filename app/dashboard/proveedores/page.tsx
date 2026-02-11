"use client";

import React, { useEffect, useState } from "react";
import { formatDate } from "@/helpers/utils";
import {
  Proveedor,
  ProveedoresService,
  mapProveedor,
} from "@/services/ProveedoresService";
import { useNotification } from "@/context/useNotificacion";
import Button from "@/components/atom/Button";
import Link from "next/link";
import { ExternalLink, Plus, RefreshCwIcon, X } from "lucide-react";
import Modal from "@/components/organism/Modal";
import { ComboBoxValue2, TextInput } from "@/components/atom/Input";
import { ExtraService } from "@/services/ExtraServices";
import { Table } from "@/component/molecule/Table";
import { Loader } from "@/components/atom/Loader";
import { FilterInput } from "@/component/atom/FilterInput";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import {
  PageTracker,
  TrackingPage,
} from "@/v2/components/molecule/PageTracking";

const PAGE_SIZE = 50;

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(null);
  const [proveedor, setProveedor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState<{
    proveedor?: string;
    type?: string;
    status?: string;
    rfc?: string;
  }>({});
  const [pageTracking, setPageTraking] = useState<TrackingPage>({
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const { showNotification } = useNotification();
  const { Can } = usePermiso();

  useEffect(() => {
    setPageTraking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  useEffect(() => {
    showNotification(
      "info",
      "Debes seleccionar primero un filtro y despues presionar el boton de buscar resultados",
    );
  }, []);

  const fetchProveedores = async (page = pageTracking.page) => {
    setIsLoading(true);
    try {
      const response = await ProveedoresService.getInstance().getProveedores({
        ...filtros,
        page,
        size: PAGE_SIZE,
      });

      setProveedores(response.data.map((i) => mapProveedor(i)));
      setPageTraking((prev) => ({
        ...prev,
        total: response.metadata.total,
        total_pages: Math.ceil(response.metadata.total / PAGE_SIZE),
      }));
    } catch (err) {
      showNotification(
        "error",
        err.message || "Error al obtener los proveedores",
      );
      setProveedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const registros = (proveedores || []).map((p) => ({
    id: p.id,
    proveedor: p.proveedor,
    type: p.type,
    creado_en: formatDate(p.created_at),
    detalles: p.id,
  }));

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = {
    detalles: ({ value }) => (
      <Link
        href={`/dashboard/proveedores/${value}`}
        className="p-2 border bg-gray-50 rounded-xl shadow-sm hover:shadow-none flex gap-2 justify-center"
      >
        <ExternalLink className="w-4 h-4"></ExternalLink>
        Ver mas
      </Link>
    ),
  };

  const handleFilterChange = (value, propiedad) => {
    if (value == null) {
      const newObj = Object.fromEntries(
        Object.entries({ ...filtros }).filter(([key]) => key != propiedad),
      );
      setFiltros(newObj);
      return;
    }
    setFiltros((prev) => ({ ...prev, [propiedad]: value }));
  };

  return (
    <>
      <div className="bg-white rounded-md shadow-md border p-4 space-y-4">
        <div className="w-full grid md:grid-cols-4 bg-gray-50 border rounded-md p-4 gap-4">
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
        </div>

        <div className="overflow-hidden">
          <div className="flex gap-2 w-full justify-end">
            <Button
              onClick={() => fetchProveedores()}
              disabled={isLoading}
              size="sm"
              icon={RefreshCwIcon}
            >
              {isLoading
                ? "Cargando..."
                : !proveedores
                  ? "Buscar resultados"
                  : "Refrescar"}
            </Button>

            {/* Placeholder para creación */}
            <Can permiso={PERMISOS.COMPONENTES.GROUP.PROVEEDORES_EDICIONES}>
              <Button
                size="sm"
                variant="ghost"
                icon={Plus}
                onClick={() => {
                  setProveedor({});
                }}
              >
                Nuevo
              </Button>
            </Can>
          </div>
          <div className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-56">
                <Loader></Loader>
              </div>
            ) : (
              <>
                <Table registros={registros || []} renderers={renderers} />
              </>
            )}
          </div>
          {proveedores && (
            <PageTracker
              tracking={pageTracking}
              setPage={(page) => {
                setPageTraking((prev) => ({
                  ...prev,
                  page,
                }));
                fetchProveedores(page);
              }}
            ></PageTracker>
          )}
        </div>
      </div>
      {proveedor != null && (
        <Modal
          onClose={() => {
            setProveedor(null);
          }}
          title="Agrega un nuevo proveedor"
          subtitle="Podras cambiar los datos del proveedor una ves que los agregues"
        >
          <form
            className="gap-4 justify-center items-end p-6 grid grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (isLoading) return;
              setIsLoading(true);
              try {
                const response =
                  await ExtraService.getInstance().createProveedor(proveedor);
                showNotification("success", response.message);
                setIsLoading(false);
                fetchProveedores();
                setProveedor(null);
              } catch (error) {
                showNotification(
                  "error",
                  error.message || "error al crear proveedor",
                );
              }
            }}
          >
            <TextInput
              value={proveedor.nombre}
              onChange={function (value: string): void {
                setProveedor((prev) => ({ ...prev, nombre: value }));
              }}
              label="Proveedor"
              placeholder="Nombre del proveedor..."
            />
            <ComboBoxValue2
              label="Tipo de proveedor"
              value={proveedor.type || null}
              onChange={function (value: string | null): void {
                setProveedor((prev) => ({ ...prev, type: value }));
              }}
              options={["vuelo", "renta_carro", "hotel"]}
            ></ComboBoxValue2>
            <Button
              icon={Plus}
              onClick={() => {}}
              className="col-span-2"
              type="submit"
            >
              Agregar
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
