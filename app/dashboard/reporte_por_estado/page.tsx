"use client";

import { Table5 } from "@/components/Table5";
import { ApiService } from "@/services/ApiService";
import BaseCard from "@/components/atom/BaseCard";
import { Loader } from "@/components/atom/Loader";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckboxInput, DropdownValues } from "@/components/atom/Input";
import Button from "@/components/atom/Button";

class EstadoReporteService extends ApiService {
  constructor() {
    super("/mia/hoteles");
  }

  async obtenerReportePorEstado() {
    return this.get<EstadoPreview[]>({
      path: this.formatPath("/getReportePorEstado"),
    });
  }

  async obtenerTopProveedores(
    estado: string | null,
    mostrarTodos: boolean = false,
  ) {
    return this.get<ProveedorEstadoPreview[]>({
      path: this.formatPath("/getTopProveedores"),
      params: { estado, mostrarTodos },
    });
  }

  async obtenerTopClientes(
    estado: string | null,
    mostrarTodos: boolean = false,
  ) {
    return this.get<ClienteEstadoPreview[]>({
      path: this.formatPath("/getTopClientes"),
      params: { estado, mostrarTodos },
    });
  }
}

type EstadoPreview = {
  estado: string;
  cantidad_reservas_confirmadas: number;
  monto_reservas_confirmadas: number;
  promedio_por_reserva: number;
};

type EstadoRow = EstadoPreview & {
  id: string;
  acciones: string;
  item: EstadoPreview;
};

type ProveedorEstadoPreview = {
  estado: string;
  id_hotel: string;
  cadena?: string;
  nombre: string;
  cantidad_de_reservas: number;
  monto_reservas_confirmadas: number;
};

type ClienteEstadoPreview = {
  estado: string;
  id_agente: string;
  cadena?: string;
  nombre: string;
  cantidad_de_reservas: number;
  total_por_reservas: number;
};

type ProveedorExportacion = ProveedorEstadoPreview & {
  top: number;
};

type ClienteExportacion = ClienteEstadoPreview & {
  top: number;
};

const estadoReporteService = new EstadoReporteService();

const formatMoney = (value: number | string | null | undefined) => {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
};

const renderNumero = ({ value }: { value: number }) => (
  <span className="block w-full text-center text-xs font-semibold text-gray-800">
    {Number(value || 0).toLocaleString("es-MX")}
  </span>
);

const renderDinero = ({ value }: { value: number }) => (
  <span className="block w-full text-right text-xs font-semibold text-emerald-700">
    {formatMoney(value)}
  </span>
);

const normalizarEstado = (estado: string | null | undefined) => {
  const estadoLimpio = String(estado ?? "").trim();

  return estadoLimpio || "SIN ESTADO";
};

const calcularTotalProveedores = (proveedores: ProveedorEstadoPreview[]) => {
  return {
    nombre: "TOTAL",
    cantidad_de_reservas: proveedores.reduce(
      (sum, p) => sum + (Number(p.cantidad_de_reservas) || 0),
      0,
    ),
    monto_reservas_confirmadas: proveedores.reduce(
      (sum, p) => sum + (Number(p.monto_reservas_confirmadas) || 0),
      0,
    ),
  };
};

const calcularTotalClientes = (clientes: ClienteEstadoPreview[]) => {
  return {
    nombre: "TOTAL",
    cantidad_de_reservas: clientes.reduce(
      (sum, c) => sum + (Number(c.cantidad_de_reservas) || 0),
      0,
    ),
    total_por_reservas: clientes.reduce(
      (sum, c) => sum + (Number(c.total_por_reservas) || 0),
      0,
    ),
  };
};

export default function Page() {
  const [reportePorEstado, setReportePorEstado] = useState<EstadoPreview[]>([]);

  const [proveedoresPorEstado, setProveedoresPorEstado] = useState<
    Record<string, ProveedorEstadoPreview[]>
  >({});

  const [opcion, setOpcion] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [exportarProveedores, setExportarProveedores] = useState(false);
  const [exportarClientes, setExportarClientes] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [clientesPorEstado, setClientesPorEstado] = useState<
    Record<string, ClienteEstadoPreview[]>
  >({});

  const [filasExpandibles, setFilasExpandibles] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] = useState(false);

  const [loadingDetalle, setLoadingDetalle] = useState<Record<string, boolean>>(
    {},
  );

  const [error, setError] = useState<string | null>(null);

  const detallesCargadosRef = useRef<Set<string>>(new Set());
  const detallesEnCargaRef = useRef<Set<string>>(new Set());
  const versionDetallesRef = useRef(0);

  const customColumns: (keyof EstadoRow)[] = [
    "acciones",
    "estado",
    "cantidad_reservas_confirmadas",
    "monto_reservas_confirmadas",
    "promedio_por_reserva",
  ];

  const proveedorColumns: (keyof ProveedorEstadoPreview)[] = [
    // "id_hotel",
    "nombre",
    "cantidad_de_reservas",
    "monto_reservas_confirmadas",
  ];

  const clienteColumns: (keyof ClienteEstadoPreview)[] = [
    //"id_agente",
    "nombre",
    "cantidad_de_reservas",
    "total_por_reservas",
  ];

  const reporteTabla: EstadoRow[] = useMemo(() => {
    return reportePorEstado.map((row) => ({
      ...row,
      id: row.estado,
      acciones: "",
      item: row,
    }));
  }, [reportePorEstado]);

  const resumenCards = useMemo(() => {
    const totalReservas = reportePorEstado.reduce(
      (acc, item) => acc + Number(item.cantidad_reservas_confirmadas || 0),
      0,
    );

    const montoTotal = reportePorEstado.reduce(
      (acc, item) => acc + Number(item.monto_reservas_confirmadas || 0),
      0,
    );

    const promedioGeneral = totalReservas > 0 ? montoTotal / totalReservas : 0;

    return {
      estados: reportePorEstado.length,
      totalReservas,
      montoTotal,
      promedioGeneral,
    };
  }, [reportePorEstado]);

  const cargarReportePorEstado = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await estadoReporteService.obtenerReportePorEstado();

      setReportePorEstado(response.data || []);
    } catch (error) {
      console.error("Error al cargar reporte por estado:", error);
      setError("No se pudo cargar el reporte por estado.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerClaveDetalle = (estado: string, modoMostrarTodos: boolean) => {
    return `${modoMostrarTodos ? "todos" : "top"}::${estado ?? ""}`;
  };

  const cargarDetallesEstado = async (estado: string) => {
    const modoMostrarTodos = mostrarTodos;

    const claveDetalle = obtenerClaveDetalle(estado, modoMostrarTodos);

    if (
      detallesCargadosRef.current.has(claveDetalle) ||
      detallesEnCargaRef.current.has(claveDetalle)
    ) {
      return;
    }

    const versionActual = versionDetallesRef.current;

    detallesEnCargaRef.current.add(claveDetalle);

    try {
      setLoadingDetalle((prev) => ({
        ...prev,
        [estado]: true,
      }));

      const [proveedoresRes, clientesRes] = await Promise.all([
        estadoReporteService.obtenerTopProveedores(estado, modoMostrarTodos),
        estadoReporteService.obtenerTopClientes(estado, modoMostrarTodos),
      ]);

      if (versionActual !== versionDetallesRef.current) {
        return;
      }

      setProveedoresPorEstado((prev) => ({
        ...prev,
        [estado]: proveedoresRes.data || [],
      }));

      setClientesPorEstado((prev) => ({
        ...prev,
        [estado]: clientesRes.data || [],
      }));

      detallesCargadosRef.current.add(claveDetalle);
    } catch (error) {
      if (versionActual === versionDetallesRef.current) {
        console.error("Error al cargar:", error);
        setError(
          `No se pudieron cargar los detalles de ${normalizarEstado(estado)}.`,
        );
      }
    } finally {
      detallesEnCargaRef.current.delete(claveDetalle);

      if (versionActual === versionDetallesRef.current) {
        setLoadingDetalle((prev) => ({
          ...prev,
          [estado]: false,
        }));
      }
    }
  };

  const toggleEstado = async (estado: string) => {
    const estaAbierto = Boolean(filasExpandibles[estado]);

    setFilasExpandibles((prev) => ({
      ...prev,
      [estado]: !estaAbierto,
    }));

    if (!estaAbierto) {
      await cargarDetallesEstado(estado);
    }
  };

  const cambiarMostrarTodos = () => {
    versionDetallesRef.current += 1;

    detallesCargadosRef.current.clear();
    detallesEnCargaRef.current.clear();

    setMostrarTodos((prev) => !prev);
    setFilasExpandibles({});
    setProveedoresPorEstado({});
    setClientesPorEstado({});
    setLoadingDetalle({});
  };

  useEffect(() => {
    cargarReportePorEstado();
  }, []);

  const escaparCsv = (valor: unknown) => {
    const texto = String(valor ?? "").replace(/"/g, '""');

    return `"${texto}"`;
  };

  const descargarCsv = (filas: unknown[][], nombreArchivo: string) => {
    const contenido = filas
      .map((fila) => fila.map((valor) => escaparCsv(valor)).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombreArchivo;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  const exportarReporteCsv = async () => {
    if (!exportarProveedores && !exportarClientes) {
      setError("Selecciona proveedores, clientes o ambos para exportar.");
      return;
    }

    try {
      setExportando(true);
      setError(null);

      let proveedoresExportacion: ProveedorExportacion[] = [];
      let clientesExportacion: ClienteExportacion[] = [];

      if (exportarProveedores) {
        const respuesta = await estadoReporteService.obtenerTopProveedores(
          null,
          mostrarTodos,
        );

        proveedoresExportacion = (respuesta.data || []).map(
          (proveedor, index) => ({
            ...proveedor,
            estado: normalizarEstado(proveedor.estado),
            top: index + 1,
          }),
        );
      }

      if (exportarClientes) {
        const respuesta = await estadoReporteService.obtenerTopClientes(
          null,
          mostrarTodos,
        );

        clientesExportacion = (respuesta.data || []).map((cliente, index) => ({
          ...cliente,
          estado: normalizarEstado(cliente.estado),
          top: index + 1,
        }));
      }

      const encabezados: unknown[] = [];

      if (exportarProveedores) {
        encabezados.push(
          "Top proveedor",
          "Estado proveedor",
          // "Top proveedor",
          // "Cadena proveedor",
          "Nombre proveedor",
          "Cantidad de reservas proveedor",
          "Monto proveedor",
        );
      }

      if (exportarProveedores && exportarClientes) {
        encabezados.push("");
      }

      if (exportarClientes) {
        encabezados.push(
          "Top cliente",
          "Estado cliente",
          // "Top cliente",
          // "Cadena cliente",
          "Nombre cliente",
          "Cantidad de reservas cliente",
          "Total cliente",
        );
      }

      const cantidadFilas = Math.max(
        exportarProveedores ? proveedoresExportacion.length : 0,
        exportarClientes ? clientesExportacion.length : 0,
      );

      const filas: unknown[][] = [encabezados];

      for (let index = 0; index < cantidadFilas; index++) {
        const fila: unknown[] = [];

        if (exportarProveedores) {
          const proveedor = proveedoresExportacion[index];

          fila.push(
            proveedor?.top ?? "",
            proveedor?.estado ?? "",
            // proveedor?.top ?? "",
            // proveedor?.cadena ?? "",
            proveedor?.nombre ?? "",
            proveedor?.cantidad_de_reservas ?? "",
            proveedor?.monto_reservas_confirmadas ?? "",
          );
        }

        if (exportarProveedores && exportarClientes) {
          fila.push("");
        }

        if (exportarClientes) {
          const cliente = clientesExportacion[index];

          fila.push(
            cliente?.top ?? "",
            cliente?.estado ?? "",
            // cliente?.top ?? "",
            // cliente?.cadena ?? "",
            cliente?.nombre ?? "",
            cliente?.cantidad_de_reservas ?? "",
            cliente?.total_por_reservas ?? "",
          );
        }

        filas.push(fila);
      }

      const fecha = new Date().toISOString().slice(0, 10);

      descargarCsv(filas, `reporte_por_estado_${fecha}.csv`);
    } catch (error) {
      console.error("Error al exportar reporte:", error);
      setError("No se pudo exportar el reporte.");
    } finally {
      setExportando(false);
    }
  };

  const renderersEstado = {
    acciones: ({ item }: { item: EstadoPreview }) => {
      const abierto = filasExpandibles[item.estado];

      return (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleEstado(item.estado);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
            title={abierto ? "Ocultar detalle" : "Ver detalle"}
          >
            {abierto ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      );
    },

    estado: ({ value }: { value: string }) => (
      <span className="block text-left text-xs font-bold uppercase text-slate-800">
        {value || "Sin estado"}
      </span>
    ),

    cantidad_de_reservas: renderNumero,

    cantidad_reservas_confirmadas: renderNumero,
    monto_reservas_confirmadas: renderDinero,
    promedio_por_reserva: renderDinero,

    total_por_reservas: renderDinero,
  };

  const renderersProveedor = {
    id_hotel: ({ value }: { value: string }) => (
      <span className="font-mono text-[11px] text-slate-600">
        {value ? `${value.slice(0, 10)}...` : "—"}
      </span>
    ),

    nombre: ({ value }: { value: string }) => (
      <span className="block text-xs font-semibold text-slate-800">
        {value || "Sin nombre"}
      </span>
    ),

    cantidad_de_reservas: renderNumero,
    monto_reservas_confirmadas: renderDinero,
  };

  const renderersCliente = {
    id_agente: ({ value }: { value: string }) => (
      <span className="font-mono text-[11px] text-slate-600">
        {value ? `${value.slice(0, 10)}...` : "—"}
      </span>
    ),

    nombre: ({ value }: { value: string }) => (
      <span className="block text-xs font-semibold text-slate-800">
        {value || "Sin nombre"}
      </span>
    ),

    cantidad_de_reservas: renderNumero,
    total_por_reservas: renderDinero,
  };

  const expandedRenderer = (row: EstadoRow) => {
    const estado = row.estado;

    const proveedores = proveedoresPorEstado[estado] || [];
    const clientes = clientesPorEstado[estado] || [];

    const proveedoresConTotales = [
      ...proveedores,
      calcularTotalProveedores(proveedores),
    ];

    const clientesConTotales = [...clientes, calcularTotalClientes(clientes)];

    const cargando = loadingDetalle[estado];

    if (cargando) {
      return (
        <div className="flex items-center justify-center gap-2 bg-slate-50 p-6 text-sm text-slate-500">
          <Loader />
          <span>
            Cargando top proveedores y clientes de {normalizarEstado(estado)}...
          </span>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Detalle de {normalizarEstado(estado)}
            </h3>

            <p className="text-xs text-slate-500">
              Top proveedores y top clientes con reservas confirmadas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                Top proveedores
              </h4>

              <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                {proveedores.length} registros
              </span>
            </div>

            <Table5<ProveedorEstadoPreview>
              registros={proveedoresConTotales}
              renderers={renderersProveedor}
              customColumns={proveedorColumns}
              respectCustomColumnOrder={true}
              expandableColumns={[]}
              exportButton={false}
              isExport={false}
              horizontalScroll={true}
              maxHeight="300px"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Top clientes</h4>

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                {clientes.length} registros
              </span>
            </div>

            <Table5<ClienteEstadoPreview>
              registros={clientesConTotales}
              renderers={renderersCliente}
              customColumns={clienteColumns}
              respectCustomColumnOrder={true}
              expandableColumns={[]}
              exportButton={false}
              isExport={false}
              horizontalScroll={true}
              maxHeight="300px"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 overflow-y-auto bg-white p-3 sm:p-4">
      {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Estados
            </h3>
          }
          color="blue"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.estados}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Reservas confirmadas
            </h3>
          }
          color="green"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.totalReservas.toLocaleString("es-MX")}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Monto confirmado
            </h3>
          }
          color="sky"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {formatMoney(resumenCards.montoTotal)}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Promedio por reserva
            </h3>
          }
          color="orange"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {formatMoney(resumenCards.promedioGeneral)}
          </div>
        </BaseCard>
      </div> */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="w-full min-w-0 overflow-x-auto rounded-lg border bg-white p-2 sm:p-3">
        <div className="flex items-center justify-end gap-6 p-6">
          <CheckboxInput
            label="mostrar todos"
            checked={mostrarTodos}
            onChange={cambiarMostrarTodos}
          />

          <CheckboxInput
            label="Exportar proveedores"
            checked={exportarProveedores}
            onChange={() => setExportarProveedores((prev) => !prev)}
          />

          <CheckboxInput
            label="Exportar clientes"
            checked={exportarClientes}
            onChange={() => setExportarClientes((prev) => !prev)}
          />

          <Button
            variant="secondary"
            size="md"
            icon={Download}
            onClick={exportarReporteCsv}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          ></Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader />
          </div>
        ) : (
          <Table5<EstadoRow>
            registros={reporteTabla}
            renderers={renderersEstado}
            customColumns={customColumns}
            respectCustomColumnOrder={true}
            expandableColumns={[]}
            exportButton={false}
            isExport={false}
            horizontalScroll={true}
            maxHeight="65vh"
            filasExpandibles={filasExpandibles}
            expandedRenderer={expandedRenderer}
            getRowClassName={(row) =>
              filasExpandibles[row.id] ? "bg-blue-50" : ""
            }
          />
        )}
      </div>
    </div>
  );
}
