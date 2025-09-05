'use client';

import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Copy, Check } from 'lucide-react';
import { URL, HEADERS_API } from "@/lib/constants/index";
import { formatNumberWithCommas } from "@/helpers/utils";

interface Pago {
  id_movimiento?: number;
  tipo_pago?: string;
  raw_id?: string;
  fecha_pago?: string;
  ig_agente?: string;
  nombre_agente?: string;
  metodo?: string;
  fecha_creacion?: string;
  monto?: number | string;
  saldo?: number | string;
  saldo_numero?: number;
  banco?: string;
  last_digits?: string;
  is_facturado?: number;
  tipo?: string;
  referencia?: string;
  concepto?: string;
  link_pago?: string;
  monto_por_facturar?: string;
  autorizacion?: string;
  origen_pago?: string;
  facturas_asociadas?: any;
  id_agente?: string;
  currency?: string;
  [key: string]: any;
}

interface ModalDetallePagoProps {
  pago: Pago | null;
  onClose: () => void;
}

const ModalDetallePago: React.FC<ModalDetallePagoProps> = ({ pago, onClose }) => {
  if (!pago) return null;

  const [copiedFacturaIdx, setCopiedFacturaIdx] = React.useState<number | null>(null);
  const [detallesAdicionales, setDetallesAdicionales] = React.useState<any>(null);
  const [loadingDetalles, setLoadingDetalles] = React.useState(false);

  const handleCopy = async (text: string, idx?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof idx === 'number') {
        setCopiedFacturaIdx(idx);
        setTimeout(() => setCopiedFacturaIdx(null), 1500);
      }
    } catch (e) {
      console.error('No se pudo copiar:', e);
    }
  };

  const formatCurrency = (value: number | string | undefined): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: pago?.currency || 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const formatIdItem = (id: string | undefined): string => {
    if (!id) return 'N/A';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const getMetodoPago = (): string => {
    const metodo = pago.metodo || pago.tipo_pago || '';
    switch (metodo.toLowerCase()) {
      case 'tarjeta':
      case 'tarjeta_de_credito':
      case 'tarjeta de crédito':
        return 'Tarjeta de crédito/débito';
      case 'spei':
        return 'Transferencia SPEI';
      case 'efectivo':
        return 'Efectivo';
      case 'wallet':
        return 'Wallet';
      default:
        return metodo || 'N/A';
    }
  };

  const getTipoTarjeta = (): string => {
    const tipo = pago.tipo;
    if (!tipo) return 'N/A';
    switch (tipo.toLowerCase()) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'American Express';
      case 'credito': return 'Crédito';
      case 'debito': return 'Débito';
      default: return tipo;
    }
  };

  const getFacturadoStatus = (): string => {
    return pago.is_facturado === 1 ? 'Facturado' : 'No facturado';
  };

  // Función para extraer solo los IDs de factura del string completo
  const extractFacturaIds = (facturasData: any): string[] => {
    if (!facturasData) return [];

    // Si ya es un array de strings con solo IDs, devolverlo directamente
    if (Array.isArray(facturasData) && facturasData.every(id => typeof id === 'string' && id.startsWith('fac-'))) {
      return facturasData;
    }

    // Si es un string con el formato completo, procesarlo
    if (typeof facturasData === 'string') {
      // Unir todo en un string y separar por ||
      const combined = facturasData.split('||').map(s => s.trim());
      return combined.map(item => {
        const match = item.match(/Id factura: (fac-[a-f0-9-]+)/i);
        return match ? match[1] : null;
      }).filter(Boolean) as string[];
    }

    // Si es un array de strings con el formato completo
    if (Array.isArray(facturasData)) {
      return facturasData.flatMap(item => {
        if (typeof item === 'string') {
          const match = item.match(/Id factura: (fac-[a-f0-9-]+)/i);
          return match ? [match[1]] : [];
        }
        return [];
      });
    }

    return [];
  };

  // Extraer solo los IDs de factura
  const facturaIds = React.useMemo(() => extractFacturaIds(pago.facturas_asociadas), [pago.facturas_asociadas]);

  // useEffect para fetchDetalles
  React.useEffect(() => {
    const fetchDetalles = async () => {
      if (!pago?.raw_id || !pago?.id_agente) {
        console.log("no podemos revisar reservas asociadas");
        return;
      }

      setLoadingDetalles(true);
      try {
        const url = `${URL}/mia/pagos/getDetallesConexion?id_agente=${pago.id_agente}&id_raw=${pago.raw_id}`;
        const response = await fetch(url, {
          method: "GET",
          headers: HEADERS_API,
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setDetallesAdicionales(data);
        console.log("Datos adicionales obtenidos:", data);
      } catch (error) {
        console.error("Error fetching detalles:", error);
      } finally {
        setLoadingDetalles(false);
      }
    };

    fetchDetalles();
  }, [pago]); // Se ejecuta cuando pago cambia

  // Función para formatear fecha (sin "de")
  const formatDateShort = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-gray-800">Detalles del Pago de</h2>
            <p className="text-gray-700 font-medium">{pago.nombre_agente || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Info básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID del agente</h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                    {formatIdItem(pago.id_agente)}
                  </p>
                  <button
                    onClick={() => handleCopy(pago.id_agente || '')}
                    className="text-blue-600 text-xs border border-blue-100 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">ID de Movimiento</h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                    {formatIdItem(pago.raw_id)}
                  </p>
                  <button
                    onClick={() => handleCopy(pago.raw_id || '')}
                    className="text-blue-600 text-xs border border-blue-100 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Concepto</h3>
                <p className="mt-1 text-sm text-gray-800 font-medium">{pago.concepto || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Referencia</h3>
                <p className="mt-1 text-sm text-gray-800">{pago.referencia || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de Pago</h3>
                <p className="mt-1 text-sm text-gray-800">{formatDate(pago.fecha_pago)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Método de Pago</h3>
                <p className="mt-1 text-sm capitalize text-gray-800">{getMetodoPago()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Estado de Facturación</h3>
                {(() => {
                  const isFacturado = pago.is_facturado === 1;
                  const saldoPorFacturar = Number(pago.monto_por_facturar) || 0;
                  const montoTotal = Number(pago.monto) || 0;

                  let className = '';
                  let texto = '';

                  if (isFacturado || saldoPorFacturar <= 0) {
                    className = 'bg-green-100 text-green-800 border-green-300';
                    texto = 'Facturado';
                  } else if (saldoPorFacturar === montoTotal) {
                    className = 'bg-gray-100 text-gray-800 border-gray-300';
                    texto = 'No facturado';
                  } else {
                    className = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                    texto = 'Parcial';
                  }

                  return (
                    <p className={`mt-1 text-xs px-2 py-1 rounded-full font-semibold inline-block border ${className}`}>
                      {texto}
                    </p>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                <p className="mt-1 text-sm text-gray-800">{formatDate(pago.fecha_creacion)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Origen del Pago</h3>
                <p className="mt-1 text-sm text-gray-800">{pago.origen_pago || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Montos */}
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Resumen de Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-700">Total de pago</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {formatNumberWithCommas(pago.monto)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-700">Monto por facturar</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {formatNumberWithCommas(pago.monto_por_facturar)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Moneda</h4>
                <p className="text-xl font-semibold text-gray-700">
                  {pago.currency || 'MXN'}
                </p>
              </div>
            </div>
          </div>

          {/* Info agente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Información del Agente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-purple-700">ID Agente</h4>
                <p className="mt-1 text-sm font-mono text-purple-900">
                  {formatIdItem(pago.id_agente || pago.ig_agente)}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-purple-700">Nombre del Agente</h4>
                <p className="mt-1 text-sm font-semibold text-purple-900">
                  {pago.nombre_agente || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Info tarjeta */}
          {(pago.metodo?.includes('tarjeta') || pago.tipo_pago?.includes('tarjeta')) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Información de Tarjeta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Tipo de Tarjeta</h4>
                  <p className="mt-1 text-sm font-semibold capitalize text-purple-900">
                    {getTipoTarjeta()}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Banco</h4>
                  <p className="mt-1 text-sm font-semibold text-purple-900">
                    {pago.banco || 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Últimos Dígitos</h4>
                  <p className="mt-1 text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-200 w-fit">
                    {pago.last_digits || 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Autorización</h4>
                  <p className="mt-1 text-sm font-mono text-purple-900">
                    {formatIdItem(pago.autorizacion)}
                  </p>
                  <button
                    onClick={() => handleCopy(pago.autorizacion || '')}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-[.99]"
                    title="Copiar autorización"
                    type="button"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info SPEI */}
          {pago.metodo === 'spei' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">Información de Transferencia SPEI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-indigo-700">Referencia SPEI</h4>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">
                    {pago.referencia || 'N/A'}
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-indigo-700">Banco</h4>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">
                    {pago.banco || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detalles reservas */}
          {/* Detalles adicionales - Reservas */}
          {loadingDetalles && (
            <div className="mb-6">
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando detalles de reservas...</span>
              </div>
            </div>
          )}

          {detallesAdicionales?.data?.reservas && detallesAdicionales.data.reservas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Reservas Asociadas</h3>
              <div className="space-y-4">
                {detallesAdicionales.data.reservas.map((reserva: any, index: number) => (
                  <div key={reserva.id_solicitud || index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700">ID Solicitud</h4>
                        <p className="mt-1 text-sm font-mono text-green-900 bg-white px-2 py-1 rounded border border-green-200">
                          {reserva.id_solicitud || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">ID Booking</h4>
                        <p className="mt-1 text-sm font-mono text-green-900 bg-white px-2 py-1 rounded border border-green-200">
                          {reserva.id_booking || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Total Booking</h4>
                        <p className="mt-1 text-lg font-bold text-green-900">
                          {formatCurrency(reserva.total_booking)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Viajero Principal</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {reserva.viajero || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Viajeros Adicionales</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {reserva.viajeros_adicionales_reserva || reserva.nombre_acompanantes_reserva || 'Ninguno'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Tipo de Cuarto</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {reserva.tipo_cuarto || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Check-in</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {formatDateShort(reserva.check_in)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-700">Check-out</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {formatDateShort(reserva.check_out)}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-green-700">Hotel</h4>
                        <p className="mt-1 text-sm text-green-900">
                          {reserva.nombre_hotel || 'N/A'}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-green-700">Código de Confirmación</h4>
                        <p className="mt-1 text-sm font-mono text-green-900 bg-white px-2 py-1 rounded border border-green-200">
                          {reserva.confirmation_code || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detallesAdicionales?.data?.reservas && detallesAdicionales.data.reservas.length === 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-600">Reservas Asociadas</h3>
              <p className="text-sm text-gray-500">No hay reservas asociadas a este pago</p>
            </div>
          )}

          {/* Facturas asociadas: mostrar solo IDs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Facturas Asociadas</h3>
            {facturaIds.length > 0 ? (
              <div className="space-y-2">
                {facturaIds.map((facturaId, idx) => {
                  const isCopied = copiedFacturaIdx === idx;
                  return (
                    <div key={`${facturaId}-${idx}`} className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                        {facturaId}
                      </span>
                      <button
                        onClick={() => handleCopy(facturaId, idx)}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-[.99]"
                        title="Copiar ID de factura"
                        type="button"
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">No hay facturas asociadas</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetallePago;