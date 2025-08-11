'use client';
import React, { useEffect, useState, useRef } from 'react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table4 } from "@/components/organism/Table4";
// Versión de Feather Icons (similares a Lucide)
import { Eye, FileText, FilePlus, X } from 'lucide-react';
import { format } from "date-fns";
import { fetchPagosPrepago } from "@/services/pagos";
import { Banknote, FileCheck } from "lucide-react";
import { es, se } from "date-fns/locale";
import ModalDetallePago from './_components/detalles_pago';
import ModalFacturasAsociadas from './_components/ModalFacturasAsociadas';
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";
import { BillingPage } from "@/app/dashboard/facturacion/generar_factura/generar_factura";
import { formatNumberWithCommas } from "@/helpers/utils";

interface Pago {
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
  banco?: string;
  last_digits?: string;
  is_facturado: number;
  tipo?: string;
  referencia?: string;
  concepto?: string;
  link_pago?: string;
  monto_por_facturar: string;
  autorizacion: string;
  origen_pago: string;
  facturas_asociadas: any;
  [key: string]: any;
}

type Seleccion = { id_agente: string; raw_id: string; saldo: number };

const TablaPagosVisualizacion = () => {
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [showSubirFactura, setShowSubirFactura] = useState(false);
  const [pagoAFacturar, setPagoAFacturar] = useState<Pago | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFacturasModal, setShowFacturasModal] = useState(false);
  const [facturasAsociadas, setFacturasAsociadas] = useState<string[]>([]);

  const [seleccionados, setSeleccionados] = useState<Seleccion[]>([]);
  const idAgenteSeleccionado = seleccionados[0]?.id_agente ?? null;
  const totalSaldoSeleccionado = seleccionados.reduce((a, s) => a + (Number(s.saldo) || 0), 0);

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
        saldo: formatNumberWithCommas(pago.saldo ?? pago.saldo_monto ?? 0),
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
        ...pago
      }));

      setPagos(pagosMapeados);
      console.log("data cruda", data);
      console.log("pagos normalizados", pagosMapeados);
      setError(null);
    } catch (err) {
      console.error("Error al obtener los pagos:", err);
      setError("No se pudieron cargar los pagos. Intente nuevamente más tarde.");
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

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
      return dateString;
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
    const saldo = Number(row.saldo) || 0;
    const raw = row.raw_id;

    if (!raw) return;

    if (seleccionados.length > 0 && rowAgent !== idAgenteSeleccionado) {
      alert('Solo puedes seleccionar pagos del mismo agente.');
      return;
    }

    setSeleccionados(prev => {
      const exists = prev.some(s => s.raw_id === raw);
      if (exists) return prev.filter(s => s.raw_id !== raw);
      return [...prev, { id_agente: rowAgent, raw_id: raw, saldo }];
    });
  };

  const tableData = pagos.map((pago) => ({
    // Fields from your object
    id_movimiento: pago.id_movimiento,
    tipo_pago: pago.tipo_pago ?? "",
    raw_id: pago.raw_id,
    id_agente: pago.id_agente,
    nombre_agente: pago.nombre_agente ?? "",
    fecha_creacion: pago.fecha_creacion,
    fecha_pago: pago.fecha_pago,
    monto: Number(pago.monto) || "0",
    saldo: Number(pago.saldo) || "0",
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
    is_facturado: pago.is_facturado ?? 0,

    // Extras for the table
    acciones: { row: pago },
    item: pago,
  }));

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
    saldo: ({ value }: { value: number }) => (
      <span className={`font-medium ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
          {format(date, "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    fecha_pago: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
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
    is_facturado: ({ value }: { value: number }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {value === 1 ? 'Facturado' : 'No facturado'}
      </span>
    ),

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

    // Actions (kept the same as it's UI functionality)
    acciones: ({ value }: { value: { row: any }; item: any }) => {
      const [showFacturaOptions, setShowFacturaOptions] = useState(false);
      const [showBillingPage, setShowBillingPage] = useState(false);
      const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
      const buttonRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (buttonRef.current && showFacturaOptions) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - buttonRect.bottom;
          setMenuPosition(spaceBelow < 200 ? 'top' : 'bottom');
        }
      }, [showFacturaOptions]);

      const row = value.row;
      const selected = isRowSelected(row);
      const disabled = !canSelectRow(row);

      return (
        <div className="flex gap-2 relative" ref={buttonRef}>

          {/*Boton de seleccion*/}
          <div className="flex items-center mr-1">
            <input
              type="checkbox"
              className="accent-purple-600 w-4 h-4"
              checked={selected}
              disabled={disabled && !selected}
              onChange={() => toggleSeleccion(row)}
              title={disabled && !selected ? 'Debe coincidir el mismo agente' : 'Seleccionar pago'}
            />
          </div>
          {/* Detalles button */}
          <button
            className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1"
            onClick={() => { setPagoSeleccionado(value.row), console.log("facturas", value.row) }}
          >
            <Eye className="w-4 h-4" />
            <span>Detalles</span>
          </button>

          {/* Facturas button */}
          <button
            className="px-3 py-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1"
            onClick={() => handleVerFacturas(value.row.facturas_asociadas)}
          >
            <FileText className="w-4 h-4" />
            <span>Facturas</span>
          </button>

          {/* Facturar button with dropdown */}
          <div className="relative">
            <button
              className="px-3 py-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200 flex items-center gap-1"
              onClick={() => setShowFacturaOptions(!showFacturaOptions)}
            >
              <FilePlus className="w-4 h-4" />
              <span>Facturar</span>
            </button>


            {showFacturaOptions && (
              <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}>
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900"
                    onClick={() => {
                      console.log("Generar factura para:", value.row);
                      setShowBillingPage(true);
                      setShowFacturaOptions(false);
                    }}
                  >
                    Generar factura
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900"
                    onClick={() => {
                      console.log("Generar factura para:", value.row);
                      setPagoAFacturar(value.row);
                      setShowSubirFactura(true);
                      setShowFacturaOptions(false);
                    }}
                  >
                    Asignar factura
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Close menu when clicking outside */}
          {showFacturaOptions && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setShowFacturaOptions(false)}
            />
          )}

          {/* Modal for BillingPage */}
          {showBillingPage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Generar factura para pago {value.row.id_agente ? formatIdItem(value.row.id_agente) : ''}
                  </h2>
                  <button
                    onClick={() => setShowBillingPage(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <BillingPage
                    onBack={() => setShowBillingPage(false)}
                    userId={value.row.id_agente}
                    saldoMonto={value.row.saldo}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
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

  // Calcula montos solo si hay pagos
  const montoPagado = pagos.reduce((acc, pago) => acc + (pago.total || 0), 0);
  const montoFacturado = pagos.reduce((acc, pago) => acc + (pago.is_facturable ? (pago.total || 0) : 0), 0);
  console.log("Monto pagado:", montoPagado);
  console.log("Monto facturada:", montoFacturado);
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
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(montoPagado)}</p>
          </div>
        </div>

        {/* Monto Facturado */}
        <div className="flex items-center gap-4 bg-white border border-green-200 rounded-xl p-4 shadow-sm ring-1 ring-green-100 hover:shadow-md transition">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700">Monto Facturado</h3>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(montoFacturado)}</p>
            <p className="text-sm mt-1">
              <span className="text-gray-600">Restante: </span>
              <span className={`font-semibold ${montoPagado - montoFacturado >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(montoPagado - montoFacturado)}
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
            <div className="relative" ref={batchBtnRef}>
              <button
                className="text-xs px-3 py-1 rounded-md border border-purple-300 hover:bg-purple-100 flex items-center gap-1"
                onClick={() => setShowBatchMenu(v => !v)}
              >
                <FilePlus className="w-3 h-3" />
                <span>Facturar</span>
              </button>

              {showBatchMenu && (
                <div
                  className={`absolute right-0 w-52 bg-white rounded-md shadow-lg z-10 border border-gray-200
              ${batchMenuPos === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                >
                  <div className="py-1">
                    {/* Generar factura (batch) */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900"
                      onClick={() => {
                        if (!idAgenteSeleccionado) return;
                        const rawIds = seleccionados.map(s => s.raw_id);
                        const saldos = seleccionados.map(s => Number(s.saldo) || 0); // Obtener los saldos
                        console.log(saldos)
                        setBatchBilling({
                          userId: idAgenteSeleccionado,
                          saldoMonto: totalSaldoSeleccionado,
                          rawIds,
                          saldos
                        });
                        setShowBatchMenu(false);
                        setShowBillingPage(true);
                      }}
                    >
                      Generar factura
                    </button>

                    {/* Asignar factura (solo imprime) */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900"
                      onClick={() => {
                        if (!idAgenteSeleccionado) return;
                        const rawIds = seleccionados.map(s => s.raw_id);
                        const saldos = seleccionados.map(s => Number(s.saldo) || 0); // Obtener los saldos
                        console.log(saldos)
                        setBatchPagoAFacturar({
                          id_agente: idAgenteSeleccionado,
                          rawIds,
                          monto: totalSaldoSeleccionado,
                          saldos
                          // Agrega cualquier otro dato necesario que uses en el modal
                        });
                        setShowBatchMenu(false);
                        setShowBatchSubirFactura(true);
                      }}
                    >
                      Asignar factura
                    </button>
                  </div>
                </div>
              )}
            </div>

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

      {/* Tabla de registros */}
      <Table4
        registros={tableData}
        renderers={renderers}
      />
      {/* Modal de detalles */}
      <ModalDetallePago
        pago={pagoSeleccionado}
        onClose={() => setPagoSeleccionado(null)}
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
          onClose={() => setShowFacturasModal(false)}
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
                rawIds={batchBilling.rawIds} // Pasa los IDs seleccionados
                saldos={seleccionados.map(s => Number(s.saldo) || 0)} // Pasar los saldos como números
                isBatch={true} // Indica que es un proceso por lotes
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
                onClick={() => setShowBatchSubirFactura(false)}
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