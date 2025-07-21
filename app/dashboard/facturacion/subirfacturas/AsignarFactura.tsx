'use client';
import React, { useEffect, useState } from 'react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table } from "@/components/Table"; // Import your Table component
import { ChartNoAxesColumnIcon } from 'lucide-react';
import { it } from 'node:test';

interface TableRow {
  id_item: string;
  total: number;
  codigo: string;
  descripcion: string;
  seleccionado: boolean;
}

interface AsignarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (payload: any) => void;
  facturaData: any;
  empresaSeleccionada: any;
  clienteSeleccionado: any;
  archivoPDFUrl?: string | null; // <-- Agrega esta línea
  archivoXMLUrl?: string | null; // <-- Agrega esta línea
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
  facturaData,
  archivoPDFUrl, // <-- Recibe aquí
  archivoXMLUrl,

  empresaSeleccionada,
  clienteSeleccionado
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [tableRow, setTableRow] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [maxMontoPermitido] = useState(() => {
    const total = facturaData?.comprobante?.total;
    return typeof total === 'number' ? total : Number(total) || 0;
  });

  useEffect(() => {
    if (isOpen && clienteSeleccionado) {
      fetchReservasConItems();
    }
  }, [isOpen, clienteSeleccionado]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItems?id_agente=${clienteSeleccionado.id_agente}`,
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
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Seleccionar item - verificar que no exceda el límite
        console.log(prev, "prev");
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        const newTotal = currentTotal + saldo;

        if (newTotal > maxMontoPermitido) {
          alert(`No puedes exceder el monto total de la factura ($${maxMontoPermitido.toFixed(2)})`);
          return prev; // Mantener selección anterior
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

  // const handleAssign = async () => {
  //   try {
  //     const itemsAsignados = reservas
  //       .flatMap(reserva => reserva.items_info?.items || [])
  //       .filter(item => selectedItems.some(selected => selected.id_item === item.id_item));

  // const payload = {
  //   fecha_emision: facturaData.comprobante.fecha.split("T")[0], // solo la fecha
  //   estado: "En proceso",
  //   usuario_creador: clienteSeleccionado.id_agente,
  //   total: parseFloat(facturaData.comprobante.total),
  //   subtotal: parseFloat(facturaData.comprobante.subtotal),
  //   impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
  //   saldo: parseFloat(facturaData.comprobante.total),
  //   rfc: facturaData.receptor.rfc,
  //   id_empresa: empresaSeleccionada.id_empresa,
  //   uuid_factura: facturaData.timbreFiscal.uuid,
  //   rfc_emisor: facturaData.emisor.rfc,
  //   url_pdf: archivoPDFUrl || null,
  //   url_xml: archivoXMLUrl || null,
  //   items_json: JSON.stringify(itemsAsignados),
  // };

  //     console.log("Enviando payload:", payload);

  //     const response = await fetch(`${URL}/mia/factura/CrearFacturaDesdeCarga`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "x-api-key": API_KEY,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Error al guardar la factura');
  //     }

  //     const data = await response.json();
  //     console.log("Respuesta del servidor:", data);

  //     // Llama a la función onAssign con el payload y la respuesta del servidor
  //     onAssign({
  //       ...payload,
  //       serverResponse: data
  //     });

  //     // Cierra el modal después de enviar
  //     onClose();

  //   } catch (error) {
  //     console.error("Error al asignar factura:", error);
  //     alert('Ocurrió un error al asignar la factura');
  //   }
  // };

  const handleAssign = async () => {
    try {
      const itemsAsignados = reservas
        .flatMap(reserva => reserva.items_info?.items || [])
        .filter(item => selectedItems.some(selected => selected.id_item === item.id_item));

      // Crear payload específico para asignación
      const asignacionPayload = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0], // solo la fecha
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
        items_json: JSON.stringify(itemsAsignados),
      };

      console.log("Enviando payload de asignación:", asignacionPayload);

      const response = await fetch(`${URL}/mia/factura/CrearFacturaDesdeCarga`, {
        method: "POST",
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
      console.log("Respuesta del servidor:", data);

      // Llamar a onAssign con el payload específico
      onAssign(asignacionPayload);

      // Cerrar modal después de éxito
      onClose();

    } catch (error) {
      console.error("Error al asignar factura:", error);
      alert('Ocurrió un error al asignar la factura');
    }
  };

  if (!isOpen) return null;

  // Prepare data for the Table component
  const tableData = reservas.flatMap(reserva =>
    (reserva.items_info?.items || []).map(item => ({
      id_item: item.id_item,
      precio: item.total,
      codigo: reserva.codigo_reservacion_hotel,
      descripcion: `${reserva.nombre_hotel} (${new Date(reserva.check_in).toLocaleDateString()} - ${new Date(reserva.check_out).toLocaleDateString()})`,
      seleccionado: item, // Usa la función helper
    }))
  );


  console.log("TABLE: ", tableData)
  console.log("SELECTED ITEMS: ", selectedItems);
  console.log("MONTO SELECCIONADO: ", montoSeleccionado);
  console.log("MONTO SELECCIONADO: ", maxMontoPermitido);


  // Custom renderer for the checkbox column
  // const renderers = {
  //   seleccionado: ({ value, row }: { value: boolean, row: any }) => {
  //     console.log(row)
  //     const currentItemTotal = row.precio || 0;
  //     const wouldExceed = montoSeleccionado + currentItemTotal > maxMontoPermitido;

  //     return (
  //       <input
  //         type="checkbox"
  //         checked={value}
  //         onChange={() => !value && !wouldExceed && handleItemSelection(row.id_item, row.precio)}
  //         className={`h-4 w-4 ${wouldExceed ? 'text-gray-400' : 'text-blue-600'} focus:ring-blue-500 border-gray-300 rounded`}
  //         disabled={!value && wouldExceed}
  //       />
  //     );
  //   },
  //   // ... resto de renderers
  //   precio: ({ value }: { value: number }) => (
  //     <span>${value.toFixed(2)}</span>
  //   )
  // };
  const renderers = {
    seleccionado: ({ value }: { value: TableRow }) => {
      console.log(value)
      return (
        <input
          type="checkbox"
          checked={isItemSelected(value.id_item)}
          disabled={maxMontoPermitido < value.total}
          onChange={() => handleItemSelection(value.id_item, value.total)}
          className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
        />
      );
    },
    precio: ({ value }: { value: number }) => (
      <span className="font-medium">${value.toFixed(2)}</span>
    )
  };
  const renderers2 = {
    seleccionado: (props: { value: any }) => {
      const { value: row } = props;
      console.log("Renderer props:", props);
      return (
        <input
          type="checkbox"
          checked={row.seleccionado}
          onChange={() => handleItemSelection(row.id_item, row.precio)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      );
    },
    precio: (props: { value: number }) => (
      <span>${props.value.toFixed(2)}</span>
    )
  };

  console.log("Reservas con items:", reservas);
  console.log("Table data prepared:", tableData);


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Asignar Factura a Items de Reservación</h2>

        <div className="mb-6">
          <p>Factura guardada exitosamente. Selecciona los items específicos a los que quieres asignar esta factura.</p>

          <div className="flex justify-between my-4">
            <div>
              <p className="text-sm text-gray-600">Monto factura:</p>
              <p className="text-lg font-semibold">${maxMontoPermitido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Restante:</p>
              <p className="text-lg font-semibold">${"algo"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seleccionado:</p>
              <p className={`text-lg font-semibold ${montoSeleccionado > maxMontoPermitido ? 'text-red-600' : 'text-blue-600'
                }`}>
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
              <Table
                registros={tableData}
                renderers={renderers}
                maxHeight="400px"
                customColumns={['seleccionado']}
                leyenda="Some legend text"
              />
            )}
          </div>
        </div>

        <button
          onClick={handleAssign}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          disabled={montoSeleccionado > maxMontoPermitido}
        >
          Confirmar Asignación
        </button>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;