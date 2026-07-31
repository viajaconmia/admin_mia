"use client";

import BaseCard from "@/components/atom/BaseCard";
import { DropdownValues } from "@/components/atom/Input";
import { Table5 } from "@/components/Table5";
import Modal from "@/components/organism/Modal";
import { formatPeriodo, formatMoneyMXN } from "@/helpers/formater";
import { ApiService, ApiResponse } from "@/services/ApiService";
import { useEffect, useMemo, useState } from "react";
import { Plane, Car, Hotel, Copy } from "lucide-react";
import { Loader } from "@/components/atom/Loader";
import { GetListaSeparadaRenderer } from "@/v3/atom/TableItemsComponent";
import { copyToClipboard } from "@/helpers/utils";
import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";

class ReservasService extends ApiService {
  constructor() {
    super("");
  }

  async obtenerPeriodos() {
    return this.get<any>({
      path: "/getPeriodosReservas",
    });
  }

  async obtenerHeaderReservas(fechaInicio: string, fechaFin: string) {
    return this.get<RegistroPreview[]>({
      path: "/mia/reservas/headerReservas",
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
  }
  async obtenerHistoricoPeriodo(periodo: string) {
    return this.get<RegistroPreview[]>({
      path: "/mia/reservas/historicoPeriodo",
      params: { periodo },
    });
  }

  async obtenerDetallesReservas(
    idSnapshot: number,
    abrirDetalles: TipoDetalle,
  ) {
    return this.get<RegistroDetalle[]>({
      path: "/mia/reservas/detallesReservas",
      params: { id_snapshot_reserva: idSnapshot, abrirDetalles },
    });
  }

  async ejecutarSnapshot(meses: number) {
    return this.get<any>({
      path: "/mia/reservas/ejecutarSP",
      params: { meses },
    });
  }
}

type Option = {
  label: string;
  value: string;
  item: any;
};

type RegistroPreview = {
  id_snapshot_reserva: number;
  id_snapshot: number;
  snapshot_fecha: string;
  periodo: string;
  total_reservaciones: number;
  reservas_confirmadas: number;
  reservas_canceladas: number;
  monto_total_reservas: number;
  total_confirmado: number;
  total_cancelado: number;
  reservas_facturadas: number;
  reservas_por_facturar: number;
  reservas_canceladas_facturadas: number;
  total_facturado: number;
  monto_no_facturable: number;
  monto_por_facturar: number;
  total_facturado_cancelado: number;
  cantidad_facturas_activas: number;
  cantidad_facturas_canceladas: number;
  reservas_pagadas: number;
  reservas_sin_pagar: number;
  reservas_canceladas_pagadas: number;
  monto_pagado: number;
  monto_por_cobrar: number;
};

type RegistroDetalle = {
  id_snapshot_detalles: number;
  id_snapshot_reserva: number;
  id_snapshot: number;
  periodo: string;
  id_booking: string;
  estado_reserva: string;
  monto_reserva: number;
  estado_factura: string;
  monto_facturado: number;
  monto_no_facturable: number;
  monto_por_facturar: number;
  estado_pago: string;
  metodo_pago: string;
  monto_pagado: number;
  saldo_por_cobrar: number;
  nombre_agente: string;
  nombre_viajero: string;
  codigo_confirmacion: string;
  type: string;
  probando: string;
  tipo_cuarto_vuelo: string;
  check_in: string;
  check_out: string;
  facturas_asociadas: string; //Esta propiedad tiene separadas las facturas por un ", "
};

type TipoDetalle =
  | "reservasCanceladas"
  | "reservasPorFacturar"
  | "reservasCanceladasFacturadas"
  | "reservasNoFacturables"
  | "facturasCanceladas"
  | "reservasSinPagar"
  | "reservasCanceladasPagadas";

type tipoFactura = "hotel" | "flyght" | "car_rental";

// Helper para alineación a la derecha

export default function Page() {
  const [datosResumen, setDatosResumen] = useState<RegistroPreview[]>([]);
  const [fechaInicio, setFechaInicio] = useState<Option | null>(null);
  const [fechaFin, setFechaFin] = useState<Option | null>(null);
  const [opcionesPeriodo, setOpcionesPeriodo] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicoPeriodo, setHistoricoPeriodo] = useState<RegistroPreview[]>(
    [],
  );
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleReservas, setDetalleReservas] = useState<RegistroDetalle[]>([]);
  const [tituloDetalle, setTituloDetalle] = useState("");
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { success, showNotification } = useAlert();

  const [modalPeriodoOpen, setModalPeriodoOpen] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");

  const reservasService = new ReservasService();

  const tooltipDetalle =
    "pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 hidden -translate-y-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-md peer-hover:block peer-focus:block";

  const botonDetalleRojo =
    "peer text-xs font-semibold text-red-600 hover:underline focus:outline-none";

  const botonDetalleAzul =
    "peer text-xs font-semibold text-blue-600 hover:underline focus:outline-none";

  const botonPeriodo =
    "inline-flex h-7 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-200";

  const customColumns: (keyof RegistroPreview)[] = [
    "periodo",
    "total_reservaciones",
    "reservas_confirmadas",
    "reservas_canceladas",
    "monto_total_reservas",
    "total_confirmado",
    "total_cancelado",
    "reservas_facturadas",
    "reservas_por_facturar",
    "reservas_canceladas_facturadas",
    "total_facturado",
    "monto_no_facturable",
    "monto_por_facturar",
    "total_facturado_cancelado",
    "cantidad_facturas_activas",
    "cantidad_facturas_canceladas",
    "reservas_pagadas",
    "reservas_sin_pagar",
    "reservas_canceladas_pagadas",
    "monto_pagado",
    "monto_por_cobrar",
  ];

  const renderCopiar = ({ value }: { value: string }) => (
    <div className="flex justify-start gap-2">
      <Button
        onClick={() => {
          try {
            copyToClipboard(value);
            success(`${value} ha sido copiado correctamente`);
          } catch (err) {
            showNotification(
              "error",
              err.message || "Ocurrio un error al copiar",
            );
          }
        }}
        variant="ghost"
        icon={Copy}
        className="h-8 w-8 p-0 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      />
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    </div>
  );

  const detalleColumns: (keyof RegistroDetalle)[] = [
    "type",
    "periodo",
    "codigo_confirmacion",
    "nombre_viajero",
    "nombre_agente",
    "estado_reserva",
    "monto_reserva",
    "estado_factura",
    "monto_facturado",
    "monto_no_facturable",
    "monto_por_facturar",
    "estado_pago",
    "metodo_pago",
    "monto_pagado",
    "saldo_por_cobrar",
    // "nombre_agente",
    // "nombre_viajero",
    // "codigo_confirmacion",
    // "type",
    "tipo_cuarto_vuelo",
    "check_in",
    "check_out",
    "facturas_asociadas",
  ];

  const datosResumenTabla = useMemo(() => {
    return datosResumen.map((row) => {
      const limpio: any = {};

      customColumns.forEach((key) => {
        limpio[key] = row[key];
      });

      limpio.item = row;

      return limpio;
    });
  }, [datosResumen]);

  const detalleReservasTabla = useMemo(() => {
    return detalleReservas.map((row) => {
      const limpio: any = {};

      detalleColumns.forEach((key) => {
        limpio[key] = row[key];
      });

      limpio.item = row;

      return limpio;
    });
  }, [detalleReservas]);

  const resumenCards = useMemo(() => {
    return datosResumen.reduce(
      (acc, item) => {
        acc.totalReservaciones += Number(item.total_reservaciones || 0);
        acc.reservasCanceladas += Number(item.reservas_canceladas || 0);
        acc.facturasPendientes += Number(item.reservas_por_facturar || 0);
        acc.pagosPendientes += Number(item.reservas_sin_pagar || 0);
        return acc;
      },
      {
        totalReservaciones: 0,
        reservasCanceladas: 0,
        facturasPendientes: 0,
        pagosPendientes: 0,
      },
    );
  }, [datosResumen]);

  const cargarPeriodos = async () => {
    try {
      setError(null);

      const result = await reservasService.obtenerPeriodos();

      const opciones = (result.data || []).map((item: any) => ({
        label: formatPeriodo(item.periodo),
        value: item.periodo,
        item,
      }));

      const ordenadasAsc = [...opciones].sort((a, b) =>
        a.value.localeCompare(b.value),
      );

      const ultimos13 = ordenadasAsc.slice(-13);

      setOpcionesPeriodo(ordenadasAsc);
      setFechaInicio(ultimos13[0] || null);
      setFechaFin(ultimos13[ultimos13.length - 1] || null);
    } catch (error) {
      setError("No se pudieron cargar los periodos.");
      console.error(error);
    }
  };

  const cargarResumen = async () => {
    if (!fechaInicio || !fechaFin) return;

    if (fechaInicio.value > fechaFin.value) {
      setError("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await reservasService.obtenerHeaderReservas(
        fechaInicio.value,
        fechaFin.value,
      );

      setDatosResumen(result.data || []);
    } catch (error) {
      setError("No se pudo cargar el reporte.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = async (
    row: RegistroPreview,
    tipoDetalle: TipoDetalle,
    titulo: string,
  ) => {
    console.log("row que abre detalle:", row);
    console.log("id_snapshot_reserva:", row.id_snapshot_reserva);
    console.log("tipoDetalle:", tipoDetalle);
    try {
      setTituloDetalle(titulo);
      setDetalleReservas([]);
      setModalDetalleOpen(true);
      setLoadingDetalle(true);

      const result = await reservasService.obtenerDetallesReservas(
        row.id_snapshot_reserva,
        tipoDetalle,
      );

      setDetalleReservas(result.data || []);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      setDetalleReservas([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const ejecutarSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);

      await reservasService.ejecutarSnapshot(4);
      await cargarPeriodos();
      await cargarResumen();
    } catch (error) {
      setError("No se pudo ejecutar la captura.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPeriodos();
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [fechaInicio, fechaFin]);

  const renderers = {
    periodo: ({ value }: { value: string }) => (
      <button
        className={botonPeriodo}
        onClick={async () => {
          setPeriodoSeleccionado(formatPeriodo(value));
          setModalPeriodoOpen(true);
          setLoadingHistorico(true);
          console.log(value);
          try {
            const response = await reservasService.obtenerHistoricoPeriodo(
              String(value).slice(0, 10),
            );
            // const response =
            //await reservasService.obtenerHistoricoPeriodo(value);
            setHistoricoPeriodo(response.data || []);
          } catch (error) {
            console.error("Error al cargar historico:", error);
            setHistoricoPeriodo([]);
          } finally {
            setLoadingHistorico(false);
          }
        }}
      >
        {formatPeriodo(value)}
      </button>
    ),

    total_reservaciones: renderCantidad,
    reservas_confirmadas: renderCantidad,
    reservas_canceladas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(item, "reservasCanceladas", "Reservas Canceladas");
              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas canceladas</span>
        </span>
      </div>
    ),
    monto_total_reservas: renderPrecio,
    total_confirmado: renderPrecio,
    total_cancelado: renderPrecio,
    reservas_facturadas: renderCantidad,
    reservas_por_facturar: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(
                item,
                "reservasPorFacturar",
                "Reservas Por Facturar",
              );
              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas por facturar</span>
        </span>
      </div>
    ),
    reservas_canceladas_facturadas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(
                item,
                "reservasCanceladasFacturadas",
                "Reservas Canceladas Facturadas",
              );

              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>
            Ver reservas canceladas facturadas
          </span>
        </span>
      </div>
    ),
    total_facturado: renderPrecio,
    monto_no_facturable: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleAzul}
            onClick={() => {
              abrirDetalle(
                item,
                "reservasNoFacturables",
                "Reservas No Facturables",
              );
              setModalPeriodoOpen(false);
            }}
          >
            {formatMoneyMXN(value)}
          </button>
          <span className={tooltipDetalle}>Ver reservas no facturables</span>
        </span>
      </div>
    ),
    monto_por_facturar: renderPrecio,
    total_facturado_cancelado: renderPrecio,
    cantidad_facturas_activas: renderCantidad,
    cantidad_facturas_canceladas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(item, "facturasCanceladas", "Facturas Canceladas");
              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver facturas canceladas</span>
        </span>
      </div>
    ),
    reservas_pagadas: renderCantidad,
    reservas_sin_pagar: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(item, "reservasSinPagar", "Reservas Sin Pagar");
              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas sin pagar</span>
        </span>
      </div>
    ),
    reservas_canceladas_pagadas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() => {
              abrirDetalle(
                item,
                "reservasCanceladasPagadas",
                "Reservas Canceladas Pagadas",
              );
              setModalPeriodoOpen(false);
            }}
          >
            {value}
          </button>
          <span className={tooltipDetalle}>
            Ver reservas canceladas pagadas
          </span>
        </span>
      </div>
    ),
    monto_pagado: renderPrecio,
    monto_por_cobrar: renderPrecio,
  };
  const renderersmes = {
    periodo: ({ value }: { value: string }) => (
      <button
        className={botonPeriodo}
        onClick={async () => {
          setPeriodoSeleccionado(formatPeriodo(value));
          setModalPeriodoOpen(true);
          setLoadingHistorico(true);
          console.log(value);
          try {
            const response = await reservasService.obtenerHistoricoPeriodo(
              String(value).slice(0, 10),
            );
            // const response =
            //await reservasService.obtenerHistoricoPeriodo(value);
            setHistoricoPeriodo(response.data || []);
          } catch (error) {
            console.error("Error al cargar historico:", error);
            setHistoricoPeriodo([]);
          } finally {
            setLoadingHistorico(false);
          }
        }}
      >
        {formatPeriodo(value)}
      </button>
    ),

    total_reservaciones: ({ value }: { value: number }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    reservas_confirmadas: ({ value }: { value: number }) => (
      <span className={`text-xs font-semibold text-gray-800`}>{value}</span>
    ),
    reservas_canceladas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-center">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(item, "reservasCanceladas", "Reservas Canceladas")
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas canceladas</span>
        </span>
      </div>
    ),
    monto_total_reservas: renderPrecio,
    total_confirmado: renderPrecio,
    total_cancelado: renderPrecio,
    reservas_facturadas: ({ value }: { value: number }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    reservas_por_facturar: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(item, "reservasPorFacturar", "Reservas Por Facturar")
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas por facturar</span>
        </span>
      </div>
    ),
    reservas_canceladas_facturadas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(
                item,
                "reservasCanceladasFacturadas",
                "Reservas Canceladas Facturadas",
              )
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>
            Ver reservas canceladas facturadas
          </span>
        </span>
      </div>
    ),
    total_facturado: renderPrecio,
    monto_no_facturable: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleAzul}
            onClick={() =>
              abrirDetalle(
                item,
                "reservasNoFacturables",
                "Reservas No Facturables",
              )
            }
          >
            {formatMoneyMXN(value)}
          </button>
          <span className={tooltipDetalle}>Ver reservas no facturables</span>
        </span>
      </div>
    ),
    monto_por_facturar: renderPrecio,
    total_facturado_cancelado: renderPrecio,
    cantidad_facturas_activas: ({ value }: { value: number }) => (
      <span className={`text-xs font-semibold text-gray-800 text-center `}>
        {value}
      </span>
    ),
    cantidad_facturas_canceladas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(item, "facturasCanceladas", "Facturas Canceladas")
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver facturas canceladas</span>
        </span>
      </div>
    ),
    reservas_pagadas: ({ value }: { value: number }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    reservas_sin_pagar: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(item, "reservasSinPagar", "Reservas Sin Pagar")
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>Ver reservas sin pagar</span>
        </span>
      </div>
    ),
    reservas_canceladas_pagadas: ({
      value,
      item,
    }: {
      value: number;
      item: RegistroPreview;
    }) => (
      <div className="flex justify-end">
        <span className="relative inline-flex items-center">
          <button
            className={botonDetalleRojo}
            onClick={() =>
              abrirDetalle(
                item,
                "reservasCanceladasPagadas",
                "Reservas Canceladas Pagadas",
              )
            }
          >
            {value}
          </button>
          <span className={tooltipDetalle}>
            Ver reservas canceladas pagadas
          </span>
        </span>
      </div>
    ),
    monto_pagado: renderPrecio,
    monto_por_cobrar: renderPrecio,
  };

  const renderersDetalle = {
    type: ({ value }: { value: tipoFactura }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>
        {value === "hotel" ? (
          <Hotel className="h-4 w-4" />
        ) : value === "flyght" ? (
          <Plane className="h-4 w-4" />
        ) : (
          <Car className="h-4 w-4" />
        )}
      </span>
    ),
    periodo: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>
        {formatPeriodo(value)}
      </span>
    ),
    estado_reserva: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    monto_reserva: renderPrecio,
    estado_factura: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    monto_facturado: renderPrecio,
    monto_no_facturable: renderPrecio,
    monto_por_facturar: renderPrecio,
    estado_pago: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    metodo_pago: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),
    monto_pagado: renderPrecio,
    saldo_por_cobrar: renderPrecio,
    nombre_agente: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),

    nombre_viajero: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),

    codigo_confirmacion: renderCopiar,

    tipo_cuarto_vuelo: ({ value }: { value: string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>{value}</span>
    ),

    check_in: ({ value }: { value: Date | string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>
        {value ? new Date(value).toLocaleDateString("es-MX") : ""}
      </span>
    ),

    check_out: ({ value }: { value: Date | string }) => (
      <span className={`text-xs font-semibold text-gray-800 `}>
        {value ? new Date(value).toLocaleDateString("es-MX") : ""}
      </span>
    ),

    facturas_asociadas: GetListaSeparadaRenderer(", ", "Facturas asociadas"),
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col gap-4 overflow-y-auto bg-white p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Total reservaciones
            </h3>
          }
          color="blue"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.totalReservaciones}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Reservas canceladas
            </h3>
          }
          color="green"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.reservasCanceladas}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Facturas pendientes
            </h3>
          }
          color="sky"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.facturasPendientes}
          </div>
        </BaseCard>

        <BaseCard
          title={
            <h3 className="text-[11px] font-semibold leading-tight sm:text-sm">
              Pagos pendientes
            </h3>
          }
          color="orange"
          contentClassName="p-3 sm:p-4"
          bodyGapClassName="mt-1"
        >
          <div className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
            {resumenCards.pagosPendientes}
          </div>
        </BaseCard>
      </div>

      <div className="flex flex-col gap-4 p-2 sm:flex-row sm:flex-wrap sm:items-end sm:p-4">
        <div className="w-full max-w-sm">
          <DropdownValues
            label="Fecha inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
            options={opcionesPeriodo}
          />
        </div>

        <div className="w-full max-w-sm">
          <DropdownValues
            label="Fecha fin"
            value={fechaFin}
            onChange={setFechaFin}
            options={opcionesPeriodo}
          />
        </div>

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
          disabled={loading}
          onClick={ejecutarSnapshot}
        >
          {loading ? "Procesando..." : "Capturar ultimos 4 meses"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="w-full min-w-0 overflow-x-auto rounded-lg border bg-white p-2 sm:p-3">
        <Table5<RegistroPreview>
          registros={datosResumenTabla} // historicoPeriodo
          renderers={renderers}
          customColumns={customColumns}
          respectCustomColumnOrder={true}
          sortable={false}
          expandableColumns={[]}
          exportButton={true}
          isExport={false}
          horizontalScroll={true}
          maxHeight="65vh"
        />
      </div>

      {modalDetalleOpen && (
        <Modal
          title={tituloDetalle}
          subtitle={`Detalle de reservas · Total de reservas: ${detalleReservas.length}`}
          onClose={() => setModalDetalleOpen(false)}
        >
          {loadingDetalle ? (
            <Loader></Loader>
          ) : detalleReservas.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No hay detalle disponible.
            </div>
          ) : (
            <Table5<RegistroDetalle>
              registros={detalleReservasTabla}
              renderers={renderersDetalle}
              customColumns={detalleColumns}
              respectCustomColumnOrder={true}
              sortable={false}
              expandableColumns={[]}
              exportButton={true}
              isExport={false}
              horizontalScroll={true}
              maxHeight="70vh"
            />
          )}
        </Modal>
      )}

      {modalPeriodoOpen && (
        <Modal
          title="Periodo seleccionado"
          subtitle="Consulta histórica del periodo"
          onClose={() => setModalPeriodoOpen(false)}
        >
          {loadingHistorico ? (
            <Loader></Loader>
          ) : historicoPeriodo.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No hay histórico disponible para {periodoSeleccionado}.
            </div>
          ) : (
            <Table5<RegistroPreview>
              registros={historicoPeriodo} // historicoPeriodo
              renderers={renderers}
              customColumns={customColumns}
              respectCustomColumnOrder={true}
              sortable={false}
              expandableColumns={[]}
              exportButton={true}
              isExport={false}
              horizontalScroll={true}
              maxHeight="65vh"
            />
          )}
        </Modal>
      )}
    </div>
  );
}
const renderPrecio = ({ value }: { value: number }) => (
  <span
    className={`text-xs font-semibold text-gray-800 block w-full text-right`}
  >
    {formatMoneyMXN(value)}
  </span>
);

const renderCantidad = ({ value }: { value: number }) => (
  <span
    className={`text-xs font-semibold text-gray-800 block w-full text-center`}
  >
    {value}
  </span>
);
