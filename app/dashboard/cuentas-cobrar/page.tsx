"use client";
import { API_KEY, URL } from "@/lib/constants";
import { Table5 } from "@/components/Table5";
import React, { useState, useEffect, useMemo } from "react";
import { formatNumberWithCommas } from "@/helpers/utils";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { PagarModalComponent } from "@/components/template/pagar_saldo";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { Eye } from "lucide-react";
import DetallesFacturas from "@/app/dashboard/concentrado_cxc/components/facturas"; // ajusta la ruta si cambia

//============helpers========================
// Convierte "2025-11-11 13:38:19.000000" o "2025-11-11" a Date UTC (solo fecha)
export const parseToUtcDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const [datePart] = value.trim().split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

// Diferencia en días: end - start
export const diffInDays = (
  start: string | null | undefined,
  end: string | null | undefined
): number | null => {
  const d1 = parseToUtcDate(start || "");
  const d2 = parseToUtcDate(end || "");
  if (!d1 || !d2) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((d2.getTime() - d1.getTime()) / msPerDay);
};

const getDatosFac = (factura: any) => {
  const diasCreditoRaw = diffInDays(factura.created_at, factura.fecha_vencimiento);
  const diasCredito = diasCreditoRaw != null ? Math.max(diasCreditoRaw, 0) : null;

  const hoyStr = new Date().toISOString().slice(0, 10);
  const diasRestantesRaw = diffInDays(hoyStr, factura.fecha_vencimiento);
  const diasRestantes = diasRestantesRaw != null ? Math.max(diasRestantesRaw, 0) : null;

  return { diasCredito, diasRestantes };
};


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
// Modal DetallesFacturas (como en el otro componente)
const [isModalOpen, setIsModalOpen] = useState(false);
const [agenteSeleccionado, setAgenteSeleccionado] = useState<string | null>(null);
const [facturasModal, setFacturasModal] = useState<any[]>([]);

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

  const handleVerFacturas = (grupo: GrupoAgente) => {
  setAgenteSeleccionado(grupo.id_agente);

  const facturas = (grupo.facturas || []).map((f: any) => ({
    ...f,
    ...getDatosFac(f),
  }));

  setFacturasModal(facturas);
  setIsModalOpen(true);
};


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
  nombre_cliente: ({ value }: { value: string }) => (
  <div className="flex justify-end w-full">
    <span className="text-right w-full text-gray-700">{value || "—"}</span>
  </div>
),


  id_agente: ({ value }: { value: string }) => (
    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
      {value}
    </span>
  ),

  Total_facturado: ({ value }: { value: number }) => (
    <span className="font-bold text-blue-600">{money(value)}</span>
  ),

  // ✅ A LA DERECHA
  Total_adeudo: ({ value }: { value: number }) => (
    <span
      className={`font-bold text-right block ${
        value >= 0 ? "text-green-600" : "text-red-600"
      }`}
    >
      {money(value)}
    </span>
  ),

  // ✅ A LA DERECHA
  Vigente: ({ value }: { value: number }) => (
    <span className="font-semibold text-amber-700 text-right block">
      {money(value)}
    </span>
  ),

  // ✅ A LA DERECHA
  Atrasado: ({ value }: { value: number }) => (
    <span className="font-semibold text-red-600 text-right block">
      {money(value)}
    </span>
  ),

  detalles: ({ value }: { value: { grupo: GrupoAgente } }) => {
    const { grupo } = value;

    return (
      <button
        onClick={() => handleVerFacturas(grupo)}
        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Eye size={12} />
        <span>({grupo.facturas?.length ?? 0})</span>
      </button>
    );
  },
};

  // ====== filas para Table5 AHORA SON RESÚMENES POR AGENTE ======
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
    <div className="space-y-4 bg-neutral-100 rounded">
      <Filters
        onFilter={handleFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        defaultFilters={availableFilters}
      />

      <Table5
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
      </Table5>

      {showPagarModal && facturaData && (
        <PagarModalComponent
          onClose={() => setShowPagarModal(false)}
          facturaData={facturaData}
          open={showPagarModal}
        />
      )}
      <DetallesFacturas
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agente={agenteSeleccionado}
        facturas={facturasModal}
        formatDate={formatDate}
        money={money}
      />
    </div>
  );
};

export default CuentasPorCobrar;
