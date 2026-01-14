"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { formatDate } from "@/helpers/utils";
import {
  Proveedor,
  ProveedoresService,
  mapProveedor,
} from "@/services/ProveedoresService";
import { useNotification } from "@/context/useNotificacion";
import Button from "@/components/atom/Button";
import Link from "next/link";
import { ExternalLink, Plus, RefreshCwIcon } from "lucide-react";
import Modal from "@/components/organism/Modal";
import { ComboBox2, ComboBoxOption2, TextInput } from "@/components/atom/Input";
import { ExtraService } from "@/services/ExtraServices";
import { Table } from "@/component/molecule/Table";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [nuevo, setNuevo] = useState<string>("");
  const [newType, setNewType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<"" | Pick<Proveedor, "type">>(
    ""
  );
  const [q, setQ] = useState("");

  const fetchProveedores = async () => {
    setIsLoading(true);
    try {
      const response = await ProveedoresService.getInstance()
        .getProveedores()
        .then((res) => res.data.map((item) => mapProveedor(item)))
        .catch((err) => {
          showNotification(
            "error",
            err.message || "Error al obtener los proveedores"
          );
          return [];
        });

      setProveedores(response);
    } catch (err) {
      console.error("Error en la consulta:", err);
      setProveedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return proveedores.filter((p) => {
      const matchTipo = tipoFiltro ? p.type === tipoFiltro : true;

      const matchQ = term
        ? [p.proveedor, p.pais]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(term))
        : true;

      return matchTipo && matchQ;
    });
  }, [proveedores, tipoFiltro, q]);

  const registros = proveedoresFiltrados.map((p) => ({
    id: p.id,
    proveedor: p.proveedor,
    type: p.type,
    pais: p.pais,
    bilingue: p.bilingue,
    creado_en: p.created_at,
    detalles: p.id,
  }));

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = {
    nombre: ({ value }) => (
      <div className="flex justify-start">
        <span className="font-semibold text-gray-800">{value || "—"}</span>
      </div>
    ),

    type: ({ value }) => {
      const v = String(value || "");
      const label = v === "renta_carro" ? "Renta carro" : "Vuelo";
      return (
        <div className="flex justify-center">
          <span className="text-xs px-2 py-1 rounded border bg-gray-50 text-gray-700">
            {label}
          </span>
        </div>
      );
    },

    creado_en: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-600">{formatDate(value ?? null)}</span>
      </div>
    ),

    bilingue: ({ value }) => (
      <div className="flex justify-center">
        <span
          className={`text-xs font-semibold ${
            Number(value) ? "text-emerald-700" : "text-gray-500"
          }`}
        >
          {Number(value) ? "Sí" : "No"}
        </span>
      </div>
    ),

    extranjero: ({ value }) => (
      <div className="flex justify-center">
        <span
          className={`text-xs font-semibold ${
            Number(value) ? "text-emerald-700" : "text-gray-500"
          }`}
        >
          {Number(value) ? "Sí" : "No"}
        </span>
      </div>
    ),

    credito: ({ value }) => (
      <div className="flex justify-center">
        <span
          className={`text-xs font-semibold ${
            Number(value) ? "text-emerald-700" : "text-gray-500"
          }`}
        >
          {Number(value) ? "Sí" : "No"}
        </span>
      </div>
    ),

    email: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    telefono: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    sitio_web: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),
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

  return (
    <>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="bg-white border rounded-lg shadow-sm p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Proveedores
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Catálogo de proveedores (vuelo / renta de carro)
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, país, email, contacto..."
                className="w-full md:w-96 border rounded px-3 py-2 text-sm"
              />

              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as any)}
                className="border rounded px-3 py-2 text-sm md:w-52"
              >
                <option value="">Todos</option>
                <option value="vuelo">Vuelo</option>
                <option value="renta_carro">Renta carro</option>
              </select>
            </div>

            <div className="text-xs text-gray-600">
              Mostrando{" "}
              <span className="font-semibold">{registros.length}</span>{" "}
              proveedor(es)
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="mt-4 bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="flex gap-2">
            <Button
              onClick={fetchProveedores}
              disabled={isLoading}
              size="sm"
              icon={RefreshCwIcon}
            >
              {isLoading ? "Cargando..." : "Refrescar"}
            </Button>

            {/* Placeholder para creación */}
            <Button
              size="sm"
              variant="ghost"
              icon={Plus}
              onClick={() => {
                setShowModal(true);
              }}
            >
              Nuevo
            </Button>
          </div>
          <div className="p-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-56">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="mt-2 text-sm text-gray-600">
                    Cargando proveedores...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Table registros={registros} renderers={renderers} />
              </>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <Modal
          onClose={() => {
            setNuevo("");
            setShowModal(false);
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
                  await ExtraService.getInstance().createProveedor({
                    nombre: nuevo,
                    type: newType,
                  });
                showNotification("success", response.message);
                setIsLoading(false);
                fetchProveedores();
                setShowModal(false);
              } catch (error) {
                showNotification(
                  "error",
                  error.message || "error al crear proveedor"
                );
              }
            }}
          >
            <TextInput
              value={nuevo}
              onChange={function (value: string): void {
                setNuevo(value);
              }}
              label="Proveedor"
              placeholder="Nombre del proveedor..."
            />
            <ComboBox2
              label="Tipo de proveedor"
              value={{
                name: newType,
                content: newType,
              }}
              onChange={function (value: ComboBoxOption2<string>): void {
                setNewType(value.content);
              }}
              options={["vuelo", "renta_carro"].map((type) => ({
                name: type.replace("_", " "),
                content: type,
              }))}
            ></ComboBox2>
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
