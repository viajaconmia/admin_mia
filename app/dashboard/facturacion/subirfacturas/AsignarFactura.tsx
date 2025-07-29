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
  clienteSeleccionado
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montorestante, setMontoRestante] = useState<number>(0);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  let [maxMontoPermitido] = useState(() => {
    const total = facturaData?.comprobante?.total;
    return typeof total === 'number' ? total : Number(total) || 0;
  });

  if (maxMontoPermitido == 0) {
    const total = parseFloat(facturaData.total);
    if (!isNaN(total)) {
      console.log("Total válido:", total);
    } else {
      console.error("Valor inválido para total");
    }
    maxMontoPermitido = total
  }

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
        setMontoRestante(restante);

        if (newTotal > maxMontoPermitido) {
          alert(`No puedes exceder el monto total de la factura ($${maxMontoPermitido.toFixed(2)})`);
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

      if (id_factura) {
        asignacionPayload = {
          id_factura: id_factura,
          items: JSON.stringify(itemsAsignados)
        };
      } else {
        asignacionPayload = {
          fecha_emision: facturaData.comprobante.fecha.split("T")[0],
          estado: "En proceso",
          usuario_creador: clienteSeleccionado.id_agente,
          id_agente: clienteSeleccionado.id_agente,
          total: parseFloat(facturaData.comprobante.total),
          subtotal: parseFloat(facturaData.comprobante.subtotal),
          impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
          saldo: parseFloat(facturaData.comprobante.total),
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: archivoPDFUrl || null,
          url_xml: archivoXMLUrl || null,
          items: JSON.stringify(itemsAsignados),
        };
      }

      const endpoint = id_factura
        ? `${URL}/mia/factura/AsignarFacturaItems`
        : `${URL}/mia/factura/CrearFacturaDesdeCarga`;

      const response = await fetch(endpoint, {
        method: id_factura ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(asignacionPayload),
      });

      if (!response.ok) {
        throw new Error('Error al asignar la factura');
      }

      const data = await response.json();
      onAssign?.(asignacionPayload);
      onClose();
      onCloseVistaPrevia?.();
      return data;
    } catch (error) {
      console.error("Error al asignar factura:", error);
      alert('Ocurrió un error al asignar la factura');
      throw error;
    }
  };

  const handleAssign2 = async () => handleAssignBase(true);
  const handleAssign = async () => handleAssignBase(false);

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
        <h2 className="text-xl font-bold mb-4">Asignar Factura a Items de Reservación</h2>

        <div className="mb-6">
          <p>Selecciona los items específicos a los que quieres asignar esta factura.</p>

          <div className="flex justify-between my-4">
            <div>
              <p className="text-sm text-gray-600">Monto factura:</p>
              <p className="text-lg font-semibold">${maxMontoPermitido.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Restante:</p>
              <p className="text-lg text-green-600 font-semibold">${montorestante.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seleccionado:</p>
              <p className={`text-lg font-semibold ${montoSeleccionado > maxMontoPermitido ? 'text-red-600' : 'text-blue-600'}`}>
                ${montoSeleccionado.toFixed(2)}
              </p>
              {montoSeleccionado > maxMontoPermitido && (
                <p className="text-xs text-red-500">¡Excede el monto de la factura!</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Elementos Pendientes de Facturación</h3>

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
                No hay reservas con items pendientes de facturación
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
            disabled={montoSeleccionado !== maxMontoPermitido}
          >
            Confirmar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;