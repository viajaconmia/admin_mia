"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { formatDate } from "@/helpers/utils";
import { URL, API_KEY } from "@/lib/constants/index";

/* ─────────────────────────────
   Tipos (según columnas de la BD)
────────────────────────────── */

export type ProveedorType = "vuelo" | "renta_carro";

export interface Proveedor {
  id: number;
  nombre: string;
  pais: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  type: ProveedorType;
  creado_en: string; // timestamp
  tarifas: string | null;
  cobertura: string | null;
  bilingue: number; // tinyint 0/1
  extranjero: number; // tinyint 0/1
  credito: number; // tinyint 0/1
  nombre_contacto: string | null;

  [key: string]: any;
}

/* ─────────────────────────────
   Helpers de normalización
────────────────────────────── */

const toInt01 = (v: any) => (Number(v) ? 1 : 0);

const mapProveedor = (p: any): Proveedor => ({
  id: Number(p.id ?? 0),
  nombre: String(p.nombre ?? ""),
  pais: p.pais ?? null,
  telefono: p.telefono ?? null,
  email: p.email ?? null,
  sitio_web: p.sitio_web ?? null,
  type: (p.type ?? "vuelo") as ProveedorType,
  creado_en: String(p.creado_en ?? p.created_at ?? ""),
  tarifas: p.tarifas ?? null,
  cobertura: p.cobertura ?? null,
  bilingue: toInt01(p.bilingue),
  extranjero: toInt01(p.extranjero),
  credito: toInt01(p.credito),
  nombre_contacto: p.nombre_contacto ?? null,
  ...p,
});

/**
 * Extractor tolerante:
 * - Por ahora el endpoint es el mismo que usas en facturas.
 * - Cuando ya tengas endpoint real, ajustas aquí para leer la clave correcta.
 */
const extractProveedores = (data: any): Proveedor[] => {
  if (!Array.isArray(data)) return [];

  // Caso: array directo
  if (data.length && (data[0]?.id !== undefined || data[0]?.nombre !== undefined)) {
    return data.map(mapProveedor);
  }

  // Caso: wrappers
  const out: Proveedor[] = [];
  for (const item of data) {
    const arr =
      item?.proveedores_json ||
      item?.proveedores ||
      item?.data ||
      item?.items ||
      item?.facturas_json || // (para que no truene con tu endpoint actual)
      null;

    if (Array.isArray(arr)) out.push(...arr.map(mapProveedor));
  }
  return out;
};

/* ─────────────────────────────
   Vista completa
────────────────────────────── */

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<"" | ProveedorType>("");
  const [q, setQ] = useState("");

  // Si luego necesitas filtrar por agente, déjalo listo:
  const id_agente = null as string | null;

  const fetchProveedores = async () => {
    // ✅ MISMO fetch (endpoint/headers/body pattern)
    const endpoint = `${URL}/mia/factura/getfacturasPagoPendienteByAgente`;
    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ id_agente }),
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      console.log("Respuesta recibida:", data);

      const list = extractProveedores(data);
      setProveedores(list);
    } catch (err) {
      console.error("Error en la consulta:", err);
      setProveedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return proveedores.filter((p) => {
      const matchTipo = tipoFiltro ? p.type === tipoFiltro : true;

      const matchQ = term
        ? [
            p.nombre,
            p.pais,
            p.email,
            p.telefono,
            p.nombre_contacto,
            p.sitio_web,
            p.tarifas,
            p.cobertura,
          ]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(term))
        : true;

      return matchTipo && matchQ;
    });
  }, [proveedores, tipoFiltro, q]);

  const registros = proveedoresFiltrados.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    type: p.type,
    pais: p.pais,
    telefono: p.telefono,
    email: p.email,
    sitio_web: p.sitio_web,
    tarifas: p.tarifas,
    cobertura: p.cobertura,
    bilingue: p.bilingue,
    extranjero: p.extranjero,
    credito: p.credito,
    nombre_contacto: p.nombre_contacto,
    creado_en: p.creado_en,
    item: p,
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
        <span className={`text-xs font-semibold ${Number(value) ? "text-emerald-700" : "text-gray-500"}`}>
          {Number(value) ? "Sí" : "No"}
        </span>
      </div>
    ),

    extranjero: ({ value }) => (
      <div className="flex justify-center">
        <span className={`text-xs font-semibold ${Number(value) ? "text-emerald-700" : "text-gray-500"}`}>
          {Number(value) ? "Sí" : "No"}
        </span>
      </div>
    ),

    credito: ({ value }) => (
      <div className="flex justify-center">
        <span className={`text-xs font-semibold ${Number(value) ? "text-emerald-700" : "text-gray-500"}`}>
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
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="bg-white border rounded-lg shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Proveedores</h1>
            <p className="text-sm text-gray-600 mt-1">
              Catálogo de proveedores (vuelo / renta de carro)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchProveedores}
              className="text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : "Refrescar"}
            </button>

            {/* Placeholder para creación */}
            <button
              onClick={() => alert("Pendiente: crear proveedor")}
              className="text-sm px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Nuevo
            </button>
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
            Mostrando <span className="font-semibold">{registros.length}</span>{" "}
            proveedor(es)
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-4 bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="p-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-56">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <p className="mt-2 text-sm text-gray-600">Cargando proveedores...</p>
              </div>
            </div>
          ) : registros.length === 0 ? (
            <p className="text-sm text-gray-500 p-3">
              No hay proveedores para mostrar (o el endpoint actual aún no retorna este catálogo).
            </p>
          ) : (
            <Table5<any>
              registros={registros}
              renderers={renderers}
              exportButton={true}
              leyenda={`Mostrando ${registros.length} proveedor(es)`}
              maxHeight="65vh"
              customColumns={[
                "id",
                "nombre",
                "type",
                "pais",
                "telefono",
                "email",
                "sitio_web",
                "tarifas",
                "cobertura",
                "bilingue",
                "extranjero",
                "credito",
                "nombre_contacto",
                "creado_en",
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
