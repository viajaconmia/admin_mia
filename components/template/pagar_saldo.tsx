import React, { useEffect, useState } from 'react';
import { DollarSign, CreditCard, Wallet, Banknote, X } from 'lucide-react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table3 } from "@/components/organism/Table3";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatNumberWithCommas } from "@/helpers/utils";
import { SaldoFavor } from "@/services/SaldoAFavor"; // Importar el servicio

interface TableRow {
  id_item: string;
  total: number;
  codigo: string;
  descripcion: string;
  fecha_uso: string;
  checkout: string;
  seleccionado: boolean;
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
      saldo: number;
      servicio: string;
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
  rowData: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  hospedajeData?: any; // Nuevo prop opcional
}

export const PagarModalComponent: React.FC<PagarModalProps> = ({
  saldoData,
  rowData,
  onClose,
  onSubmit,
  hospedajeData = null // Valor por defecto null
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
  const [itemsSaldo, setItemsSaldo] = useState<Record<string, number>>({ "": 0 });
  const [originalSaldoItems, setOriginalSaldoItems] = useState<Record<string, number>>({});
  const [usingHospedajeData, setUsingHospedajeData] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si tenemos datos de hospedaje
    if (hospedajeData && Object.keys(hospedajeData).length > 0) {
      setUsingHospedajeData(true);
      fetchSaldoFavor();
    } else if (saldoData.id_agente) {
      setUsingHospedajeData(false);
      fetchReservasConItems();
    }
  }, [saldoData.id_agente, hospedajeData]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItemsSinPagar?id_agente=${saldoData.id_agente}`,
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

      const initialOriginalSaldo: Record<string, number> = {};
      data.data?.forEach((reserva: ReservaConItems) => {
        reserva.items_info?.items?.forEach(item => {
          initialOriginalSaldo[item.id_item] = item.saldo;
        });
      });
      setOriginalSaldoItems(initialOriginalSaldo);

      // Inicializar itemsSaldo con los saldos originales
      const initialSaldo: Record<string, number> = {};
      data.data?.forEach((reserva: ReservaConItems) => {
        reserva.items_info?.items?.forEach(item => {
          initialSaldo[item.id_item] = item.saldo;
        });
      });
      setItemsSaldo(initialSaldo);

    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaldoFavor = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el servicio SaldoFavor para obtener los datos
      const response: { message: string; data: any[] } =
        await SaldoFavor.getPagos(saldoData.id_agente);

      console.log("Datos de saldo a favor:", response.data);

      // Procesar los datos según la estructura necesaria
      // (Aquí debes adaptar la respuesta a la estructura de ReservaConItems)
      const processedData = processHospedajeData(response.data);
      setReservas(processedData);

      // Inicializar saldos
      const initialOriginalSaldo: Record<string, number> = {};
      const initialSaldo: Record<string, number> = {};

      processedData.forEach((reserva: ReservaConItems) => {
        reserva.items_info?.items?.forEach(item => {
          initialOriginalSaldo[item.id_item] = item.saldo;
          initialSaldo[item.id_item] = item.saldo;
        });
      });

      setOriginalSaldoItems(initialOriginalSaldo);
      setItemsSaldo(initialSaldo);

    } catch (err) {
      console.error("Error fetching saldo favor:", err);
      setError(err.message || 'Error al cargar los datos de saldo a favor');
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos de hospedaje a la estructura esperada
  const processHospedajeData = (hospedajeData: any[]): ReservaConItems[] => {
    // Implementar la lógica para transformar los datos de hospedaje
    // a la estructura de ReservaConItems
    // Este es un ejemplo básico, debes adaptarlo a tu estructura real de datos
    return hospedajeData.map(item => ({
      id_reserva: item.id_reserva || '',
      codigo_reserva: item.codigo_reserva || '',
      codigo_reservacion_hotel: item.codigo_reservacion_hotel || '',
      items: item.items || [],
      nombre_hotel: item.nombre_hotel || '',
      check_in: item.check_in || '',
      check_out: item.check_out || '',
      viajero: item.viajero || '',
      status_reserva: item.status_reserva || '',
      items_info: {
        items: item.items_info?.items || []
      }
    }));
  };

  const handleItemSelection = (id_item: string, saldoOriginal: number) => {
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.some(item => item.id_item === id_item);
      const currentSaldo = itemsSaldo[id_item] ?? saldoOriginal;

      if (isCurrentlySelected) {
        // Deseleccionar item - restaurar el saldo original
        const newSelection = prev.filter(item => item.id_item !== id_item);
        const newTotal = newSelection.reduce((sum, item) => sum + item.saldo, 0);
        const restante = saldoData.saldo - newTotal;

        // Restaurar el saldo original del item
        setItemsSaldo(prevSaldo => ({
          ...prevSaldo,
          [id_item]: saldoOriginal
        }));

        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Verificar si ya se ha alcanzado el límite
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        if (currentTotal >= saldoData.saldo) {
          alert('Ya has utilizado todo tu saldo disponible');
          return prev;
        }

        // Calcular cuánto podemos aplicar de este ítem
        const saldoDisponible = saldoData.saldo - currentTotal;
        const montoAAplicar = Math.min(currentSaldo, saldoDisponible);

        // Actualizar el saldo del ítem (lo que queda por pagar)
        const nuevoSaldoItem = currentSaldo - montoAAplicar;
        setItemsSaldo(prevSaldo => ({
          ...prevSaldo,
          [id_item]: nuevoSaldoItem
        }));

        const newTotal = currentTotal + montoAAplicar;
        const restante = saldoData.saldo - newTotal;

        const newSelection = [...prev, { id_item, saldo: montoAAplicar }];
        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      }
    });
  };

  const isItemSelected = (id_item: string): boolean => {
    return selectedItems.some(item => item.id_item === id_item);
  };

  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Función para formatear a 2 decimales
    const formatToTwoDecimals = (value: number): number => {
      return parseFloat(value.toFixed(2));
    };

    // Crear el payload con la estructura solicitada
    const payload = {
      SaldoAFavor: {
        ...rowData, // Incluye todos los datos de rowData
        saldo: formatToTwoDecimals(montorestante), // Reemplaza el saldo con el monto restante formateado
      },
      items_seleccionados: selectedItems.map(item => {
        // Buscar el item completo en tableData para obtener más información
        const itemData = tableData.find(td => td.id_item === item.id_item);
        const saldoItem = itemsSaldo[item.id_item] || 0;
        const totalItem = itemData?.total || 0;
        const servicioItem = itemData?.id_servicio || '';
        const saldoOriginal = originalSaldoItems[item.id_item] || 0; // Aquí usamos el saldo original

        // Calcular fracción (si saldo es 0, fraccionado es 0)
        const fraccionado = saldoItem === 0 ? 0 : formatToTwoDecimals(totalItem - saldoItem);

        return {
          total: formatToTwoDecimals(totalItem), // Total del item formateado
          saldo: formatToTwoDecimals(saldoOriginal), // Usamos el saldo original aquí
          saldonuevo: formatToTwoDecimals(saldoItem), // Saldo restante del item formateado
          id_item: item.id_item,
          fraccion: fraccionado,
          id_servicio: servicioItem, // Servicio del item
        };
      })
    };

    console.log('Payload:', payload);

    // Determinar qué endpoint usar según el origen de los datos
    const endpoint = usingHospedajeData
      ? `${URL}/mia/pagos/aplicarpagoPorSaldoAFavorHospedaje`
      : `${URL}/mia/pagos/aplicarpagoPorSaldoAFavor`;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al aplicar el pago por saldo a favor");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Respuesta del servidor:", data);
        // Aquí puedes realizar acciones adicionales si fue exitoso
      })
      .catch((error) => {
        console.error("Error en la petición:", error);
      });

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
      id_servicio: item.servicio,
      codigo_reservacion: reserva.codigo_reservacion_hotel,
      hotel: reserva.nombre_hotel,
      viajero: reserva.viajero,
      fecha_uso: reserva.check_in,
      total: item.total,
      saldo: itemsSaldo[item.id_item] !== undefined ? itemsSaldo[item.id_item] : item.saldo,
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
    id_servicio: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value)}
      </span>
    ),
    seleccionado: ({ value }: { value: TableRow }) => (
      <input
        type="checkbox"
        checked={isItemSelected(value.id_item)}
        onChange={() => handleItemSelection(value.id_item, value.saldo)}
        className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
      />
    ),
    total: ({ value }: { value: number }) => (
      <span className="font-medium font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${value}
      </span>
    ),
    fecha_uso: ({ value }: { value: string | null }) => {
      if (!value) return <div className="text-gray-400 italic">Sin fecha</div>;

      return (
        <div className="whitespace-nowrap text-sm text-blue-900">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    checkout: ({ value }: { value: string | null }) => {
      if (!value) return <div className="text-gray-400 italic">Sin fecha</div>;

      return (
        <div className="whitespace-nowrap text-sm text-blue-900">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    hotel: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">
        {value}
      </span>
    ),
    codigo_reservacion: ({ value }: { value: string }) => (
      <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-sm border border-yellow-100">
        {value}
      </span>
    ),
    saldo: ({ value }: { value: number }) => (
      <span className={`font-medium text-sm px-2 py-1 rounded flex items-center justify-center ${value > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        ${Number(value).toFixed(2)}
      </span>
    ),
  };

  return (
    <div className="p-6">
      <div className="max-w-md bg-white rounded-2xl shadow-md border border-blue-100">
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100">
          <h3 className="text-blue-800 text-lg font-semibold">💰 Información del Saldo</h3>
        </div>
        <div className="px-6 py-4 space-y-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Nombre del Agente:</span> {saldoData.nombre}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Monto Total:</span> <span className="text-green-600 font-bold">${Number(saldoData.monto).toFixed(2)}</span>
          </p>

          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Monto seleccionado:</p>
                <p className={`text-lg font-semibold ${Number(montoSeleccionado) > saldoData.saldo ? 'text-red-600' : 'text-blue-600'}`}>
                  ${Number(montoSeleccionado).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto restante:</p>
                <p className="text-lg text-green-600 font-semibold">${Number(montorestante).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
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
          <Table3
            registros={tableData}
            renderers={renderers}
            maxHeight="400px"
            customColumns={['seleccionado', 'codigo', 'hotel', 'fecha_uso', 'total', 'saldo']}
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