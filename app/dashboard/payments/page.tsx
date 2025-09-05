'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table4 } from "@/components/organism/Table4";
import { Loader } from "@/components/atom/Loader";

// Versión de Feather Icons (similares a Lucide)
import { Eye, FileText, FilePlus, X } from 'lucide-react';
import { format } from "date-fns";
import { fetchPagosPrepago, fetchPagosPrepagobalance } from "@/services/pagos";
import { Banknote, FileCheck } from "lucide-react";
import { es, se } from "date-fns/locale";
import ModalDetallePago from './_components/detalles_pago';
import ModalFacturasAsociadas from './_components/ModalFacturasAsociadas';
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";
import { BillingPage } from "@/app/dashboard/facturacion/generar_factura/generar_factura";
import { formatNumberWithCommas } from "@/helpers/utils";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { table } from 'console';

export interface Pago {
  id_movimiento: number;
  tipo_pago: string;
  raw_id: string;
  fecha_pago: string;
  ig_agente: string;
  nombre_agente: string;
  metodo: string;
  fecha_creacion: string;
  monto: string;
  saldo: number;
  saldo_numero: number;
  banco?: string;
  last_digits?: string;
  is_facturado: number;
  tipo?: string;
  referencia?: string;
  concepto?: string;
  link_pago?: string;
  autorizacion?: string;
  origen_pago: string;
  facturas_asociadas: string | null;
  currency?: string;
  [key: string]: any;
  monto_facturado: string;
  monto_por_facturar: number;
}

interface Balance {
  montototal: string;
  restante: string;
  montofacturado: string;
}


type Seleccion = { id_agente: string; raw_id: string; monto_por_facturar: number };

function buildAssignPayload(opts: { seleccionados: Seleccion[]; row?: any }) {
  const { seleccionados, row } = opts;
  const haySeleccion = seleccionados && seleccionados.length > 0;

  const rawIds = haySeleccion
    ? seleccionados.map(s => s.raw_id)
    : row
      ? [String(row.raw_id)]
      : [];

  const saldos = haySeleccion
    ? seleccionados.map(s => Number(s.monto_por_facturar) || 0)
    : row
      ? [Number(row.monto_por_facturar) || 0]
      : [];

  const id_agente = haySeleccion
    ? String(seleccionados[0].id_agente)
    : String(row?.id_agente || row?.ig_agente || "");

  const monto = saldos.reduce((a, b) => a + (Number(b) || 0), 0);

  return {
    id_agente,
    rawIds,          // siempre array
    saldos,          // siempre array
    monto,           // total
    saldoMonto: monto
  };
}

const TablaPagosVisualizacion = () => {
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [showSubirFactura, setShowSubirFactura] = useState(false);
  const [pagoAFacturar, setPagoAFacturar] = useState<Pago | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFacturasModal, setShowFacturasModal] = useState(false);
  const [facturasAsociadas, setFacturasAsociadas] = useState<string[]>([]);
  const [filters, setFilters] = useState<TypeFilters>({
    id_movimiento: 0,
    raw_id: "",
    fecha_pago: "",
    id_agente: "",
    nombre_agente: "",
    metodo: "",
    fecha_creacion: "",
    banco: "",
    last_digits: "",
    is_facturado: 0,
    link_pago: "",
    origen_pago: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [seleccionados, setSeleccionados] = useState<Seleccion[]>([]);
  const idAgenteSeleccionado = seleccionados[0]?.id_agente ?? null;
  const totalSaldoSeleccionado = seleccionados.reduce((a, s) => a + (Number(s.monto_por_facturar) || 0), 0);

  interface SortConfig {
    key: string;
    sort: boolean; // true = ascendente, false = descendente
  }
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "creado",
    sort: false, // false para descendente por defecto
  });
  const handleFilter = (newFilters: TypeFilters) => {
    const completeFilters: TypeFilters = {
      id_movimiento:
        typeof newFilters.id_movimiento === "string"
          ? parseInt(newFilters.id_movimiento) || 0
          : newFilters.id_movimiento || 0,

      raw_id: newFilters.raw_id || "",
      fecha_pago: newFilters.fecha_pago || "",
      id_agente: newFilters.id_agente || "",
      nombre_agente: newFilters.nombre_agente || "",
      metodo: newFilters.metodo || "",
      fecha_creacion: newFilters.fecha_creacion || "",
      banco: newFilters.banco || "",
      last_digits: newFilters.last_digits || "",

      is_facturado:
        typeof newFilters.is_facturado === "string"
          ? newFilters.is_facturado === "SI"
            ? 1
            : 0
          : typeof newFilters.is_facturado === "boolean"
            ? newFilters.is_facturado
              ? 1
              : 0
            : newFilters.is_facturado || 0,

      link_pago: newFilters.link_pago || "",
      origen_pago: newFilters.origen_pago || "",
    };

    setFilters(completeFilters);
  };
  const handleVerFacturas = (facturasStr: string) => {
    if (facturasStr) {
      const facturasArray = facturasStr.split(',').map(f => f.trim());
      setFacturasAsociadas(facturasArray);
    } else {
      setFacturasAsociadas([]);
    }
    setShowFacturasModal(true);
  };

  type BatchPayload = { userId: string; saldoMonto: number; rawIds: string[], saldos: number[]; } | null;

  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const batchBtnRef = useRef<HTMLDivElement>(null);
  const [batchMenuPos, setBatchMenuPos] = useState<'bottom' | 'top'>('bottom');
  const [filterBySelectedAgent, setFilterBySelectedAgent] = useState(false);
  const [showBillingPage, setShowBillingPage] = useState(false);
  const [batchBilling, setBatchBilling] = useState<BatchPayload>(null);
  const [showBatchSubirFactura, setShowBatchSubirFactura] = useState(false);
  const [batchPagoAFacturar, setBatchPagoAFacturar] = useState<any>(null);

  useEffect(() => {
    if (batchBtnRef.current && showBatchMenu) {
      const r = batchBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      setBatchMenuPos(spaceBelow < 200 ? 'top' : 'bottom');
    }
  }, [showBatchMenu]);

  const obtenerPagos = async () => {
    try {
      setLoading(true);
      const data = await fetchPagosPrepago();
      // Normalizar todos los datos para que cumplan con interface Pago
      const pagosMapeados: Pago[] = data.map((pago: any) => ({
        id_movimiento: Number(pago.id_movimiento ?? pago.id ?? pago.id_pago ?? 0),
        tipo_pago: pago.tipo_pago ?? pago.tipo_de_pago ?? pago.metodo_pago ?? pago.metodo_de_pago ?? "",
        raw_id: pago.raw_id ?? pago.id_pago ?? pago.id ?? "",
        fecha_pago: pago.fecha_pago ?? pago.pago_fecha_pago ?? pago.fecha_transaccion ?? "",
        ig_agente: pago.ig_agente ?? pago.agente_pago ?? pago.id_agente ?? "",
        nombre_agente: pago.nombre_agente ?? pago.agente_saldo ?? pago.nombre ?? "",
        metodo: pago.metodo ?? pago.metodo_pago ?? pago.metodo_de_pago ?? "",
        fecha_creacion: pago.fecha_creacion ?? pago.pago_fecha_creacion ?? pago.created_at ?? "",
        monto: formatNumberWithCommas(pago.monto),
        monto_facturado: formatNumberWithCommas(pago.monto_facturado),
        saldo_numero: pago.saldo === "pago_directo"
          ? Number(pago.monto) // Versión numérica para cálculos
          : Number(pago.saldo ?? pago.saldo_monto ?? 0),
        banco: pago.banco ?? pago.banco_tarjeta ?? undefined,
        last_digits: pago.last_digits ?? pago.ult_digits ?? undefined,
        is_facturado: Number(pago.is_facturado ?? pago.facturado ?? 0),
        tipo: pago.tipo ?? pago.tipo_de_tarjeta ?? pago.tipo_tarjeta ?? undefined,
        referencia: pago.referencia ?? pago.pago_referencia ?? "",
        concepto: pago.concepto ?? pago.pago_concepto ?? "",
        link_pago: pago.link_pago ?? pago.link_stripe ?? "",
        autorizacion: pago.autorizacion ?? pago.numero_autorizacion ?? pago.autorizacion_stripe ?? "",
        origen_pago: pago.origen_pago ?? "",
        facturas_asociadas: pago.facturas_asociadas ?? pago.comprobante ?? null,

        // mantener cualquier otro campo adicional que traiga el back
        ...pago,
      }));

      setPagos(pagosMapeados);
      setError(null);
    } catch (err) {
      console.error("Error al obtener los pagos:", err);
      setError("No se pudieron cargar los pagos. Intente nuevamente más tarde.");
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerBalance = async () => {
    try {
      setLoading(true);
      const response = await fetchPagosPrepagobalance();

      // Asumiendo que la API devuelve directamente el objeto balance
      const balanceObtenido: Balance = {
        montototal: response.montototal || "0",
        montofacturado: response.montofacturado || "0",
        restante: response.restante || "0"
      };
      setBalance(balanceObtenido);
    } catch (err) {
      console.error("Error al obtener el balance:", err);
      setError("No se pudieron cargar los saldos de pagos. Intente nuevamente más tarde.");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    obtenerBalance();
    obtenerPagos();
  }, []);


  const formatDate = (dateString: string | null): string => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString as string;
    }
  };


  const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const isRowSelected = (row: Pago) => seleccionados.some(s => s.raw_id === row.raw_id);
  const canSelectRow = (row: Pago) => {
    const rowAgent = row.id_agente || row.ig_agente || '';
    return seleccionados.length === 0 || rowAgent === idAgenteSeleccionado;
  };
  const toggleSeleccion = (row: Pago) => {
    const rowAgent = (row.id_agente || row.ig_agente || '').toString();
    const monto_por_facturar = Number(row.monto_por_facturar) || 0;
    const raw = row.raw_id;

    if (!raw) return;

    if (seleccionados.length > 0 && rowAgent !== idAgenteSeleccionado) {
      alert('Solo puedes seleccionar pagos del mismo agente.');
      return;
    }

    setSeleccionados(prev => {
      const exists = prev.some(s => s.raw_id === raw);
      if (exists) {
        // Si estamos deseleccionando el último elemento, desactivamos el filtro
        if (prev.length === 1) {
          setFilterBySelectedAgent(false);
        }
        return prev.filter(s => s.raw_id !== raw);
      }
      // Al seleccionar el primer elemento, activamos el filtro
      if (prev.length === 0) {
        setFilterBySelectedAgent(true);
      }
      return [...prev, { id_agente: rowAgent, raw_id: raw, monto_por_facturar }];
    });
  };

  const filteredData = useMemo(() => {
    // Filter the data
    const filteredItems = pagos.filter((pago) => {
      // Aplicar filtro por agente seleccionado si está activo
      if (filterBySelectedAgent && seleccionados.length > 0) {
        const pagoAgent = (pago.id_agente || pago.ig_agente || '').toString();
        if (pagoAgent !== idAgenteSeleccionado) {
          return false;
        }
      }


      // Filtro por raw_id
      if (filters.raw_id && pago.raw_id) {
        const normalizedFilter = filters.raw_id.toLowerCase();
        const normalizedId = pago.raw_id.toLowerCase();
        if (!normalizedId.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por fecha de pago
      if (filters.fecha_pago && pago.fecha_pago) {
        const paymentDate = new Date(pago.fecha_pago).toISOString().split('T')[0];
        if (paymentDate !== filters.fecha_pago) {
          return false;
        }
      }

      // Filtro por agente (ID)
      if (filters.id_agente && pago.ig_agente) {
        const normalizedFilter = filters.id_agente.toLowerCase();
        const normalizedAgent = pago.ig_agente.toLowerCase();
        if (!normalizedAgent.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por nombre de agente
      if (filters.nombre_agente && pago.nombre_agente) {
        const normalizedFilter = filters.nombre_agente.toLowerCase();
        const normalizedName = pago.nombre_agente.toLowerCase();
        if (!normalizedName.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por método de pago
      if (filters.metodo && pago.metodo) {
        const normalizedFilter = filters.metodo.toLowerCase();
        const normalizedMethod = pago.metodo.toLowerCase();
        if (!normalizedMethod.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por fecha de creación
      if (filters.fecha_creacion && pago.fecha_creacion) {
        const creationDate = new Date(pago.fecha_creacion).toISOString().split('T')[0];
        if (creationDate !== filters.fecha_creacion) {
          return false;
        }
      }

      // Filtro por banco
      if (filters.banco && pago.banco) {
        const normalizedFilter = filters.banco.toLowerCase();
        const normalizedBank = pago.banco.toLowerCase();
        if (!normalizedBank.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por últimos dígitos
      if (filters.last_digits && pago.last_digits) {
        const normalizedFilter = filters.last_digits.toLowerCase();
        const normalizedDigits = pago.last_digits.toLowerCase();
        if (!normalizedDigits.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por link de pago
      if (filters.link_pago && pago.link_pago) {
        const normalizedFilter = filters.link_pago.toLowerCase();
        const normalizedLink = pago.link_pago.toLowerCase();
        if (!normalizedLink.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por origen de pago
      if (filters.origen_pago && pago.origen_pago) {
        const normalizedFilter = filters.origen_pago.toLowerCase();
        const normalizedOrigin = pago.origen_pago.toLowerCase();
        if (!normalizedOrigin.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por rango de fechas (creación)
      if (filters.startDate && pago.fecha_creacion) {
        const createdDate = new Date(pago.fecha_creacion);
        if (createdDate < new Date(filters.startDate)) {
          return false;
        }
      }

      if (filters.endDate && pago.fecha_creacion) {
        const createdDate = new Date(pago.fecha_creacion);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        if (createdDate > endDate) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesReference = pago.referencia
          ?.toLowerCase()
          .includes(searchLower);
        const matchesConcept = pago.concepto
          ?.toLowerCase()
          .includes(searchLower);
        const matchesId = pago.id_movimiento?.toString().includes(searchLower);
        const matchesRawId = pago.raw_id?.toLowerCase().includes(searchLower);
        const matchesAgentName = pago.nombre_agente
          ?.toLowerCase()
          .includes(searchLower);
        const matchesAgentId = pago.ig_agente
          ?.toLowerCase()
          .includes(searchLower);

        if (!matchesReference && !matchesConcept && !matchesId &&
          !matchesRawId && !matchesAgentName && !matchesAgentId) {
          return false;
        }
      }

      return true;
    });

    // Transform the filtered data
    const transformedData = filteredItems.map((pago) => ({
      id_movimiento: pago.id_movimiento,
      tipo_pago: pago.tipo_pago ?? "",
      raw_id: pago.raw_id,
      id_agente: pago.ig_agente,
      nombre_agente: pago.nombre_agente ?? "",
      fecha_creacion: pago.fecha_creacion,
      fecha_pago: pago.fecha_pago,
      monto: Number(pago.monto) || 0,
      monto_por_facturar: Number(pago.monto_por_facturar) || 0,
      currency: pago.currency ?? "MXN",
      metodo: pago.metodo ?? "",
      tipo: pago.tipo ?? "",
      referencia: pago.referencia ?? "N/A",
      concepto: pago.concepto ?? "",
      link_pago: pago.link_pago ?? "",
      autorizacion: pago.autorizacion ?? "N/A",
      last_digits: pago.last_digits ?? "N/A",
      banco: pago.banco ?? "N/A",
      origen_pago: pago.origen_pago ?? "",
      is_facturado: pago,
      acciones: { row: pago },
      item: pago,
    }));

    // Sort the data
    return transformedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle dates
      if (
        sortConfig.key.includes("fecha") ||
        sortConfig.key === "fecha_creacion" ||
        sortConfig.key === "fecha_pago"
      ) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.sort ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (
        typeof aValue === "number" &&
        typeof bValue === "number" ||
        sortConfig.key === "monto" ||
        sortConfig.key === "monto_por_facturar"
      ) {
        return sortConfig.sort ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.sort
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Special case for is_facturado (object)
      if (sortConfig.key === "is_facturado") {
        const aFacturado = Number(aValue?.is_facturado) || 0;
        const bFacturado = Number(bValue?.is_facturado) || 0;
        return sortConfig.sort ? aFacturado - bFacturado : bFacturado - aFacturado;
      }


    });
  }, [pagos, filters, searchTerm, sortConfig.key, sortConfig.sort, filterBySelectedAgent, seleccionados, idAgenteSeleccionado]);


  const renderers = {
    // IDs and references
    id_movimiento: ({ value }: { value: number }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {value}
      </span>
    ),
    raw_id: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value) || ''}
      </span>
    ),
    id_agente: ({ value }: { value: string }) => (
      <span className="font-mono text-gray-700">
        {formatIdItem(value) || ''}
      </span>
    ),
    referencia: ({ value }: { value: string }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),

    // Amounts and numeric values
    monto: ({ value }: { value: number }) => (
      <span className="font-bold text-blue-600">
        ${formatNumberWithCommas(value)}
      </span>
    ),
    monto_por_facturar: ({ value }: { value: number }) => (
      <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
        ${formatNumberWithCommas(value)}
      </span>
    ),

    // Dates
    fecha_creacion: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      const date = new Date(value);
      if (!isValidDate(date)) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(date, "yy/MM/dd")}
        </div>
      );
    },
    fecha_pago: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "yy/MM/dd")}
        </div>
      );
    },

    // Texts and concepts
    nombre_agente: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">
        {value || ''}
      </span>
    ),
    concepto: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">
        {value || ''}
      </span>
    ),
    origen_pago: ({ value }: { value: string }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),

    // Payment methods
    metodo: ({ value }: { value: string }) => (
      <span className="capitalize bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
        {value || ''}
      </span>
    ),
    tipo: ({ value }: { value: string }) => (
      <span className="capitalize">
        {value || ''}
      </span>
    ),
    tipo_pago: ({ value }: { value: string }) => (
      <span className="capitalize">
        {value || ''}
      </span>
    ),

    // Bank information
    banco: ({ value }: { value: string }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),
    last_digits: ({ value }: { value: string | number }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {value || ''}
      </span>
    ),
    autorizacion: ({ value }: { value: string }) => (
      <span className="font-mono text-sm">
        {value || ''}
      </span>
    ),

    // Status and booleans

    is_facturado: ({ value }: { value: any }) => {
      // Asumiendo que 'value' es el objeto completo de la fila
      const saldoPorFacturar = Number(value?.monto_por_facturar) || 0;
      const monto = Number(value?.monto) || 0;
      const isFacturado = Number(value?.is_facturado) || 0;

      let className = '';
      let texto = '';

      if (isFacturado === 1 || saldoPorFacturar <= 0) {
        className = 'bg-green-100 text-green-800';
        texto = 'Facturado';
      } else if (saldoPorFacturar === monto) {
        className = 'bg-gray-100 text-gray-800';
        texto = 'No facturado';
      } else {
        className = 'bg-yellow-100 text-yellow-800';
        texto = 'Parcial';
      }

      return (
        <span className={`px-2 py-1 rounded-full text-xs ${className}`}>
          {texto}
        </span>
      );
    },
    // Links and documents
    link_pago: ({ value }: { value: string }) => (
      value ? (
        <span className="font-mono text-xs text-blue-600">
          {value}
        </span>
      ) : (
        <span className="text-gray-400"></span>
      )
    ),

    facturas_asociadas: ({ value }: { value: string }) => (
      value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
          Descargar
        </a>
      ) : (
        <span className="text-gray-400"></span>
      )
    ),

    // Actions funcionalidad de botones
    // ... (código anterior se mantiene igual)

    // Actions funcionalidad de botones
    acciones: ({ value }: { value: { row: any }; item: any }) => {
      const row = value.row;
      const selected = isRowSelected(row);
      const disabled = !canSelectRow(row);

      const tieneFacturas = row.facturas_asociadas && row.facturas_asociadas.length > 0;
      const mostrarOpcionesFacturacion = Number(row.monto_por_facturar) > 0;

      // Normaliza ids y montos
      const idAgente = (row.id_agente || row.ig_agente || '').toString();
      const rawId = row.raw_id;
      const saldoNum = Number(row.monto_por_facturar) || 0;
      const rawIds2 = seleccionados.map(s => s.raw_id);
      const saldos = [row.monto_por_facturar];
      const saldos3 = seleccionados.map(s => Number(s.monto_por_facturar));
      let saldos2 = saldos.length > 1 ? saldos3 : saldos;

      let rawIds = rawIds2.length == 0
        ? [row.raw_id]
        : rawIds2;

      let monto = totalSaldoSeleccionado === 0
        ? Number(row.monto_por_facturar)
        : totalSaldoSeleccionado;

      return (
        <div className="flex gap-1 items-center"> {/* Reducido el gap de 2 a 1 */}
          {/* Selección */}
          {mostrarOpcionesFacturacion && (
            <div className="flex items-center mr-1">
              <input
                type="checkbox"
                className="accent-purple-600 w-3.5 h-3.5"
                checked={selected}
                disabled={disabled && !selected}
                onChange={() => toggleSeleccion(row)}
                title={disabled && !selected ? 'Debe coincidir el mismo agente' : 'Seleccionar pago'}
              />
            </div>
          )}

          {/* Detalles */}
          <button
            className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1 text-xs"
            onClick={() => { setPagoSeleccionado(row); }}
          >
            <Eye className="w-3 h-3" /> {/* Icono más pequeño */}
            <span>Detalles</span>
          </button>

          {/* Facturas */}
          {tieneFacturas && (
            <button
              className="px-2 py-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1 text-xs"
              onClick={() => handleVerFacturas(row.facturas_asociadas)}
            >
              <FileText className="w-3 h-3" />
              <span>Facturas</span>
            </button>
          )}
        </div>
      );
    }

    // ... (el resto del código se mantiene igual)

  };

  // Muestra error si ocurrió
  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 w-full shadow-xl">
        <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }
  return (

    <div className="bg-white rounded-lg p-6 w-full shadow-xl">
      <h2 className="text-xl font-bold mb-4">Registro de Pagos</h2>

      {/* Sección de resumen de montos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Monto Pagado */}
        <div className="flex items-center gap-4 bg-white border border-blue-200 rounded-xl p-4 shadow-sm ring-1 ring-blue-100 hover:shadow-md transition">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700">Monto Pagado</h3>
            <p className="text-2xl font-bold text-blue-800">
              {balance ? formatCurrency(Number(balance.montototal)) : formatCurrency(0)}
            </p>
          </div>
        </div>

        {/* Monto Facturado */}
        <div className="flex items-center gap-4 bg-white border border-green-200 rounded-xl p-4 shadow-sm ring-1 ring-green-100 hover:shadow-md transition">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700">Monto Facturado</h3>
            <p className="text-2xl font-bold text-green-800">
              {balance ? formatCurrency(Number(balance.montofacturado)) : formatCurrency(0)}
            </p>
            <p className="text-sm mt-1">
              <span className="text-gray-600">Restante: </span>
              <span className={`font-semibold ${balance && Number(balance.restante) >= 0 ? "text-red-600" : "text-green-600"}`}>
                {balance ? formatCurrency(Number(balance.restante)) : formatCurrency(0)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de selección */}
      {seleccionados.length > 0 && (
        <div className="mb-4 p-3 border border-purple-200 bg-purple-50 rounded-lg flex items-center justify-between">
          <div className="text-sm text-purple-900">
            <span className="font-semibold">Seleccionados:</span> {seleccionados.length} &nbsp;|&nbsp;
            <span className="font-semibold">Agente:</span> {idAgenteSeleccionado} &nbsp;|&nbsp;
            <span className="font-semibold">Suma saldo:</span> {formatCurrency(totalSaldoSeleccionado)}
          </div>

          <div className="flex gap-2 items-center">
            {/* Dropdown Facturar (igual a acciones) */}


            {/* Limpiar */}
            <button
              className="text-xs px-3 py-1 rounded-md border border-purple-300 hover:bg-purple-100"
              onClick={() => setSeleccionados([])}
            >
              Limpiar selección
            </button>
          </div>

          {/* Cerrar menú al hacer click fuera */}
          {showBatchMenu && (
            <div className="fixed inset-0 z-0" onClick={() => setShowBatchMenu(false)} />
          )}
        </div>
      )}

      {/* Tabla de registros
      <Table4
        registros={filteredData}
        renderers={renderers}
      /> */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Filters
          onFilter={handleFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          defaultFilters={filters}
        />

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader />
            <span className="ml-2">Cargando pagos...</span>
          </div>
        ) : (
          <Table4
            registros={filteredData}
            renderers={renderers}
            customColumns={['nombre_agente', 'fecha_pago', 'monto', 'monto_por_facturar', 'acciones', 'is_facturado', 'tipo']}

          />
        )}
      </div>

      <ModalDetallePago
        pago={pagoSeleccionado}
        onClose={() => {
          setPagoSeleccionado(null);
          obtenerPagos();
          obtenerBalance();
        }}
      />
      {/* Modal para SubirFactura */}
      {showSubirFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
              </h2>
              <button
                onClick={() => setShowSubirFactura(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <SubirFactura
                pagoData={pagoAFacturar}  // Pasamos el objeto completo del pago
                onSuccess={() => {
                  setShowSubirFactura(false);
                  obtenerPagos();
                  obtenerBalance();
                  // Aquí puedes añadir lógica adicional después de subir la factura
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal de facturas asociadas */}
      {showFacturasModal && (
        <ModalFacturasAsociadas
          facturas={facturasAsociadas}
          onClose={() => {
            setShowFacturasModal(false)
            obtenerPagos();
            obtenerBalance();
          }}
        />
      )}

      {/* Modal for Batch Billing */}
      {batchBilling && showBillingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Generar factura para pagos seleccionados ({seleccionados.length})
              </h2>
              <button
                onClick={() => {
                  setShowBillingPage(false);
                  setBatchBilling(null);
                  obtenerPagos();
                  obtenerBalance();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <BillingPage
                onBack={() => {
                  setShowBillingPage(false);
                  setBatchBilling(null);
                  obtenerPagos();
                  setSeleccionados([]); // También limpia la selección
                }}
                userId={batchBilling.userId}
                saldoMonto={batchBilling.saldoMonto}
                rawIds={batchBilling.rawIds}
                saldos={seleccionados.map(s => Number(s.monto_por_facturar) || 0)}
                isBatch={true}
                pagoData={seleccionados.map(s => {
                  const pago = pagos.find(p => p.raw_id === s.raw_id);
                  return pago || null;
                }).filter(Boolean)} // Pasamos un array con todos los pagos seleccionados
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para SubirFactura en batch */}
      {showBatchSubirFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Asignar factura a {seleccionados.length} pagos seleccionados
              </h2>
              <button
                onClick={() => {
                  setShowBatchSubirFactura(false)
                  obtenerPagos();
                  obtenerBalance();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <SubirFactura
                pagoData={batchPagoAFacturar}
                onSuccess={() => {
                  setShowBatchSubirFactura(false);
                  obtenerPagos();
                  obtenerBalance();
                  setSeleccionados([]); // Limpiar selección después de asignar
                }}
                isBatch={true} // Puedes usar esto para modificar el comportamiento si es necesario
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaPagosVisualizacion;
