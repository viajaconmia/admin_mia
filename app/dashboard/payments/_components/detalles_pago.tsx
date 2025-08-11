'use client';

import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X } from 'lucide-react';

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

  const getEstadoPago = (): string => {
    const saldo = typeof pago.saldo === 'string' ? parseFloat(pago.saldo) : pago.saldo || 0;
    return saldo === 0 ? 'Pagado' : 'Pendiente';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado del modal */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Detalles del Pago de</h2>
          <p >
            {pago.nombre_agente || 'N/A'}
          </p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          {/* Sección de información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID del agente</h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                    {pago.id_agente || 'N/A'}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pago.id_agente || '')}
                    className="text-blue-600 text-xs border border-blue-100 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">ID de Pago</h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                    {formatIdItem(pago.raw_id)}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pago.raw_id || '')}
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
                <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                <p className={`mt-1 text-xs px-2 py-1 rounded-full font-semibold inline-block 
                  ${getEstadoPago() === 'Pagado'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
                  {getEstadoPago()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Facturado</h3>
                <p className={`mt-1 text-xs px-2 py-1 rounded-full font-semibold inline-block 
                  ${pago.is_facturado === 1
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                  {getFacturadoStatus()}
                </p>
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

          {/* Sección de montos */}
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Resumen de Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-700">Total</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(pago.monto)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Saldo</h4>
                <p className={`text-xl font-semibold ${(typeof pago.saldo === 'number' ? pago.saldo : parseFloat(pago.saldo || '0')) > 0
                  ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(pago.saldo)}
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

          {/* Sección de información del agente */}
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

          {/* Sección de detalles específicos del método de pago */}
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
                    {pago.autorizacion || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Sección de información adicional */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Link de Pago</h4>
                {pago.link_pago ? (
                  <a
                    href={pago.link_pago}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {pago.link_pago.length > 30
                      ? `${pago.link_pago.substring(0, 30)}...`
                      : pago.link_pago}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">N/A</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Facturas Asociadas</h4>
                {pago.facturas_asociadas ? (
                  <a
                    href={pago.facturas_asociadas}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline text-sm"
                  >
                    Ver factura
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">N/A</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
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