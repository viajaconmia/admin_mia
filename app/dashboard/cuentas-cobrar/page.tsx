"use client";
import { API_KEY, URL } from "@/lib/constants";
import { Table4 } from "@/components/organism/Table4";
import React, { useState, useEffect, useMemo } from "react";
import { formatNumberWithCommas } from "@/helpers/utils";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { PagarModalComponent } from "@/components/template/pagar_saldo";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

// ====== util fechas / formatos ======
const formatDate = (dateString: string | Date | null): string => {
  if (!dateString || dateString === "0000-00-00") return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
const normalize = (v: unknown) =>
  (typeof v === "string" ? v.trim().toLowerCase() : "").replace(/\s+/g, "");
const matches = (field: unknown, query: unknown) => {
  const f = normalize(field);
  const q = normalize(query);
  if (!q) return true;
  return q.length >= 30 ? f === q : f.includes(q);
};
const daysDiffFromToday = (d: string | Date | null) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const today = new Date();
  // quitar horas para comparación por día
  const a = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const b = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  return Math.floor((b - a) / (1000 * 3600 * 24));
};
const money = (n: number) => `$${formatNumberWithCommas(Number(n || 0).toFixed(2))}`;

// =============================== Componente ===============================
const CuentasPorCobrar = () => {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [filteredFacturas, setFilteredFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TypeFilters>({});
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedFacturas, setSelectedFacturas] = useState<Set<string>>(
    new Set()
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // NUEVO: control de desplegables por agente
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const toggleAgent = (idAgente: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(idAgente)) next.delete(idAgente);
      else next.add(idAgente);
      return next;
    });
  };

  // Selección de facturas (se mantiene igual, pero se usa dentro del detalle)
  const { hasAccess } = usePermiso();

  hasAccess(PERMISOS.VISTAS.CUENTAS_POR_COBRAR);

  const handleClosePagarModal = () => {
    setShowPagarModal(false);
  };

  // Función para determinar si una fila puede ser seleccionada
  const canSelectRow = (row: any) => {
    const saldo = parseFloat(row.saldo);
    const total = parseFloat(row.total);
    return (saldo <= total || saldo === null) && row.estado !== "pagada";
  };

  //función para asignar pagos a las facturas seleccionadas
  // const handlePagos = () => {
  //   const facturasSeleccionadas = facturas.filter((factura) =>
  //     selectedFacturas.has(factura.id_factura)
  //   );

  //   if (facturasSeleccionadas.length > 0) {
  //     // Prepara los datos para el modal
  //     const datosFacturas = facturasSeleccionadas.map((factura) => ({
  //       monto: factura.total,
  //       saldo: factura.saldo, // Agregar el saldo actual
  //       facturaSeleccionada: factura,
  //       id_agente: factura.id_agente,
  //       agente: factura.nombre_agente,
  //     }));

  //     setFacturaData(datosFacturas); // Enviar todas las facturas al modal
  //     setShowPagarModal(true); // Mostrar el modal
  //   }
  // };

  // Función para manejar la acción Editar
  const handleEditar = (id: string) => {
    console.log(`Editar factura con ID: ${id}`);
    // Aquí puedes agregar la lógica para editar
  };

  // Función para manejar la acción Eliminar
  const handleEliminar = (id: string) => {
    console.log(`Eliminar factura con ID: ${id}`);
    // Aquí puedes agregar la lógica para eliminar
  };

  const handleSelectFactura = (id: string, idAgente: string) => {
    setSelectedFacturas((prevSelected) => {
      const newSelected = new Set(prevSelected);
      const wasSelected = newSelected.has(id);

      if (wasSelected) newSelected.delete(id);
      else newSelected.add(id);

      if (newSelected.size === 0) {
        setSelectedAgentId(null);
        return newSelected;
      }

      const seleccionadas = facturas.filter((f) =>
        newSelected.has(f.id_factura)
      );
      const allSameAgent = seleccionadas.every((f) => f.id_agente === idAgente);
      if (!allSameAgent) {
        if (!wasSelected) newSelected.delete(id); // revertir mezcla
        return new Set(newSelected);
      }
      if (!selectedAgentId) setSelectedAgentId(idAgente);
      return newSelected;
    });
  };

  const handleDeseleccionarPagos = () => {
    setSelectedFacturas(new Set());
    setSelectedAgentId(null);
    setFacturaData(null);
    setShowPagarModal(false);
  };

  const handleFilter = (newFilters: TypeFilters) => setFilters(newFilters);

  // Filtros y búsqueda sobre facturas crudas (igual que antes)
  useEffect(() => {
    let result = [...facturas];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.id_factura?.toLowerCase().includes(q) ||
          f.rfc?.toLowerCase().includes(q) ||
          f.nombre_agente?.toLowerCase().includes(q) ||
          f.uuid_factura?.toLowerCase().includes(q) ||
          f.id_agente?.toLowerCase().includes(q)
      );
    }
    if (filters.estado) {
      result = result.filter(
        (f) => f.estado?.toLowerCase() === filters.estado?.toLowerCase()
      );
    }
    if (filters.id_factura) {
      result = result.filter((f) =>
        f.id_factura?.toLowerCase().includes(filters.id_factura?.toLowerCase())
      );
    }
    if (filters.rfc) {
      result = result.filter((f) =>
        f.rfc?.toLowerCase().includes(filters.rfc?.toLowerCase())
      );
    }
    if (filters.nombre_agente) {
      result = result.filter((f) =>
        f.nombre_agente
          ?.toLowerCase()
          .includes(filters.nombre_agente?.toLowerCase())
      );
    }
    if (filters.estatusFactura) {
      result = result.filter(
        (f) => f.estado?.toLowerCase() === filters.estatusFactura?.toLowerCase()
      );
    }
    if (filters.fecha_creacion) {
      result = result.filter((f) => {
        const fechaFactura = new Date(f.created_at).toISOString().split("T")[0];
        const fechaFiltro = new Date(filters.fecha_creacion!)
          .toISOString()
          .split("T")[0];
        return fechaFactura === fechaFiltro;
      });
    }
    if (filters.fecha_pago) {
      result = result.filter((f) => {
        const fechaPago = f.fecha_pago
          ? new Date(f.fecha_pago).toISOString().split("T")[0]
          : null;
        const fechaFiltro = new Date(filters.fecha_pago!)
          .toISOString()
          .split("T")[0];
        return fechaPago === fechaFiltro;
      });
    }
    if (filters.startCantidad !== undefined && filters.startCantidad !== null) {
      result = result.filter(
        (f) => parseFloat(f.saldo) >= filters.startCantidad!
      );
    }
    if (filters.endCantidad !== undefined && filters.endCantidad !== null) {
      result = result.filter(
        (f) => parseFloat(f.saldo) <= filters.endCantidad!
      );
    }
    if (filters.id_agente) {
      result = result.filter((r) => matches(r.id_agente, filters.id_agente));
    }
    setFilteredFacturas(result);
  }, [facturas, searchTerm, filters]);

  // Auto-filtro por agente al seleccionar facturas
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      id_agente: selectedAgentId ? selectedAgentId : null,
    }));
  }, [selectedAgentId]);

  // Fetch
  useEffect(() => {
    const fetchFacturas = async () => {
      const endpoint = `${URL}/mia/factura/getfacturasPagoPendiente`;
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        const data = await response.json();
        if (Array.isArray(data) && (data[0]?.error || data[1]?.error)) {
          throw new Error("Error al cargar los datos");
        }
        setFacturas(data);
        setFilteredFacturas(data);
      } catch (error) {
        console.log("Error al cargar los datos en facturas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturas();
  }, []);

  console.log(facturas)

  // ============ AGRUPACIÓN POR AGENTE + SUMAS ============
  type GrupoAgente = {
    id_agente: string;
    nombre_agente: string;
    Total_facturado: number;
    Total_adeudo: number;
    Vigente: number; // saldo con fecha no vencida (>= 0 días)
    Atrasado: number; // saldo con fecha vencida  (< 0 días)
    facturas: any[];
  };

  const grupos = useMemo<GrupoAgente[]>(() => {
    const map = new Map<string, GrupoAgente>();
    for (const f of filteredFacturas) {
      const id = f.id_agente || "SIN_AGENTE";
      const g = map.get(id) ?? {
        id_agente: id,
        nombre_agente: f.nombre_agente || "Sin nombre",
        Total_facturado: 0,
        Total_adeudo: 0,
        Vigente: 0,
        Atrasado: 0,
        facturas: [],
      };

      const total = parseFloat(f.total ?? 0) || 0;
      const saldo = parseFloat(f.saldo ?? 0);
      const diff = daysDiffFromToday(f.fecha_vencimiento);
      const isVencida = diff !== null ? diff < 0 : false;

      g.Total_facturado += total;
      g.Total_adeudo += isFinite(saldo) ? saldo : 0;
      if (isFinite(saldo)) {
        if (isVencida) g.Vigente += saldo;
        else g.Atrasado += saldo;
      }
      g.facturas.push(f);
      map.set(id, g);
    }
    // sort opcional por nombre de agente
    return Array.from(map.values()).sort((a, b) =>
      (a.nombre_agente || "").localeCompare(b.nombre_agente || "")
    );
  }, [filteredFacturas]);

  // ============ RENDERERS ============
  const renderers = {
    nombre_agente: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-800">{value}</span>
    ),
    id_agente: ({ value }: { value: string }) => (
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
        {value}
      </span>
    ),
    Total_facturado: ({ value }: { value: number }) => (
      <span className="font-bold text-blue-600">{money(value)}</span>
    ),
    Total_adeudo: ({ value }: { value: number }) => (
      <span
        className={`font-bold ${value >= 0 ? "text-green-600" : "text-red-600"
          }`}
      >
        {money(value)}
      </span>
    ),
    Vigente: ({ value }: { value: number }) => (
      <span className="font-semibold text-amber-700">{money(value)}</span>
    ),
    Atrasado: ({ value }: { value: number }) => (
      <span className="font-semibold text-red-600">{money(value)}</span>
    ),
    // NUEVO: columna con botón para desplegar detalle por agente
    detalles: ({ value }: { value: { grupo: GrupoAgente } }) => {
      const { grupo } = value;
      const abierto = expandedAgents.has(grupo.id_agente);
      return (
        <div className="space-y-2">
          <button
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => toggleAgent(grupo.id_agente)}
          >
            {abierto ? "Ocultar facturas" : "Ver facturas"}
          </button>

          {abierto && (
            <div className="rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">Sel</th>
                    <th className="px-3 py-2">UUID</th>
                    <th className="px-3 py-2">Emisión</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Saldo</th>
                    <th className="px-3 py-2">Vencimiento</th>
                    <th className="px-3 py-2">PDF</th>
                    <th className="px-3 py-2">XML</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.facturas.map((r) => {
                    const isChecked = selectedFacturas.has(r.id_factura);
                    const saldoNum = parseFloat(r.saldo ?? 0) || 0;
                    const diff = daysDiffFromToday(r.fecha_vencimiento);
                    const vencTxt =
                      diff === null
                        ? "N/A"
                        : diff > 0
                          ? `${diff} días restantes`
                          : diff < 0
                            ? `${Math.abs(diff)} días atrasado`
                            : "Vence hoy";
                    const vencColor =
                      diff === null
                        ? "text-gray-500"
                        : diff < 0
                          ? "text-red-600"
                          : "text-green-600";

                    return (
                      <tr key={r.uuid_factura} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleSelectFactura(r.uuid_factura, r.id_agente)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {r.uuid_factura}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {formatDate(r.fecha_emision)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${r.estado === "Confirmada"
                              ? "bg-green-100 text-green-800"
                              : r.estado === "Pendiente"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {r.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-blue-600">
                          {money(parseFloat(r.total ?? 0) || 0)}
                        </td>
                        <td
                          className={`px-3 py-2 font-bold ${saldoNum >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          {money(saldoNum)}
                        </td>
                        <td className={`px-3 py-2 font-medium ${vencColor}`}>
                          {vencTxt}
                        </td>
                        <td className="px-3 py-2">
                          {r.url_pdf ? (
                            <a
                              href={r.url_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver PDF
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {r.url_xml ? (
                            <a
                              href={r.url_xml}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline"
                            >
                              Ver XML
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    },
  };

  // ====== filas para Table4 AHORA SON RESÚMENES POR AGENTE ======
  const rows = useMemo(() => {
    return grupos.map((g) => ({
      detalles: { grupo: g }, // renderer "detalles" muestra el desplegable
      nombre_agente: g.nombre_agente,
      id_agente: g.id_agente,
      Total_facturado: g.Total_facturado,
      Total_adeudo: g.Total_adeudo,
      Vigente: g.Vigente,
      Atrasado: g.Atrasado,
    }));
  }, [grupos, expandedAgents, selectedFacturas]);

  // Columnas del resumen por agente
  const availableColumns = useMemo(() => {
    return [
      "detalles",
      "nombre_agente",
      "id_agente",
      "Total_adeudo",
      "Vigente",
      "Atrasado",
    ];
  }, []);

  // Botón "Asignar pago": usa las facturas seleccionadas
  const handlePagos = () => {
    const facturasSeleccionadas = facturas.filter((f) =>
      selectedFacturas.has(f.id_factura)
    );
    if (facturasSeleccionadas.length > 0) {
      const datosFacturas = facturasSeleccionadas.map((f) => ({
        monto: f.total,
        saldo: f.saldo,
        facturaSeleccionada: f,
        id_agente: f.id_agente,
        agente: f.nombre_agente,
      }));
      setFacturaData(datosFacturas);
      setShowPagarModal(true);
    }
  };

  // Filtros disponibles (igual que antes)
  const availableFilters: TypeFilters = {
    id_factura: null,
    estado: null,
    rfc: null,
    nombre: null,
    estatusFactura: null,
    fecha_creacion: null,
    fecha_pago: null,
    startCantidad: null,
    endCantidad: null,
    id_agente: null,
  };

  if (loading) return <h1>Cargando...</h1>;

  return (
    <div className="space-y-4">
      <Filters
        onFilter={handleFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        defaultFilters={availableFilters}
      />

      <Table4
        registros={rows}
        renderers={renderers}
        customColumns={availableColumns}
      >
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          onClick={handlePagos}
          disabled={selectedFacturas.size === 0}
        >
          Asignar Pago
        </button>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          onClick={handleDeseleccionarPagos}
          disabled={selectedFacturas.size === 0}
        >
          Deseleccionar pagos
        </button>
      </Table4>

      {showPagarModal && facturaData && (
        <PagarModalComponent
          onClose={() => setShowPagarModal(false)}
          facturaData={facturaData}
          open={showPagarModal}
        />
      )}
    </div>
  );
};

export default CuentasPorCobrar;
