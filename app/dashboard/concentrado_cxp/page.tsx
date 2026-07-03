/* 
que podemos agregar a la vista de concentrado cxp??

datos de otras vistas. 

---- pagos proveedor ----
serv
id_solicitud_rpoveedor 
creado
monto solicitado
saldo
fecha solicitada de paago
estado solicitud (cartera enviada/pagado link)
cliente
codigo confirmacion
proveedor
intermediario
razon social
viajero
check in
check out
noches
habitacion
costo proveedor
markup
precio de venta
estatus pago
metodo de pago
etapa reservacion
estado
comentarios sp
notas internas
comentarios ap
comentarios cxp
rfc
facturas acciones
forma pago solicitada
digitos tarjeta
banco
tipo tarjeata
pendiente a pagar
monto pagado proveedor
fecha pagado
estado factura proveedor
total facturado
monto por factura
fecha facturacion
uuid
uso CFDI factura
forma pago factura
metodo pago factura
moneda factura
id cliente
id tarjeta solicitada
usuario solicitante 
usuario generador
estado facturacion
carpeta
reservante
forma de pago solicitada
esyado pago
acciones -> (detalle, cambiar tarjeta, costo, cancelar, pagado) debemos considerar tarjeta detalle 


---- comprobante de pago ----
	ID SOL.	
    CÓD. DISPERS.	PROVEEDOR	
    CÓD. CONFIRM.	
    COSTO PROV.	
    MONTO SOL.	
    CLIENTE	
    PX VENTA	
    CHECK IN	
    CHECK OUT	
    MARKUP	
    DATOS BANCARIOS	CARÁTULA	
    ESTATUS
    -> considerar apartado revision pendiente -> ver informacion de la cuenta
---- saldos proveedor ---
    ID SALDO
    PROVEEDOR
    INTERMEDIARIO
    BOOKING
    CODIGO CONFIRMACION
    NEGOCIACION
    MONTO 
    RESTANTE
    FORMA PAGO
    FECHA PROCESAMIENTO
    ESTADO
    ID SOLICITUD
    FECHA SOLICITUD
    COMENTARIO CXP 
    TYPE(servicio) -> podemos mejorarlo
    ACCIONES
---- proveedores ----
    PROVEEDOR
    TYPE
    ESTATUS
    TIPO NEGOCIACION
    TIPO PAGO
    CONVENIO
    CIUDAD
    RFCS
    CREADO EN
    ACCIONES (considerar ver proveedor : informacion, ceuntas, archivos)
---- tarjetas ----
    TARJETA
    BANCO
    EMISOR
    FECHA
    VENCIMIENTO
    ACTIVA
    ACTIVA FINANZAS
    FINANZAS OPERACIONES
    ACCIONES
*/"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { Monto } from "@/components/atom/Monto";
import { fetchResumenCxp, fetchDetalleCxp } from "@/services/pago_proveedor";

type GrupoProveedorCxp = {
  id_proveedor: number | string | null;
  proveedor: string | null;
  rfc: string | null;
  razon_social: string | null;

  tipo_proveedor: string | null;
  tipo_pago: string | null;
  plazo_credito: number | string | null;
  tipo_negociacion: string | null;
  estatus_proveedor: number | string | null;

  total_solicitudes: number | string | null;
  pendientes: number | string | null;
  en_dispersion: number | string | null;
  pagadas: number | string | null;
  canceladas: number | string | null;

  monto_solicitado: number | string | null;
  monto_pagado: number | string | null;
  saldo_pendiente: number | string | null;

  total_facturado: number | string | null;
  pendiente_factura: number | string | null;
  saldo_a_favor: number | string | null;

  revision_cuenta: number | string | null;
  sin_factura_proveedor: number | string | null;

  ultima_solicitud: string | null;
  total_rfcs: number | string | null;
  fiscales_json: any;

  uuid_factura: string | null;
  total_uuids: number | string | null;
  uuid_facturas_json: any;
};

const toNumber = (value: any) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizarTexto = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  return text ? text.toUpperCase() : "—";
};
const formatearFecha = (value: any) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
const parseFiscales = (value: any) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};
const parseUuids = (value:any) => {
  if(!value) return [];
  if (Array.isArray(value)) return value;
  if(typeof value == "string"){
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
export default function ConcentradoCxpPage() {
  const [datosProveedores, setDatosProveedores] = useState<GrupoProveedorCxp[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fiscalesModal, setfiscalesModal] = useState<any[] | null>(null);
  const [proveedorFiscalModal, setProveedorfiscalModal] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [detalleModal, setDetalleModal] = useState<{
    open: boolean;
    loading: boolean;
    tipo: string;
    titulo: string;
    proveedor: string;
    data: any[];
  }>({
    open: false,
    loading: false,
    tipo: "",
    titulo: "",
    proveedor: "",
    data: [],
  });

  const [metadata, setMetadata] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });

  const [serverTotals, setServerTotals] = useState<any | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [filters, setFilters] = useState({
    proveedor: "",
    rfc: "",
    uuid_factura: "",
    tipo_negociacion: "",
    tipo_pago: "",
  });

 const cargarResumen = async (
  filtrosActuales = filters,
  paginaActual = 1,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchResumenCxp({
        ...filtrosActuales,
        pag: paginaActual,
        limite: limit,
      });

      setDatosProveedores(Array.isArray(response?.data) ? response.data : []);
      setServerTotals(response?.totals || null);
      setMetadata(
        response?.metadata || {
          page: paginaActual,
          limit,
          total: 0,
          total_pages: 0,
        },
      );

      setPage(paginaActual);
      setHasLoaded(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al cargar el concentrado CXP");
      setDatosProveedores([]);
      setServerTotals(null);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };
 const abrirDetalleCxp = async (raw: any, tipo: string) => {
  const idProveedor = raw?.id_proveedor;

  if (!idProveedor) return;

  const titulos: Record<string, string> = {
    facturas: "Facturas proveedor",
    total: "Total solicitudes",
    pendientes: "Solicitudes pendientes",
    en_dispersion: "Solicitudes en dispersión",
    pagadas: "Solicitudes pagadas",
    canceladas: "Solicitudes canceladas",
  };

  setDetalleModal({
    open: true,
    loading: true,
    tipo,
    titulo: titulos[tipo] || "Detalle CXP",
    proveedor: raw?.proveedor || "Proveedor",
    data: [],
  });

  try {
    const response = await fetchDetalleCxp({
      id_proveedor: idProveedor,
      tipo_detalle: tipo,

      proveedor: filters.proveedor,
      rfc: filters.rfc,
      uuid_factura: filters.uuid_factura,
      tipo_negociacion: filters.tipo_negociacion,
      tipo_pago: filters.tipo_pago,
    });

    setDetalleModal((prev) => ({
      ...prev,
      loading: false,
      data: Array.isArray(response?.data) ? response.data : [],
    }));
  } catch (error) {
    console.error(error);
    setDetalleModal((prev) => ({
      ...prev,
      loading: false,
      data: [],
    }));
  }
 };

  const registros = useMemo(() => {
    return datosProveedores.map((proveedor) => ({
      tipo_negociacion: proveedor.tipo_negociacion || "—",
      facturas_proveedor: proveedor.total_uuids
      ? `${proveedor.total_uuids} factura(s)`
      : "Sin factura",
      proveedor: proveedor.proveedor || "—",
      rfc: proveedor.rfc || "—",
      razon_social: proveedor.razon_social || "—",

      tipo_proveedor: proveedor.tipo_proveedor || "—",
      tipo_pago: proveedor.tipo_pago || "—",
      estatus_proveedor: proveedor.estatus_proveedor,
      plazo_credito: proveedor.plazo_credito || null,

      total_solicitudes: toNumber(proveedor.total_solicitudes),
      pendientes: toNumber(proveedor.pendientes),
      en_dispersion: toNumber(proveedor.en_dispersion),
      pagadas: toNumber(proveedor.pagadas),
      canceladas: toNumber(proveedor.canceladas),

      monto_solicitado: toNumber(proveedor.monto_solicitado),
      monto_pagado: toNumber(proveedor.monto_pagado),
      saldo_pendiente: toNumber(proveedor.saldo_pendiente),

      total_facturado: toNumber(proveedor.total_facturado),
      pendiente_factura: toNumber(proveedor.pendiente_factura),
      saldo_a_favor: toNumber(proveedor.saldo_a_favor),

      revision_cuenta: toNumber(proveedor.revision_cuenta),
      sin_factura_proveedor: toNumber(proveedor.sin_factura_proveedor),

      ultima_solicitud: proveedor.ultima_solicitud,
      item: proveedor,
    }));
  }, [datosProveedores]);

  const totales = useMemo(() => {
    if (serverTotals) {
      return {
        totalProveedores: toNumber(serverTotals.total_proveedores),

        totalSolicitudes: toNumber(serverTotals.total_solicitudes),
        totalPendientes: toNumber(serverTotals.pendientes),
        totalDispersion: toNumber(serverTotals.en_dispersion),
        totalPagadas: toNumber(serverTotals.pagadas),
        totalCanceladas: toNumber(serverTotals.canceladas),

        montoSolicitado: toNumber(serverTotals.monto_solicitado),
        montoPagado: toNumber(serverTotals.monto_pagado),
        saldoPendiente: toNumber(serverTotals.saldo_pendiente),

        totalFacturado: toNumber(serverTotals.total_facturado),
        pendienteFactura: toNumber(serverTotals.pendiente_factura),
        saldoAFavor: toNumber(serverTotals.saldo_a_favor),

        revisionCuenta: toNumber(serverTotals.revision_cuenta),
        sinFacturaProveedor: toNumber(serverTotals.sin_factura_proveedor),

        proveedoresCredito: toNumber(serverTotals.proveedores_credito),
        proveedoresContado: toNumber(serverTotals.proveedores_contado),
        solicitudesCredito: toNumber(serverTotals.solicitudes_credito),
        solicitudesContado: toNumber(serverTotals.solicitudes_contado),
        montoCredito: toNumber(serverTotals.monto_credito),
        montoContado: toNumber(serverTotals.monto_contado),
      };
    }

    const esCredito = (p: any) =>
      String(p.tipo_pago || "").toLowerCase() === "credito";

    const proveedoresCredito = registros.filter(esCredito);
    const proveedoresContado = registros.filter((p) => !esCredito(p));

    return {
      totalProveedores: registros.length,

      totalSolicitudes: registros.reduce(
        (sum, p) => sum + p.total_solicitudes,
        0,
      ),

      totalPendientes: registros.reduce((sum, p) => sum + p.pendientes, 0),

      totalDispersion: registros.reduce((sum, p) => sum + p.en_dispersion, 0),

      totalPagadas: registros.reduce((sum, p) => sum + p.pagadas, 0),

      totalCanceladas: registros.reduce((sum, p) => sum + p.canceladas, 0),

      montoSolicitado: registros.reduce(
        (sum, p) => sum + p.monto_solicitado,
        0,
      ),

      montoPagado: registros.reduce((sum, p) => sum + p.monto_pagado, 0),

      saldoPendiente: registros.reduce(
        (sum, p) => sum + p.saldo_pendiente,
        0,
      ),

      totalFacturado: registros.reduce((sum, p) => sum + p.total_facturado, 0),

      pendienteFactura: registros.reduce(
        (sum, p) => sum + p.pendiente_factura,
        0,
      ),

      saldoAFavor: registros.reduce((sum, p) => sum + p.saldo_a_favor, 0),

      revisionCuenta: registros.reduce((sum, p) => sum + p.revision_cuenta, 0),

      sinFacturaProveedor: registros.reduce(
        (sum, p) => sum + p.sin_factura_proveedor,
        0,
      ),

      proveedoresCredito: proveedoresCredito.length,
      proveedoresContado: proveedoresContado.length,

      solicitudesCredito: proveedoresCredito.reduce(
        (sum, p) => sum + p.total_solicitudes,
        0,
      ),

      solicitudesContado: proveedoresContado.reduce(
        (sum, p) => sum + p.total_solicitudes,
        0,
      ),

      montoCredito: proveedoresCredito.reduce(
        (sum, p) => sum + p.monto_solicitado,
        0,
      ),

      montoContado: proveedoresContado.reduce(
        (sum, p) => sum + p.monto_solicitado,
        0,
      ),
    };
  }, [registros, serverTotals]);

  const renderers = {
    id_proveedor: ({ value }: { value: number | string }) => (
      <div className="flex justify-center">
        <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">
          {value}
        </span>
      </div>
    ),

    proveedor: ({ value }: { value: string }) => (
      <div className="min-w-[240px]">
        <p className="font-semibold text-xs text-gray-800">
          {normalizarTexto(value)}
        </p>
      </div>
    ),

    rfc: ({ value, item }: { value: string; item: any }) => {
      const raw = item?.item ?? item;
      const fiscales = parseFiscales(raw?.fiscales_json);
      const totalRfcs = Number(raw?.total_rfcs || fiscales.length || 0);

      return (
        <div className="min-w-[150px] max-w-[180px]">
          <div className="font-mono text-[11px] text-gray-800">
            {normalizarTexto(value)}
          </div>

          {totalRfcs > 1 && (
            <button
              type="button"
              onClick={() => {
                setProveedorfiscalModal(raw?.proveedor || "");
                setfiscalesModal(fiscales);
              }}
              className="mt-1 text-[10px] text-blue-600 underline font-semibold hover:text-blue-800"
            >
              Ver {totalRfcs} RFCs
            </button>
          )}
        </div>
      );
    },

    razon_social: ({ value }: { value: string }) => (
      <div className="min-w-[240px] max-w-[300px]">
        <p
          className="text-xs text-gray-700 truncate"
          title={normalizarTexto(value)}
        >
          {normalizarTexto(value)}
        </p>
      </div>
    ),

    tipo_proveedor: ({ value }: { value: string }) => (
      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold">
        {normalizarTexto(value)}
      </span>
    ),

    tipo_pago: ({ value }: { value: string }) => {
      const tipo = String(value || "").toLowerCase();
      const esCredito = tipo === "credito";

      return (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            esCredito
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {esCredito ? "CRÉDITO" : "CONTADO"}
        </span>
      );
    },
    plazo_credito: ({ value, item }: { value: number | string | null; item: any }) => {
      const raw = item?.item ?? item;
      const tipoPago = String(raw?.tipo_pago || "").toLowerCase();

      if (tipoPago !== "credito") {
        return <span className="text-xs text-gray-400">—</span>;
      }

      return (
        <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 text-[11px] font-semibold">
          {value ? `${value} días` : "Sin plazo"}
        </span>
      );
    },

    tipo_negociacion: ({ value }: { value: string }) => (
      <span className="text-xs text-gray-700">{normalizarTexto(value)}</span>
    ),

    estatus_proveedor: ({ value }: { value: number | string | null }) => {
      const activo = Number(value) === 1;

      return (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            activo
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {activo ? "Activo" : "Inactivo"}
        </span>
      );
    },

    total_solicitudes: ({ value, item }: { value: number; item: any }) => {
      const raw = item?.item ?? item;

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "total")}
          className="font-semibold text-blue-600 underline hover:text-blue-800"
        >
          {value}
        </button>
      );
    },

    pendientes: ({ value, item }: { value: number; item: any }) => {
      const raw = item?.item ?? item;

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "pendientes")}
          className="font-semibold text-orange-600 underline hover:text-orange-800"
        >
          {value}
        </button>
      );
    },

    en_dispersion: ({ value, item }: { value: number; item: any }) => {
      const raw = item?.item ?? item;

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "en_dispersion")}
          className="font-semibold text-sky-600 underline hover:text-sky-800"
        >
          {value}
        </button>
      );
    },

    pagadas: ({ value, item }: { value: number; item: any }) => {
      const raw = item?.item ?? item;

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "pagadas")}
          className="font-semibold text-green-600 underline hover:text-green-800"
        >
          {value}
        </button>
      );
    },

    canceladas: ({ value, item }: { value: number; item: any }) => {
      const raw = item?.item ?? item;

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "canceladas")}
          className="font-semibold text-red-600 underline hover:text-red-800"
        >
          {value}
        </button>
      );
    },

    monto_solicitado: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-semibold text-gray-800 text-xs" />
      </div>
    ),

    monto_pagado: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-semibold text-emerald-700 text-xs" />
      </div>
    ),

    saldo_pendiente: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-bold text-red-600 text-xs" />
      </div>
    ),

    total_facturado: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-semibold text-purple-700 text-xs" />
      </div>
    ),

    pendiente_factura: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-semibold text-orange-600 text-xs" />
      </div>
    ),

    saldo_a_favor: ({ value }: { value: number }) => (
      <div className="flex justify-end">
        <Monto value={value} className="font-semibold text-indigo-600 text-xs" />
      </div>
    ),
    facturas_proveedor: ({ item }: { item: any }) => {
      const raw = item?.item ?? item;
      const totalUuids = Number(raw?.total_uuids || 0);

      if (!totalUuids) {
        return <span className="text-xs text-gray-400">Sin factura</span>;
      }

      return (
        <button
          type="button"
          onClick={() => abrirDetalleCxp(raw, "facturas")}
          className="text-[11px] text-blue-600 underline font-semibold hover:text-blue-800"
        >
          Ver detalle
        </button>
      );
    },

    revision_cuenta: ({ value }: { value: number }) => (
      <div className="flex justify-center">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            value > 0
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-gray-50 text-gray-400 border border-gray-100"
          }`}
        >
          {value > 0 ? `${value} en revisión` : "—"}
        </span>
      </div>
    ),

    sin_factura_proveedor: ({ value }: { value: number }) => (
      <div className="flex justify-center">
        <span
          className={`font-semibold text-xs ${
            value > 0 ? "text-orange-600" : "text-gray-400"
          }`}
        >
          {value || "—"}
        </span>
      </div>
    ),

    ultima_solicitud: ({ value }: { value: string | null }) => (
      <span className="text-xs text-gray-700">{formatDate(value)}</span>
    ),
  };

  const customColumns = [
  "tipo_negociacion",
  "facturas_proveedor",
  "proveedor",
  "rfc",
  "razon_social",
  "tipo_pago",
  "plazo_credito",
  "tipo_proveedor",
  "estatus_proveedor",
  "total_solicitudes",
  "pendientes",
  "en_dispersion",
  "pagadas",
  "canceladas",
  "monto_solicitado",
  "monto_pagado",
  "saldo_pendiente",
  "total_facturado",
  "pendiente_factura",
  "saldo_a_favor",
  "revision_cuenta",
  "sin_factura_proveedor",
  "ultima_solicitud",
];

  return (
    <div className="p-6 bg-slate-50 rounded-md">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Detalle de Cuentas por Pagar por Proveedor
        </h1>
      </header>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Proveedor
              </label>
              <input
                value={filters.proveedor}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    proveedor: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Buscar proveedor"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                RFC
              </label>
              <input
                value={filters.rfc}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    rfc: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Buscar RFC"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                UUID factura proveedor
              </label>
              <input
                value={filters.uuid_factura}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    uuid_factura: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Buscar UUID"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Tipo negociación
              </label>
              <input
                value={filters.tipo_negociacion}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    tipo_negociacion: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Ej. LOCAL, CHOICE..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Tipo pago
              </label>
              <select
                value={filters.tipo_pago}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    tipo_pago: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="credito">Crédito</option>
                <option value="contado">Contado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => cargarResumen(filters, 1)}
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Cargando..." : "Buscar"}
            </button>

            <button
              type="button"
              onClick={() => {
                const cleanFilters = {
                  proveedor: "",
                  rfc: "",
                  uuid_factura: "",
                  tipo_negociacion: "",
                  tipo_pago: "",
                };

                setFilters(cleanFilters);
                setDatosProveedores([]);
                setServerTotals(null);
                setMetadata({
                  page: 1,
                  limit: 50,
                  total: 0,
                  total_pages: 0,
                });
                setPage(1);
                setHasLoaded(false);
              }}
              className="px-4 py-2 rounded border text-sm font-semibold hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
          <SummaryCard
            title="Proveedores crédito"
            value={totales.proveedoresCredito}
            variant="blue"
          />

          <SummaryCard
            title="Proveedores contado"
            value={totales.proveedoresContado}
            variant="green"
          />

          <SummaryCard
            title="Solicitudes crédito"
            value={totales.solicitudesCredito}
            variant="sky"
          />

          <SummaryCard
            title="Solicitudes contado"
            value={totales.solicitudesContado}
            variant="orange"
          />

          <SummaryCard
            title="Monto crédito"
            value={<Monto value={totales.montoCredito} />}
            variant="purple"
          />

          <SummaryCard
            title="Monto contado"
            value={<Monto value={totales.montoContado} />}
            variant="yellow"
          />

          <SummaryCard
            title="Saldo pendiente"
            value={<Monto value={totales.saldoPendiente} />}
            variant="red"
          />
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Estado general de cuentas por pagar
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
            <StatusMetric
              label="Pendientes"
              count={totales.totalPendientes}
              amount={totales.saldoPendiente}
              className="text-orange-500"
            />

            <StatusMetric
              label="En dispersión"
              count={totales.totalDispersion}
              amount={totales.montoSolicitado - totales.montoPagado}
              className="text-sky-600"
            />

            <StatusMetric
              label="Pagadas"
              count={totales.totalPagadas}
              amount={totales.montoPagado}
              className="text-emerald-600"
            />

            <StatusMetric
              label="Sin factura proveedor"
              count={totales.sinFacturaProveedor}
              amount={totales.pendienteFactura}
              className="text-red-500"
            />

            <StatusMetric
              label="Revisión cuenta"
              count={totales.revisionCuenta}
              amount={0}
              className="text-amber-500"
            />

            <StatusMetric
              label="Canceladas"
              count={totales.totalCanceladas}
              amount={0}
              className="text-gray-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <AmountCard
            title="Monto solicitado"
            value={totales.montoSolicitado}
            className="text-blue-700"
          />

          <AmountCard
            title="Monto pagado"
            value={totales.montoPagado}
            className="text-emerald-700"
          />

          <AmountCard
            title="Total facturado proveedor"
            value={totales.totalFacturado}
            className="text-purple-700"
          />

          <AmountCard
            title="Pendiente por facturar"
            value={totales.pendienteFactura}
            className="text-orange-600"
          />
        </div>

        <Table5
          registros={registros}
          renderers={renderers}
          customColumns={customColumns}
          exportButton={true}
          leyenda={
            loading
              ? "Cargando proveedores..."
              : `Mostrando ${registros.length} proveedor(es)`
          }
          maxHeight="60vh"
        />

        <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
          <p className="text-sm text-gray-600">
            {hasLoaded
              ? `Mostrando página ${metadata.page} de ${metadata.total_pages || 1} (${metadata.total} proveedor(es))`
              : "Sin consulta cargada"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => cargarResumen(filters, page - 1)}
              className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="text-sm font-semibold">Pág. {page}</span>

            <button
              type="button"
              disabled={loading || page >= metadata.total_pages}
              onClick={() => cargarResumen(filters, page + 1)}
              className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div> 
    
        {detalleModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {detalleModal.titulo}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {detalleModal.proveedor}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetalleModal({
                      open: false,
                      loading: false,
                      tipo: "",
                      titulo: "",
                      proveedor: "",
                      data: [],
                    })
                  }
                  className="text-gray-500 hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-5 overflow-auto max-h-[70vh]">
                {detalleModal.loading ? (
                  <p className="text-sm text-gray-500">Cargando detalle...</p>
                ) : detalleModal.data.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No se encontró detalle para esta selección.
                  </p>
                ) : detalleModal.tipo === "facturas" ? (
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 border">UUID factura</th>
                        <th className="text-left p-2 border">Solicitud</th>
                        <th className="text-left p-2 border">Monto solicitado</th>
                        <th className="text-left p-2 border">Monto facturado</th>
                        <th className="text-left p-2 border">Saldo</th>
                        <th className="text-left p-2 border">Estado solicitud</th>
                        <th className="text-left p-2 border">Estado facturación</th>
                        <th className="text-left p-2 border">Forma pago</th>
                        <th className="text-left p-2 border">Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detalleModal.data.map((row, index) => (
                        <tr key={`${row.uuid_factura}-${row.id_solicitud}-${index}`}>
                          <td className="p-2 border font-mono text-[11px]">
                            {row.uuid_factura || "—"}
                          </td>
                          <td className="p-2 border">
                            {row.id_solicitud_proveedor || row.id_solicitud || "—"}
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.monto_solicitado)} />
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.monto_facturado)} />
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.saldo)} />
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.estado_solicitud)}
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.estado_facturacion)}
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.forma_pago_solicitada)}
                          </td>
                          <td className="p-2 border">
                            {formatearFecha(row.fecha_solicitud)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                        ) : (
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 border">Solicitud</th>
                        <th className="text-left p-2 border">Monto solicitado</th>
                        <th className="text-left p-2 border">Monto facturado</th>
                        <th className="text-left p-2 border">Por facturar</th>
                        <th className="text-left p-2 border">Saldo</th>
                        <th className="text-left p-2 border">Estado solicitud</th>
                        <th className="text-left p-2 border">Estado facturación</th>
                        <th className="text-left p-2 border">Forma pago</th>
                        <th className="text-left p-2 border">UUIDs</th>
                        <th className="text-left p-2 border">Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detalleModal.data.map((row, index) => (
                        <tr key={`${row.id_solicitud_proveedor}-${index}`}>
                          <td className="p-2 border">
                            {row.id_solicitud_proveedor || "—"}
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.monto_solicitado)} />
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.monto_facturado)} />
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.monto_por_facturar)} />
                          </td>
                          <td className="p-2 border">
                            <Monto value={toNumber(row.saldo)} />
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.estado_solicitud)}
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.estado_facturacion)}
                          </td>
                          <td className="p-2 border">
                            {normalizarTexto(row.forma_pago_solicitada)}
                          </td>
                          <td className="p-2 border">
                            {Number(row.total_uuids || 0) > 0
                              ? `${row.total_uuids} UUID(s)`
                              : "Sin factura"}
                          </td>
                          <td className="p-2 border">
                            {formatearFecha(row.fecha_solicitud)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
        
        {fiscalesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="px-5 py-4 border-b flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    RFCs registrados
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {normalizarTexto(proveedorFiscalModal)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setfiscalesModal(null);
                    setProveedorfiscalModal("");
                  }}
                  className="text-gray-500 hover:text-gray-800 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="p-5 overflow-auto">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-[180px]">
                          RFC
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">
                          Razón social
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {fiscalesModal.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-3 py-4 text-center text-gray-400"
                          >
                            No hay RFCs registrados.
                          </td>
                        </tr>
                      ) : (
                        fiscalesModal.map((fiscal, index) => (
                          <tr
                            key={`${fiscal?.rfc || index}-${index}`}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-3 py-2 font-mono text-gray-800 align-top">
                              {normalizarTexto(fiscal?.rfc)}
                            </td>
                            <td className="px-3 py-2 text-gray-700 align-top">
                              {normalizarTexto(fiscal?.razon_social)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 py-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setfiscalesModal(null);
                    setProveedorfiscalModal("");
                  }}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: React.ReactNode;
  variant:
    | "orange"
    | "blue"
    | "green"
    | "red"
    | "purple"
    | "yellow"
    | "sky";
}) {
  const styles = {
    orange: "bg-orange-50 border-orange-100 text-orange-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    green: "bg-green-50 border-green-100 text-green-700",
    red: "bg-red-50 border-red-100 text-red-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
    sky: "bg-sky-50 border-sky-100 text-sky-700",
  };

  return (
    <div className={`p-3 sm:p-4 rounded-lg border ${styles[variant]}`}>
      <h3 className="text-[11px] sm:text-sm font-semibold mb-1 leading-tight">
        {title}
      </h3>

      <div className="text-lg sm:text-2xl font-bold leading-tight whitespace-nowrap">
        {value}
      </div>
    </div>
  );
}

function StatusMetric({
  label,
  count,
  amount,
  className,
}: {
  label: string;
  count: number;
  amount: number;
  className: string;
}) {
  return (
    <div>
      <div className={`text-lg font-bold ${className}`}>{count}</div>
      <div className="text-gray-600">{label}</div>
      <div className={`text-sm font-bold ${className}`}>
        <Monto value={amount} />
      </div>
    </div>
  );
}

function AmountCard({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>

      <Monto value={value} className={`text-xl font-bold ${className}`} />
    </div>
  );
}