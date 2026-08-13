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
// CAMPOS POR LOS QUE PODEMOS AGRUPAR
// ============================================

type CampoOrden =
  | "estado"
  | "pais"
  | "tipo_pago"
  | "tipo_negociacion"
  | "nombre";

// ============================================
// RESPUESTA DE getReportePorEstado
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
// FILAS QUE UTILIZARÁ LA TABLA
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
// TEXTOS VISUALES
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

  async obtenerReporteGeneral() {
    return this.get<ReporteGeneral[]>({
      path: this.formatPath("/getReporteGeneralConciliacion"), //getReporteGeneralConciliacion y el otro se va a llamar getDetallesClientes
    });
  }
}

const reporteService = new Reporte();

// ============================================
// COMPONENTE
// ============================================

export default function Page() {
  // Lo que el usuario está seleccionando actualmente.
  const [orden, setOrden] = useState<CampoOrden[]>([]);

  // Lo que realmente está aplicado en la tabla.
  // Solo cambia cuando se presiona Buscar.
  const [ordenAplicado, setOrdenAplicado] = useState<CampoOrden[]>([]);

  // Datos que muestra la tabla.
  const [reporte, setReporte] = useState<ReporteRow[]>([]);

  const [loading, setLoading] = useState(false);

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
      // Ejemplo:
      //
      // campos:
      // ["estado", "tipo_pago"]
      //
      // valores:
      // ["AGUASCALIENTES", "CREDITO"]

      const valores = campos.map((campo) => {
        const valor = String(curr[campo] ?? "").trim();

        return valor || `SIN ${labels[campo].toUpperCase()}`;
      });

      // Creamos una clave para identificar cada grupo.
      //
      // Ejemplo:
      // AGUASCALIENTES|CREDITO

      const clave = valores.join("|");

      // Si el grupo todavía no existe, lo creamos.
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

      // Sumamos reservas.
      acc[clave].cantidad_reservas_confirmadas +=
        Number(curr.cantidad_reservas_confirmadas) || 0;

      // Sumamos monto.
      acc[clave].monto_reservas_confirmadas +=
        Number(curr.monto_reservas_confirmadas) || 0;

      // Recalculamos el promedio.
      const cantidad = acc[clave].cantidad_reservas_confirmadas;

      const monto = acc[clave].monto_reservas_confirmadas;

      acc[clave].promedio_por_reserva = cantidad > 0 ? monto / cantidad : 0;

      return acc;
    }, {});

    return Object.values(agrupados);
  };

  // ============================================
  // BUSCAR
  // ============================================

  const handleBuscar = async () => {
    try {
      setLoading(true);

      // Siempre obtenemos la información general.
      const response = await reporteService.obtenerReporteGeneral();

      const datos = response.data || [];

      // ==========================================
      // SIN CAMPOS SELECCIONADOS
      // ==========================================
      //
      // No hacemos reduce.
      // Mostramos exactamente lo que trajo la query.

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
      // CON CAMPOS SELECCIONADOS
      // ==========================================
      //
      // Aquí sí aplicamos el reduce.

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
  // LIMPIAR
  // ============================================

  const handleLimpiar = () => {
    // Solo limpia lo que está seleccionado.
    //
    // NO modifica la tabla.
    setOrden([]);
  };

  // ============================================
  // COLUMNAS
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

  // Si Buscar se ejecutó sin campos seleccionados:
  // mostramos todas las columnas.
  //
  // Si Buscar se ejecutó con campos:
  // mostramos solamente las dimensiones seleccionadas
  // + las tres columnas numéricas.

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
  // FORMATOS
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

    cantidad_reservas_confirmadas: ({ value }: { value: number }) => (
      <button className="block w-full text-center text-xs font-semibold text-blue-600 underline">
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
  // JSX
  // ============================================

  return (
    <div className="flex w-full flex-col gap-4 bg-white p-3 sm:p-4">
      <div className="w-full rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-4 p-4">
          {/* CONTROLES */}

          <div className="flex flex-wrap items-center gap-6">
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

            <Button variant="warning" size="md" onClick={handleLimpiar}>
              Limpiar
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleBuscar}
              loading={loading}
            >
              Buscar
            </Button>

            <TextInput
              label="Orden seleccionado"
              value={orden.map((campo) => labels[campo]).join(" / ")}
              disabled
              placeholder="Sin agrupación"
              className="w-full"
            />
          </div>

          {/* TABLA */}

          {reporte.length > 0 && (
            <Table5<ReporteRow>
              registros={reporte}
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
        </div>
      </div>
    </div>
  );
}
