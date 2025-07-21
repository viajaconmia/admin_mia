'use client';
import React from 'react';

interface AsignarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (payload: any) => void;
  facturaData: any;
  empresaSeleccionada: any;
  clienteSeleccionado: any;
}

const AsignarFacturaModal: React.FC<AsignarFacturaProps> = ({
  isOpen,
  onClose,
  onAssign,
  facturaData,
  empresaSeleccionada,
  clienteSeleccionado
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = React.useState<number>(0);

  if (!isOpen) return null;

  const handleAssign = () => {
    const payload = {
      agente: clienteSeleccionado,
      empresa: empresaSeleccionada,
      factura: {
        ...facturaData,
        montoAsignado: montoSeleccionado
      },
      fechaAsignacion: new Date().toISOString()
    };

    onAssign(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Asignar Factura a Items de Reservación</h2>

        <div className="mb-6">
          <p>Factura guardada exitosamente. Selecciona los items específicos a los que quieres asignar esta factura.</p>

          <div className="flex justify-between my-4">
            <div>
              <p className="text-sm text-gray-600">Monto factura:</p>
              <p className="text-lg font-semibold">${facturaData?.comprobante?.total || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seleccionado:</p>
              <p className="text-lg font-semibold text-blue-600">${montoSeleccionado.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Elementos Pendientes de Facturación</h3>
            <p className="text-sm text-gray-600 mb-3">Selecciona elementos individuales o reservas completas</p>

            {/* Espacio reservado para la tabla */}
            <div className="border border-dashed border-gray-300 p-8 text-center rounded-lg">
              <p className="text-gray-500">Aquí va la tabla de items de reservación</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded mb-6">
            <p className="text-sm">
              <span className="font-medium">3 Items seleccionados</span> • Total: ${montoSeleccionado.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={montoSeleccionado <= 0}
          >
            Confirmar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;