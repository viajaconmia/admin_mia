import React, { useState, useEffect } from 'react';

interface ItemReservacion {
  id: string;
  servicio: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  seleccionado: boolean;
}

interface ModalAsignarFacturaProps {
  montoFactura: number;
  itemsReservacion: ItemReservacion[];
  onCancel: () => void;
  onAsignar: (itemsSeleccionados: ItemReservacion[]) => void;
  isOpen: boolean;
}

const ModalAsignarFactura: React.FC<ModalAsignarFacturaProps> = ({
  montoFactura,
  itemsReservacion,
  onCancel,
  onAsignar,
  isOpen,
}) => {
  const [items, setItems] = useState<ItemReservacion[]>([]);
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [itemsSeleccionados, setItemsSeleccionados] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      // Resetear estados cuando el modal se abre
      const itemsIniciales = itemsReservacion.map(item => ({
        ...item,
        seleccionado: false,
      }));
      setItems(itemsIniciales);
      setMontoSeleccionado(0);
      setItemsSeleccionados(0);
    }
  }, [isOpen, itemsReservacion]);

  const toggleSeleccionItem = (id: string) => {
    setItems(prevItems => {
      const nuevosItems = prevItems.map(item => {
        if (item.id === id) {
          // Verificar si al seleccionar este item no superamos el monto factura
          const nuevoMonto = item.seleccionado
            ? montoSeleccionado - item.total
            : montoSeleccionado + item.total;

          if (nuevoMonto > montoFactura) {
            return item; // No permitir selección que exceda el monto
          }

          return { ...item, seleccionado: !item.seleccionado };
        }
        return item;
      });

      // Calcular nuevo monto seleccionado y cantidad de items
      const nuevoMonto = nuevosItems
        .filter(item => item.seleccionado)
        .reduce((sum, item) => sum + item.total, 0);

      const nuevosSeleccionados = nuevosItems.filter(item => item.seleccionado).length;

      setMontoSeleccionado(nuevoMonto);
      setItemsSeleccionados(nuevosSeleccionados);

      return nuevosItems;
    });
  };

  const handleAsignar = () => {
    const seleccionados = items.filter(item => item.seleccionado);
    onAsignar(seleccionados);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Asignar Factura a Items de Reservación
          </h1>

          <p className="mb-6">
            Factura guardada exitosamente. Selecciona los items específicos a los que quieres asignar esta factura.
          </p>

          <div className="flex justify-between mb-6">
            <div>
              <span className="font-semibold">Monto factura: </span>
              <span className="text-blue-600 font-bold">${montoFactura.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Seleccionado: </span>
              <span className={`font-bold ${montoSeleccionado > montoFactura ? 'text-red-600' : 'text-green-600'}`}>
                ${montoSeleccionado.toFixed(2)}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Elementos Pendientes de Facturación</h2>
          <p className="text-sm text-gray-600 mb-4">Selecciona elementos individuales o reservas completas</p>

          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio | Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seleccionar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.servicio}</div>
                      <div className="text-sm text-gray-500">{item.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${item.precioUnitario.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={item.seleccionado}
                        onChange={() => toggleSeleccionItem(item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <div className="text-sm text-gray-600">
              {itemsSeleccionados} Items seleccionados • Total: ${montoSeleccionado.toFixed(2)}
            </div>
            <div className="space-x-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignar}
                disabled={montoSeleccionado <= 0 || montoSeleccionado > montoFactura}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${montoSeleccionado <= 0 || montoSeleccionado > montoFactura
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Asignar Factura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarFactura;