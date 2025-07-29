import React, { useEffect, useState } from 'react';
import { DollarSign, CreditCard, Wallet, Banknote, X } from 'lucide-react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table2 } from "@/components/organism/Table2";

interface TableRow {
  id_item: string;
  total: number;
  codigo: string;
  descripcion: string;
  fecha_uso: string;
  checkout: string;
  seleccionado: boolean;
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

interface PagarModalProps {
  saldoData: {
    id_saldos: string;
    id_agente: string;
    nombre: string
    monto: number;
    saldo: number;
    fecha_pago?: string;
    metodo_pago?: string;
    referencia?: string;
    comentario?: string;
  };
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const PagarModalComponent: React.FC<PagarModalProps> = ({
  saldoData,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    montoPago: saldoData.saldo,
    metodoPago: saldoData.metodo_pago || 'transferencia',
    referencia: saldoData.referencia || '',
    comentario: saldoData.comentario || '',
    fechaPago: saldoData.fecha_pago || new Date().toISOString().split('T')[0]
  });

  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montorestante, setMontoRestante] = useState<number>(saldoData.saldo);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    if (saldoData.id_agente) {
      fetchReservasConItems();
    }
  }, [saldoData.id_agente]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItems?id_agente=${saldoData.id_agente}`,
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
        const restante = saldoData.saldo - newTotal;
        if (restante > 0) {
          setMontoRestante(restante);
        }
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Seleccionar item - verificar que no exceda el límite
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        const newTotal = currentTotal + saldo;
        const restante = saldoData.saldo - newTotal;
        setMontoRestante(restante);

        if (newTotal > saldoData.saldo) {
          alert(`No puedes exceder el saldo disponible ($${saldoData.saldo})`);
          setMontoRestante(restante + currentTotal);
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

  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id_saldos: saldoData.id_saldos,
      id_agente: saldoData.id_agente,
      itemsAsignados: selectedItems
    });
  };

  const tableData = reservas.flatMap(reserva =>
    (reserva.items_info?.items || []).map(item => ({
      id_item: item.id_item,
      codigo: reserva.codigo_reservacion_hotel,
      descripcion: reserva.nombre_hotel,
      fecha_uso: reserva.check_in,
      checkout: reserva.check_out,
      precio: item.total,
      saldo: item.total - montoSeleccionado,
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
        disabled={saldoData.saldo < value.total}
        onChange={() => handleItemSelection(value.id_item, value.total)}
        className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
      />
    ),
    precio: ({ value }: { value: number }) => (
      <span className="font-medium font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${value}
      </span>
    ),
    fecha_uso: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">
        {formatDate(value)}
      </span>
    ),
    checkout: ({ value }: { value: string }) => (
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
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4">
          <h3 className=" text-blue-800 mb-2">Información del Saldo</h3>
          <div className="space-y-2">
            <p className="text-sm"><span className="font-medium">ID Saldo:</span> {saldoData.id_saldos}</p>
            <p className="text-sm"><span className="font-medium">ID Agente:</span> {saldoData.id_agente}</p>
            <p className="text-sm"><span className="font-medium">Monto Total:</span> ${saldoData.monto}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Monto seleccionado:</p>
                <p className={`text-lg font-semibold ${montoSeleccionado > saldoData.saldo ? 'text-red-600' : 'text-blue-600'}`}>
                  ${montoSeleccionado}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto restante:</p>
                <p className="text-lg text-green-600 font-semibold">${montorestante}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Elementos Pendientes</h3>

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
            No hay reservas con items pendientes
          </div>
        ) : (
          <Table2
            registros={tableData}
            renderers={renderers}
            maxHeight="400px"
            customColumns={['seleccionado', 'id_item', 'codigo', 'descripcion', 'fecha_uso', 'checkout', 'precio']}
            leyenda=""
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          disabled={montoSeleccionado > saldoData.saldo}
        >
          <DollarSign className="w-4 h-4" />
          Registrar Pago
        </button>
      </div>
    </div>
  );
};