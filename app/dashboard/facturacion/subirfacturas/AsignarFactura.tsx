'use client';
import React, { useEffect, useState } from 'react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table2 } from "@/components/organism/Table2";
import { ChartNoAxesColumnIcon } from 'lucide-react';
import { it } from 'node:test';
import { on } from 'node:events';

interface TableRow {
  id_item: string;
  total: number;
  codigo: string;
  descripcion: string;
  fecha_uso: string;
  checkout: string;
  seleccionado: boolean;
}

interface AsignarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  id_factura?: string;
  onAssign?: (payload: any) => void;
  onCloseVistaPrevia?: () => void;
  facturaData?: any;
  empresaSeleccionada?: any;
  clienteSeleccionado?: any;
  archivoPDFUrl?: string | null;
  archivoXMLUrl?: string | null;
  pagoData?: {
    monto: number;
    [key: string]: any;
  };
  saldo: number;
}

interface ReservaConItems {
  id_reserva: string;
  codigo_reserva: string;
  codigo_reservacion_hotel: string;
  items: Array<{
    id_item: string;
    descripcion: string;
    precio: number;
  }>;
  nombre_hotel: string;
  check_in: string;
  check_out: string;
  viajero: string;
  status_reserva: string;
  items_info: {
    items: Array<{
      id_item: string;
      total: number;
    }>;
  };
}

interface SelectedItem {
  id_item: string;
  saldo: number;
}

const AsignarFacturaModal: React.FC<AsignarFacturaProps> = ({
  isOpen,
  onClose,
  onAssign,
  onCloseVistaPrevia,
  facturaData,
  archivoPDFUrl,
  archivoXMLUrl,
  id_factura,
  empresaSeleccionada,
  clienteSeleccionado,
  pagoData,
  saldo
}) => {

  console.log("facturaData", facturaData)
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montorestante, setMontoRestante] = useState<number>(facturaData.saldo);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Determinar el monto máximo permitido basado en pagoData o facturaData
  const [maxMontoPermitido, setMaxMontoPermitido] = useState<number>(() => {
    if (pagoData?.monto) {
      return pagoData.monto;
    }

    const total = facturaData?.comprobante?.total;
    return typeof total === 'number' ? total : Number(total) || 0;
  });

  console.log(facturaData, "rfrgr", archivoPDFUrl, "reve")
  console.log()

  useEffect(() => {
    if (pagoData?.monto) {
      setMaxMontoPermitido(pagoData.monto);
    } else if (facturaData) {
      const total = facturaData?.comprobante?.total || facturaData.total;
      setMaxMontoPermitido(typeof total === 'number' ? total : Number(total) || 0);
    }
  }, [pagoData, facturaData]);

  useEffect(() => {
    if (isOpen && clienteSeleccionado) {
      fetchReservasConItems();
    }
  }, [isOpen, clienteSeleccionado]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let cliente = null;

      if (clienteSeleccionado.id_agente == undefined) {
        cliente = clienteSeleccionado
      }
      else {
        cliente = clienteSeleccionado.id_agente
      }

      console.log("cliente", cliente)

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItems?id_agente=${cliente}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las reservas');
      }

      const data = await response.json();
      setReservas(data.data || []);
      console.log("data", data)
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldo: number) => {
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.some(item => item.id_item === id_item);

      if (isCurrentlySelected) {
        // Deseleccionar item
        const newSelection = prev.filter(item => item.id_item !== id_item);
        const newTotal = newSelection.reduce((sum, item) => sum + item.saldo, 0);
        const restante = maxMontoPermitido - newTotal;
        if (restante > 0) {
          setMontoRestante(restante);
        }
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Seleccionar item - verificar que no exceda el límite
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        const newTotal = currentTotal + saldo;
        const restante = maxMontoPermitido - newTotal;
        if (restante < 0) {
          restante + saldo
        } else {
          setMontoRestante(restante);
        }

        if (newTotal > maxMontoPermitido) {
          alert(`No puedes exceder el monto total ${pagoData ? 'del pago' : 'de la factura'} ($${maxMontoPermitido.toFixed(2)})`);
          return prev;
        }

        const newSelection = [...prev, { id_item, saldo }];
        setMontoSeleccionado(newTotal);
        return newSelection;
      }
    });
  };

  const isItemSelected = (id_item: string): boolean => {
    return selectedItems.some(item => item.id_item === id_item);
  };

  // Format date to remove time
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
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

  // Show only last 4 digits of id_item
  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const handleAssignBase = async (incluirItems: boolean) => {
    try {
      const itemsAsignados = incluirItems
        ? reservas
          .flatMap(reserva => reserva.items_info?.items || [])
          .filter(item => selectedItems.some(selected => selected.id_item === item.id_item))
        : [];

      let asignacionPayload: any;
      let endpoint: string;
      let method: string;

      console.log("pago", pagoData, "id_factura", id_factura)
      // Determinar el flujo según los datos disponibles
      if (pagoData) {
        // Lógica específica para pagoData
        endpoint = `${URL}/mia/pagos/AsignarPagoItems`;
        method = "PATCH";
        asignacionPayload = {
          ...pagoData,
          items: JSON.stringify(itemsAsignados),
          monto_asignado: montoSeleccionado
        };
      } else if (id_factura) {
        // Lógica para asignar items a una factura existente
        console.log("asignar")
        endpoint = `${URL}/mia/factura/AsignarFacturaItems`;
        method = "PATCH";
        asignacionPayload = {
          id_factura: id_factura,
          items: JSON.stringify(itemsAsignados)
        };

      } else {
        // Lógica para creación de facturas desde carga - SOLO DEVUELVE ITEMS
        console.log("Enviando items al componente padre:", itemsAsignados);

        if (onAssign) {
          console.log("entre al onAssign")
          onAssign({
            itemsAsignados,
            monto_asignado: montoSeleccionado
          });
        } else {
          console.warn("onAssign no está definido - no se puede enviar los items");
        }
      }

      console.log("asignar", asignacionPayload, "df", endpoint)

      if (endpoint != null) {
        const response = await fetch(endpoint, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(asignacionPayload),
        });

        if (!response.ok) {
          throw new Error('Error al asignar los items');
        }
      }

      onClose();
      onCloseVistaPrevia?.();

    } catch (error) {
      console.error("Error al asignar items:", error);
    }
  }


  const handleAssign2 = async () => {
    return handleAssignBase(true);
  };

  const handleAssign = async () => {
    return handleAssignBase(false);
  };

  if (!isOpen) return null;

  const tableData = reservas.flatMap(reserva =>
    (reserva.items_info?.items || []).map(item => ({
      id_item: item.id_item,
      codigo: reserva.codigo_reservacion_hotel,
      descripcion: reserva.nombre_hotel,
      fecha_uso: reserva.check_in,
      precio: item.total,
      seleccionado: item,
      item: item
    }))
  );

  const renderers = {
    id_item: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value)}
      </span>
    ),
    seleccionado: ({ value }: { value: TableRow }) => (
      <input
        type="checkbox"
        checked={isItemSelected(value.id_item)}
        disabled={maxMontoPermitido < value.total}
        onChange={() => handleItemSelection(value.id_item, value.total)}
        className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
      />
    ),
    precio: ({ value }: { value: number }) => (
      <span className="font-medium font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${value.toFixed(2)}
      </span>
    ),
    fecha_uso: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">
        {formatDate(value)}
      </span>
    ),
    fecha_salida: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">
        {formatDate(value)}
      </span>
    ),
    descripcion: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">
        {value}
      </span>
    ),
    codigo: ({ value }: { value: string }) => (
      <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-sm border border-yellow-100">
        {value}
      </span>
    )
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">
          {pagoData ? 'Asignar Pago a Items de Reservación' : 'Asignar Factura a Items de Reservación'}
        </h2>

        <div className="mb-6">
          <p>Selecciona los items específicos a los que quieres asignar {pagoData ? 'este pago' : 'esta factura'}.</p>

          <div className="flex justify-between my-4">
            <div>
              <p className="text-sm text-gray-600">{pagoData ? 'Monto pago:' : 'Monto factura:'}</p>
              <p className="text-lg font-semibold">${maxMontoPermitido.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Restante:</p>
              <p className="text-lg text-green-600 font-semibold">${montorestante || facturaData.saldo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seleccionado:</p>
              <p className={`text-lg font-semibold ${montoSeleccionado > maxMontoPermitido ? 'text-red-600' : 'text-blue-600'}`}>
                ${montoSeleccionado.toFixed(2)}
              </p>
              {montoSeleccionado > maxMontoPermitido && (
                <p className="text-xs text-red-500">¡Excede el monto {pagoData ? 'del pago' : 'de la factura'}!</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Elementos Pendientes de {pagoData ? 'Pago' : 'Facturación'}</h3>

            {loading ? (
              <div className="text-center py-8">
                <p>Cargando reservas...</p>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">
                {error}
              </div>
            ) : reservas.length === 0 ? (
              <div className="text-gray-500 p-4 bg-gray-50 rounded">
                No hay reservas con items pendientes de {pagoData ? 'pago' : 'facturación'}
              </div>
            ) : (
              <Table2
                registros={tableData}
                renderers={renderers}
                maxHeight="400px"
                customColumns={['seleccionado', 'id_item', 'codigo', 'descripcion', 'fecha_uso', 'fecha_salida', 'precio']}
                leyenda=""
              />
            )}
          </div>
        </div>

        <div className='flex justify-end space-x-6'>
          <button
            onClick={() => {
              handleAssign();
              onCloseVistaPrevia?.();
            }}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              handleAssign2();
              onCloseVistaPrevia?.();
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={montoSeleccionado >= maxMontoPermitido}
          >
            Confirmar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;