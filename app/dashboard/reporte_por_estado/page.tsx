"use client";

import { useState } from "react";

import { Table5 } from "@/components/Table5";
import Button from "@/components/atom/Button";
import CheckIcon from "@/components/atom/CheckIcon";
import { TextInput } from "@/components/atom/Input";

import { ApiService } from "@/services/ApiService";

import {
  capitalizarTexto,
  formatMoneyMXN,
  formatNumber,
} from "@/helpers/formater";

// ============================================
// CAMPOS PARA AGRUPAR
// ============================================

type CampoOrden =
  | "estado"
  | "pais"
  | "tipo_pago"
  | "tipo_negociacion"
  | "nombre";

// ============================================
// RESPUESTA DEL REPORTE GENERAL
// ============================================

type ReporteGeneral = {
  pais: string;
  estado: string;
  nombre: string;
  tipo_negociacion: string;
  tipo_pago: string;

  cantidad_reservas_confirmadas: number;
  monto_reservas_confirmadas: number;
  promedio_por_reserva: number;
};

// ============================================
// FILAS DE LA TABLA GENERAL
// ============================================

type ReporteRow = {
  id: string;

  pais?: string;
  estado?: string;
  nombre?: string;
  tipo_negociacion?: string;
  tipo_pago?: string;

  cantidad_reservas_confirmadas: number;
  monto_reservas_confirmadas: number;
  promedio_por_reserva: number;
};

// ============================================
// PARÁMETROS PARA DETALLES
// ============================================

type DetalleParams = {
  pais: string;
  estado: string;
  nombre: string;
  tipo_negociacion: string;
  tipo_pago: string;
};

// ============================================
// RESPUESTA DETALLES CLIENTES
// ============================================

type DetalleCliente = {
  nombre: string;
  estado: string;
  cantidad_de_reservas: number;
  total_por_reservas: number;
};

type DetalleClienteRow = DetalleCliente & {
  id: string;
};

// ============================================
// LABELS
// ============================================

const labels: Record<CampoOrden, string> = {
  estado: "Estado",
  pais: "País",
  tipo_pago: "Tipo de pago",
  tipo_negociacion: "Tipo de negociación",
  nombre: "Hotel",
};

// ============================================
// SERVICIO
// ============================================

class Reporte extends ApiService {
  constructor() {
    super("/mia/hoteles");
  }

  // Reporte general
  async obtenerReporteGeneral() {
    return this.get<ReporteGeneral[]>({
      path: this.formatPath("/reporteGeneralConciliacion"),
    });
  }

  // Detalles de clientes
  async obtenerDetallesClientes(params: DetalleParams) {
    return this.get<DetalleCliente[]>({
      path: this.formatPath("/detallesClientesReporte"),
      params,
    });
  }
}

const reporteService = new Reporte();

// ============================================
// COMPONENTE
// ============================================

export default function Page() {
  // Lo que el usuario está seleccionando actualmente
  const [orden, setOrden] = useState<CampoOrden[]>([]);

  // Lo que actualmente está aplicado en la tabla
  const [ordenAplicado, setOrdenAplicado] = useState<CampoOrden[]>([]);

  // Tabla general
  const [reporte, setReporte] = useState<ReporteRow[]>([]);

  // Lo que el usuario está escribiendo
  const [busqueda, setBusqueda] = useState("");

  // Lo que realmente se está usando para filtrar la tabla
  const [busquedaAplicada, setBusquedaAplicada] = useState("");

  // Tabla de detalles
  const [detalleClientes, setDetalleClientes] = useState<DetalleClienteRow[]>(
    [],
  );

  // Control del modal
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  // Loadings
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ============================================
  // SELECCIONAR / DESELECCIONAR CHECK
  // ============================================

  const toggleOrden = (valor: CampoOrden) => {
    setOrden((prev) =>
      prev.includes(valor)
        ? prev.filter((item) => item !== valor)
        : [...prev, valor],
    );
  };

  // ============================================
  // AGRUPAR DATOS
  // ============================================

  const agruparDatos = (
    datos: ReporteGeneral[],
    campos: CampoOrden[],
  ): ReporteRow[] => {
    const agrupados = datos.reduce<Record<string, ReporteRow>>((acc, curr) => {
      const valores = campos.map((campo) => {
        const valor = String(curr[campo] ?? "").trim();

        return valor || `SIN ${labels[campo].toUpperCase()}`;
      });

      // Ejemplo:
      // CIUDAD DE MEXICO|CREDITO
      const clave = valores.join("|");

      if (!(clave in acc)) {
        const dimensiones = campos.reduce<Record<string, string>>(
          (obj, campo, index) => {
            obj[campo] = valores[index];

            return obj;
          },
          {},
        );

        acc[clave] = {
          id: clave,

          ...dimensiones,

          cantidad_reservas_confirmadas: 0,
          monto_reservas_confirmadas: 0,
          promedio_por_reserva: 0,
        };
      }

      // Sumamos cantidad de reservas
      acc[clave].cantidad_reservas_confirmadas +=
        Number(curr.cantidad_reservas_confirmadas) || 0;

      // Sumamos monto de reservas
      acc[clave].monto_reservas_confirmadas +=
        Number(curr.monto_reservas_confirmadas) || 0;

      // Recalculamos promedio
      const cantidad = acc[clave].cantidad_reservas_confirmadas;

      const monto = acc[clave].monto_reservas_confirmadas;

      acc[clave].promedio_por_reserva = cantidad > 0 ? monto / cantidad : 0;

      return acc;
    }, {});

    return Object.values(agrupados);
  };

  // ============================================
  // BUSCAR REPORTE GENERAL
  // ============================================

  const handleBuscar = async () => {
    try {
      setLoading(true);

      // Aplicamos el texto que está escrito actualmente.
      // Escribir por sí solo NO modifica la tabla.
      setBusquedaAplicada(busqueda.trim());

      const response = await reporteService.obtenerReporteGeneral();

      const datos = response.data || [];

      // Cerramos cualquier detalle anterior
      setDetalleAbierto(false);
      setDetalleClientes([]);

      // ==========================================
      // SIN AGRUPACIÓN
      // ==========================================

      if (orden.length === 0) {
        const datosCompletos: ReporteRow[] = datos.map((item, index) => ({
          ...item,
          id: `${index}`,
        }));

        setOrdenAplicado([]);
        setReporte(datosCompletos);

        return;
      }

      // ==========================================
      // CON AGRUPACIÓN
      // ==========================================

      const resultado = agruparDatos(datos, orden);

      setOrdenAplicado([...orden]);
      setReporte(resultado);
    } catch (error) {
      console.error("Error al obtener el reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LIMPIAR CHECKS
  // ============================================

  const handleLimpiar = () => {
    // Solamente limpia los checks.
    // No modifica la tabla.
    setOrden([]);
    setBusqueda("");
    setBusquedaAplicada("");
  };

  // ============================================
  // CLIC EN CANTIDAD DE RESERVAS
  // ============================================

  const handleCantidadClick = async (item: ReporteRow) => {
    try {
      // Abrimos modal
      setDetalleAbierto(true);

      // Loading del detalle
      setLoadingDetalle(true);

      // Quitamos información anterior
      setDetalleClientes([]);

      // Parámetros para el backend
      const params: DetalleParams = {
        pais: item.pais ?? "",
        estado: item.estado ?? "",
        nombre: item.nombre ?? "",
        tipo_negociacion: item.tipo_negociacion ?? "",
        tipo_pago: item.tipo_pago ?? "",
      };

      console.log("Parámetros enviados al detalle:", params);

      const response = await reporteService.obtenerDetallesClientes(params);

      // Agregamos id para Table5
      const detalles: DetalleClienteRow[] = (response.data || []).map(
        (item, index) => ({
          ...item,
          id: `${index}`,
        }),
      );

      setDetalleClientes(detalles);
    } catch (error) {
      console.error("Error al obtener detalles:", error);

      setDetalleClientes([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ============================================
  // CERRAR MODAL
  // ============================================

  const handleCerrarDetalle = () => {
    setDetalleAbierto(false);
    setDetalleClientes([]);
  };

  // ============================================
  // COLUMNAS TABLA GENERAL
  // ============================================

  const todasLasColumnas: (keyof ReporteRow)[] = [
    "pais",
    "estado",
    "nombre",
    "tipo_negociacion",
    "tipo_pago",
    "cantidad_reservas_confirmadas",
    "monto_reservas_confirmadas",
    "promedio_por_reserva",
  ];

  const customColumns: (keyof ReporteRow)[] =
    ordenAplicado.length === 0
      ? todasLasColumnas
      : [
          ...ordenAplicado,
          "cantidad_reservas_confirmadas",
          "monto_reservas_confirmadas",
          "promedio_por_reserva",
        ];

  // ============================================
  // FILTRAR TABLA POR TEXTO
  // ============================================

  const reporteFiltrado = reporte.filter((item) => {
    // IMPORTANTE:
    // usamos busquedaAplicada y NO busqueda.
    //
    // Por eso escribir no cambia la tabla.
    const texto = busquedaAplicada.trim().toLowerCase();

    // Si no hay texto aplicado,
    // mostramos todos los registros.
    if (texto === "") {
      return true;
    }

    // Buscamos solamente dentro de las columnas
    // que actualmente se están mostrando.
    return customColumns.some((columna) => {
      const valor = item[columna];

      return String(valor ?? "")
        .toLowerCase()
        .includes(texto);
    });
  });

  // ============================================
  // COLUMNAS TABLA DETALLES
  // ============================================

  const detalleColumns: (keyof DetalleClienteRow)[] = [
    "nombre",
    "estado",
    "cantidad_de_reservas",
    "total_por_reservas",
  ];

  // ============================================
  // RENDERERS TABLA GENERAL
  // ============================================

  const renderers = {
    pais: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin país"}
      </span>
    ),

    estado: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin estado"}
      </span>
    ),

    nombre: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin hotel"}
      </span>
    ),

    tipo_negociacion: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin tipo de negociación"}
      </span>
    ),

    tipo_pago: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin tipo de pago"}
      </span>
    ),

    cantidad_reservas_confirmadas: ({
      value,
      item,
    }: {
      value: number;
      item: ReporteRow;
    }) => (
      <button
        type="button"
        onClick={() => handleCantidadClick(item)}
        className="block w-full cursor-pointer text-center text-xs font-semibold text-blue-600 underline"
      >
        {formatNumber(value, {
          maximumFractionDigits: 0,
        })}
      </button>
    ),

    monto_reservas_confirmadas: ({ value }: { value: number }) => (
      <span className="block w-full text-right text-xs font-semibold text-emerald-700">
        {formatMoneyMXN(value)}
      </span>
    ),

    promedio_por_reserva: ({ value }: { value: number }) => (
      <span className="block w-full text-right text-xs font-semibold text-emerald-700">
        {formatMoneyMXN(value)}
      </span>
    ),
  };

  // ============================================
  // RENDERERS DETALLES CLIENTES
  // ============================================

  const renderersDetalle = {
    nombre: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin cliente"}
      </span>
    ),

    estado: ({ value }: { value: string }) => (
      <span className="text-xs font-semibold">
        {value ? capitalizarTexto(value) : "Sin estado"}
      </span>
    ),

    cantidad_de_reservas: ({ value }: { value: number }) => (
      <span className="block w-full text-center text-xs font-semibold">
        {formatNumber(value, {
          maximumFractionDigits: 0,
        })}
      </span>
    ),

    total_por_reservas: ({ value }: { value: number }) => (
      <span className="block w-full text-right text-xs font-semibold text-emerald-700">
        {formatMoneyMXN(value)}
      </span>
    ),
  };

  // ============================================
  // JSX
  // ============================================

  return (
    <div className="flex w-full flex-col gap-4 bg-white p-3 sm:p-4">
      {/* ========================================
          CONTENIDO PRINCIPAL
      ======================================== */}

      <div className="w-full rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-4 p-4">
          {/* ========================================
              CONTROLES
          ======================================== */}

          <div className="flex flex-col gap-6 p-4  md:flex-row md:justify-between md:flex-wrap">
            <div className="flex flex-col gap-6 p-4  md:flex-row md:justify-between md:flex-wrap">
              <label>Ordenar por:</label>

              <CheckIcon
                text="Estado"
                size="md"
                active={orden.includes("estado")}
                onClick={() => toggleOrden("estado")}
              />

              <CheckIcon
                text="País"
                size="md"
                active={orden.includes("pais")}
                onClick={() => toggleOrden("pais")}
              />

              <CheckIcon
                text="Tipo de pago"
                size="md"
                active={orden.includes("tipo_pago")}
                onClick={() => toggleOrden("tipo_pago")}
              />

              <CheckIcon
                text="Tipo de negociación"
                size="md"
                active={orden.includes("tipo_negociacion")}
                onClick={() => toggleOrden("tipo_negociacion")}
              />

              <CheckIcon
                text="Hotel"
                size="md"
                active={orden.includes("nombre")}
                onClick={() => toggleOrden("nombre")}
              />
            </div>
            <div className="flex gap-3  ">
              {/* ========================================
                BUSCADOR
            ======================================== */}

              <TextInput
                value={busqueda}
                onChange={setBusqueda}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBuscar();
                  }
                }}
                placeholder="Buscar en la tabla..."
                className="w-full sm:w-64"
              />

              <Button
                variant="primary"
                size="md"
                onClick={handleBuscar}
                loading={loading}
              >
                Buscar
              </Button>

              <Button variant="warning" size="md" onClick={handleLimpiar}>
                Limpiar
              </Button>
            </div>
          </div>

          {/* ========================================
                ORDEN SELECCIONADO
            ======================================== */}

          <TextInput
            label="Orden seleccionado"
            value={orden.map((campo) => labels[campo]).join(" / ")}
            disabled
            placeholder="Sin agrupación"
            className="w-full"
          />
        </div>

        {/* ========================================
              TABLA GENERAL
          ======================================== */}

        {reporte.length > 0 && reporteFiltrado.length > 0 && (
          <Table5<ReporteRow>
            registros={reporteFiltrado}
            renderers={renderers}
            customColumns={customColumns}
            respectCustomColumnOrder={true}
            expandableColumns={[]}
            exportButton={false}
            isExport={false}
            horizontalScroll={true}
            maxHeight="65vh"
          />
        )}

        {/* ========================================
              SIN RESULTADOS DEL BUSCADOR
          ======================================== */}

        {reporte.length > 0 && reporteFiltrado.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No se encontraron resultados para &quot;{busquedaAplicada}&quot;.
          </div>
        )}
      </div>

      {/* ========================================
          MODAL DETALLES
      ======================================== */}

      {detalleAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
            {/* ========================================
                ENCABEZADO DEL MODAL
            ======================================== */}

            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Detalle de clientes
              </h2>

              <Button variant="warning" size="sm" onClick={handleCerrarDetalle}>
                Cerrar
              </Button>
            </div>

            {/* ========================================
                CONTENIDO DEL MODAL
            ======================================== */}

            <div className="overflow-auto p-5">
              {/* LOADING */}

              {loadingDetalle && (
                <div className="py-10 text-center text-sm text-gray-500">
                  Cargando detalles...
                </div>
              )}

              {/* TABLA DE DETALLES */}

              {!loadingDetalle && detalleClientes.length > 0 && (
                <Table5<DetalleClienteRow>
                  registros={detalleClientes}
                  renderers={renderersDetalle}
                  customColumns={detalleColumns}
                  respectCustomColumnOrder={true}
                  expandableColumns={[]}
                  exportButton={false}
                  isExport={false}
                  horizontalScroll={true}
                  maxHeight="60vh"
                />
              )}

              {/* SIN RESULTADOS */}

              {!loadingDetalle && detalleClientes.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No se encontraron detalles.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
