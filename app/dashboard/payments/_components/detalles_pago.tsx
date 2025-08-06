'use client';

import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X } from 'lucide-react';

interface Pago {
  id_pago: string;
  pago_referencia: string;
  pago_concepto: string;
  pago_fecha_pago: string;
  metodo_de_pago: string;
  tipo_tarjeta?: string;
  tipo_de_tarjeta?: string;
  banco?: string;
  banco_tarjeta?: string;
  total: number;
  subtotal: number | null;
  impuestos: number | null;
  pendiente_por_cobrar: number;
  last_digits?: string;
  ult_digits?: number;
  autorizacion_stripe?: string;
  numero_autorizacion?: string;
  is_facturable: number;
  [key: string]: any;
}

interface ModalDetallePagoProps {
  pago: Pago | null;
  onClose: () => void;
}

const ModalDetallePago: React.FC<ModalDetallePagoProps> = ({ pago, onClose }) => {
  if (!pago) return null;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const getMetodoPago = () => {
    switch (pago.metodo_de_pago || pago.metodo_pago) {
      case 'tarjeta':
        return 'Tarjeta de crédito/débito';
      case 'spei':
        return 'Transferencia SPEI';
      case 'efectivo':
        return 'Efectivo';
      default:
        return pago.metodo_de_pago || pago.metodo_pago || 'N/A';
    }
  };

  const getEstadoPago = () => {
    return pago.pendiente_por_cobrar === 0 ? 'Pagado' : 'Pendiente';
  };

  const getTipoTarjeta = () => {
    if (pago.tipo_tarjeta || pago.tipo_de_tarjeta) {
      const tipo = pago.tipo_tarjeta || pago.tipo_de_tarjeta;
      switch (tipo) {
        case 'visa': return 'Visa';
        case 'mastercard': return 'Mastercard';
        case 'amex': return 'American Express';
        default: return tipo;
      }
    }
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado del modal */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Detalles del Pago</h2>
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
                <h3 className="text-sm font-medium text-gray-500">ID de Pago</h3>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                    {formatIdItem(pago.id_pago)}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pago.id_pago)}
                    className="text-blue-600 text-xs border border-blue-100 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Concepto</h3>
                <p className="mt-1 text-sm text-gray-800 font-medium">{pago.pago_concepto || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Referencia</h3>
                <p className="mt-1 text-sm text-gray-800">{pago.pago_referencia || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de Pago</h3>
                <p className="mt-1 text-sm text-gray-800">{formatDate(pago.pago_fecha_pago)}</p>
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
                <h3 className="text-sm font-medium text-gray-500">Facturable</h3>
                <p className={`mt-1 text-xs px-2 py-1 rounded-full font-semibold inline-block 
        ${pago.is_facturable === 1
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                  {pago.is_facturable === 1 ? 'Sí' : 'No'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                <p className="mt-1 text-sm text-gray-800">{formatDate(pago.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Sección de montos */}
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Resumen de Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-700">Total</h4>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(pago.total)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Subtotal</h4>
                <p className="text-xl font-semibold text-gray-700">
                  {pago.subtotal ? formatCurrency(pago.subtotal) : 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Impuestos</h4>
                <p className="text-xl font-semibold text-gray-700">
                  {pago.impuestos ? formatCurrency(pago.impuestos) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de detalles específicos del método de pago */}
          {(pago.metodo_de_pago === 'tarjeta' || pago.metodo_pago === 'tarjeta') && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Información de Tarjeta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Tipo de Tarjeta</h4>
                  <p className="mt-1 text-sm font-semibold capitalize text-purple-900">{getTipoTarjeta()}</p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Banco</h4>
                  <p className="mt-1 text-sm font-semibold text-purple-900">{pago.banco || pago.banco_tarjeta || 'N/A'}</p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Últimos Dígitos</h4>
                  <p className="mt-1 text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-200 w-fit">
                    {pago.ult_digits || 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700">Autorización</h4>
                  <p className="mt-1 text-sm font-mono text-purple-900">
                    {pago.autorizacion_stripe || pago.numero_autorizacion || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {pago.metodo_de_pago === 'spei' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">Información de Transferencia SPEI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-indigo-700">Referencia SPEI</h4>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">{pago.spei || 'N/A'}</p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-indigo-700">Banco</h4>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">{pago.banco || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {pago.metodo_de_pago === 'spei' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Información de Transferencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Referencia SPEI</h4>
                  <p className="mt-1 text-sm">{pago.spei || 'N/A'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Banco</h4>
                  <p className="mt-1 text-sm">{pago.banco || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sección de información adicional */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Responsable</h4>
                <p className="mt-1 text-sm">{pago.responsable_pago_agente || 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">ID de Servicio</h4>
                <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded">{pago.id_servicio || 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Comentario</h4>
                <p className="mt-1 text-sm italic">{pago.comentario || 'Sin comentarios'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Estado</h4>
                <p className={`mt-1 text-sm px-2 py-1 rounded-full inline-block ${pago.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {pago.activo === 1 ? 'Activo' : 'Inactivo'}
                </p>
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