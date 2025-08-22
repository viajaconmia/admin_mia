import React, { useEffect, useState } from 'react';
import { DollarSign, X, Moon } from 'lucide-react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table3 } from "@/components/organism/Table3";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SaldoFavor } from "@/services/SaldoAFavor";

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
  saldoData?: {
    id_saldos: string;
    id_agente: string;
    nombre: string;
    monto: number;
    saldo: number;
    fecha_pago?: string;
    metodo_pago?: string;
    referencia?: string;
    comentario?: string;
  };
  rowData?: any;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  open?: boolean;
  reservaData?: {
    id_agente: string;
    Total?: number;
    Noches?: number;
    // otros campos que pueda tener reservaData
  } | null;
}

export const PagarModalComponent: React.FC<PagarModalProps> = ({
  saldoData,
  rowData,
  onClose,
  onSubmit,
  open = true,
  reservaData = null
}) => {
  console.log("reservaData recibida:", reservaData);

  // Si no hay saldoData pero hay reservaData, crear un saldoData básico
  const effectiveSaldoData = saldoData || (reservaData ? {
    id_saldos: 'temporal',
    id_agente: reservaData.id_agente,
    nombre: 'Agente',
    monto: reservaData.Total || 0,
    saldo: reservaData.Total || 0,
  } : {
    id_saldos: '',
    id_agente: '',
    nombre: '',
    monto: 0,
    saldo: 0,
  });

  const [formData, setFormData] = useState({
    montoPago: effectiveSaldoData.saldo,
    metodoPago: effectiveSaldoData.metodo_pago || 'transferencia',
    referencia: effectiveSaldoData.referencia || '',
    fechaPago: effectiveSaldoData.fecha_pago || new Date().toISOString().split('T')[0]
  });

  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montorestante, setMontoRestante] = useState<number>(effectiveSaldoData.saldo);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemsSaldo, setItemsSaldo] = useState<Record<string, number>>({});
  const [originalSaldoItems, setOriginalSaldoItems] = useState<Record<string, number>>({});
  const [saldoFavorData, setSaldoFavorData] = useState<any[]>([]);

  useEffect(() => {
    if (reservaData) {
      // Nuevo flujo: usar SaldoFavor cuando tenemos reservaData
      fetchSaldoFavorData();
    } else if (effectiveSaldoData.id_agente) {
      // Flujo existente
      fetchReservasConItems();
    }
  }, [effectiveSaldoData.id_agente, reservaData]);

  // Función para obtener datos del nuevo flujo (SaldoFavor)
  const fetchSaldoFavorData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reservaData?.id_agente) {
        throw new Error('ID de agente no disponible en reservaData');
      }

      const response = await SaldoFavor.getPagos(reservaData.id_agente);
      console.log("Datos de SaldoFavor:", response.data);
      setSaldoFavorData(response.data || []);

      // Procesar datos para la tabla
      const initialOriginalSaldo: Record<string, number> = {};
      const initialSaldo: Record<string, number> = {};

      // Adaptar según la estructura real de los datos de SaldoFavor
      response.data?.forEach((saldo: any) => {
        // Para el nuevo flujo, usamos el saldo completo como "item"
        const idItem = `saldo-${saldo.id_saldos}`;
        const saldoValor = Number(saldo.saldo) || 0;

        initialOriginalSaldo[idItem] = saldoValor;
        initialSaldo[idItem] = saldoValor;
      });

      setOriginalSaldoItems(initialOriginalSaldo);
      setItemsSaldo(initialSaldo);

    } catch (err) {
      console.error("Error fetching SaldoFavor data:", err);
      setError(err.message || 'Error al cargar los datos de saldo a favor');
    } finally {
      setLoading(false);
    }
  };

  // Función para el flujo existente
  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItemsSinPagar?id_agente=${effectiveSaldoData.id_agente}`,
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
      const initialSaldo: Record<string, number> = {};

      data.data?.forEach((reserva: ReservaConItems) => {
        reserva.items_info?.items?.forEach(item => {
          initialOriginalSaldo[item.id_item] = item.saldo;
          initialSaldo[item.id_item] = item.saldo;
        });
      });

      setOriginalSaldoItems(initialOriginalSaldo);
      setItemsSaldo(initialSaldo);

    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldoOriginal: number) => {
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.some(item => item.id_item === id_item);
      const currentSaldo = itemsSaldo[id_item] ?? saldoOriginal;

      if (isCurrentlySelected) {
        // Deseleccionar item - restaurar el saldo original
        const newSelection = prev.filter(item => item.id_item !== id_item);
        const newTotal = newSelection.reduce((sum, item) => sum + item.saldo, 0);
        const restante = effectiveSaldoData.saldo - newTotal;

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
        if (currentTotal >= effectiveSaldoData.saldo) {
          alert('Ya has utilizado todo tu saldo disponible');
          return prev;
        }

        // Calcular cuánto podemos aplicar de este ítem
        const saldoDisponible = effectiveSaldoData.saldo - currentTotal;
        const montoAAplicar = Math.min(currentSaldo, saldoDisponible);

        // Actualizar el saldo del ítem (lo que queda por payar)
        const nuevoSaldoItem = currentSaldo - montoAAplicar;
        setItemsSaldo(prevSaldo => ({
          ...prevSaldo,
          [id_item]: nuevoSaldoItem
        }));

        const newTotal = currentTotal + montoAAplicar;
        const restante = effectiveSaldoData.saldo - newTotal;

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

  const formatFormaPago = (metodo_pago: string): string => {
    switch (metodo_pago) {
      case "transferencia":
        return "Transferencia Bancaria";
      case "tarjeta credito":
        return "Tarjeta de Crédito";
      case "tarjeta debito":
        return "Tarjeta de Débito";
      case "wallet":
        return "Wallet";
      default:
        return metodo_pago || "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Función para formatear a 2 decimales
    const formatToTwoDecimals = (value: number): number => {
      return parseFloat(value.toFixed(2));
    };

    // Determinar qué datos usar según el flujo
    const tableDataToUse = reservaData ?
      // Datos del nuevo flujo (SaldoFavor)
      saldoFavorData.map(saldo => ({
        id_item: `saldo-${saldo.id_saldos}`,
        id_servicio: '',
        codigo_reservacion: saldo.referencia || '',
        hotel: '',
        viajero: '',
        fecha_uso: saldo.fecha_creacion || '',
        total: Number(saldo.monto) || 0,
        saldo: itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined ?
          itemsSaldo[`saldo-${saldo.id_saldos}`] :
          (Number(saldo.saldo) || 0),
        seleccionado: saldo,
        item: saldo,
        // Campos adicionales para el nuevo flujo
        forma_De_Pago: formatFormaPago(saldo.metodo_pago),
        tipo_tarjeta: saldo.tipo_tarjeta || "",
        creado: saldo.fecha_creacion ? new Date(saldo.fecha_creacion) : null,
        monto_pagado: Number(saldo.monto)
      })) :
      // Datos del flujo existente
      reservas.flatMap(reserva =>
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

    // Crear el payload con la estructura solicitada
    const payload = {
      SaldoAFavor: {
        ...rowData,
        saldo: formatToTwoDecimals(montorestante),
      },
      items_seleccionados: selectedItems.map(item => {
        // Buscar el item completo en tableData para obtener más información
        const itemData = tableDataToUse.find(td => td.id_item === item.id_item);
        const saldoItem = itemsSaldo[item.id_item] || 0;
        const totalItem = itemData?.total || 0;
        const servicioItem = itemData?.id_servicio || '';
        const saldoOriginal = originalSaldoItems[item.id_item] || 0;

        // Calcular fracción (si saldo es 0, fraccionado es 0)
        const fraccionado = saldoItem === 0 ? 0 : formatToTwoDecimals(totalItem - saldoItem);

        return {
          total: formatToTwoDecimals(totalItem),
          saldo: formatToTwoDecimals(saldoOriginal),
          saldonuevo: formatToTwoDecimals(saldoItem),
          id_item: item.id_item,
          fraccion: fraccionado,
          id_servicio: servicioItem,
        };
      })
    };

    console.log('Payload:', payload);

    // Determinar la URL del endpoint según el flujo
    const endpoint = reservaData ?
      "/mia/pagos/nuevoEndpointParaReservaData" : // Reemplazar con el endpoint correcto
      "/mia/pagos/aplicarpagoPorSaldoAFavor";

    try {
      const response = await fetch(`${URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al aplicar el pago por saldo a favor");
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Llamar a onSubmit si está definido
      if (onSubmit) {
        onSubmit({
          ...formData,
          id_saldos: effectiveSaldoData.id_saldos,
          id_agente: effectiveSaldoData.id_agente,
          itemsAsignados: selectedItems
        });
      }

      // Cerrar el modal después de enviar
      onClose();
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  // Preparar datos para la tabla según el flujo
  const tableData = reservaData ?
    // Datos del nuevo flujo (SaldoFavor)
    saldoFavorData.map(saldo => ({
      creado: saldo.fecha_creacion ? new Date(saldo.fecha_creacion) : null,
      id_item: `saldo-${saldo.id_saldos}`,
      id_servicio: '',
      codigo_reservacion: saldo.referencia || '',
      hotel: '',
      viajero: '',
      fecha_uso: saldo.fecha_creacion || '',
      total: Number(saldo.monto) || 0,
      item: saldo,
      // Campos adicionales para el nuevo flujo
      forma_De_Pago: formatFormaPago(saldo.metodo_pago),
      tipo_tarjeta: saldo.tipo_tarjeta || "",
      monto_pagado: Number(saldo.monto),
      saldo: itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined ?
        itemsSaldo[`saldo-${saldo.id_saldos}`] :
        (Number(saldo.saldo) || 0),
      seleccionado: saldo,
    })) :
    // Datos del flujo existente
    reservas.flatMap(reserva =>
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

  // Renderers para la tabla - diferentes según el flujo
  const renderers = reservaData ? {
    // Renderers para el nuevo flujo (SaldoFavor)
    seleccionado: ({ value }: { value: any }) => (
      <input
        type="checkbox"
        checked={isItemSelected(`saldo-${value.id_saldos}`)}
        onChange={() => handleItemSelection(`saldo-${value.id_saldos}`, Number(value.saldo))}
        className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
      />
    ),
    creado: ({ value }: { value: Date | null }) => {
      if (!value) return <div className="text-gray-400 italic">Sin fecha</div>;
      return (
        <div className="whitespace-nowrap text-sm text-blue-900">
          {format(value, "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    monto_pagado: ({ value }: { value: number }) => (
      <span className="font-medium font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${value.toFixed(2)}
      </span>
    ),
    saldo: ({ value }: { value: number }) => (
      <span className={`font-medium text-sm px-2 py-1 rounded flex items-center justify-center ${value > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        ${Number(value).toFixed(2)}
      </span>
    ),
    forma_De_Pago: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">
        {value}
      </span>
    ),
    tipo_tarjeta: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {value || "N/A"}
      </span>
    ),
  } : {
    // Renderers para el flujo existente
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

  // Columnas personalizadas según el flujo
  const customColumns = reservaData ?
    ['seleccionado', 'creado', 'monto_pagado', 'saldo', 'forma_De_Pago', 'tipo_tarjeta'] :
    ['seleccionado', 'codigo_reservacion', 'hotel', 'fecha_uso', 'total', 'saldo'];

  // Si el modal no está abierto, no renderizar nada
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-800">Aplicar Pago con Saldo a Favor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Sección de Información del Saldo */}
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 mb-6">
            <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100">
              <h3 className="text-blue-800 text-lg font-semibold">💰 Información del Saldo</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Nombre del Agente:</span> {effectiveSaldoData.nombre}
              </p>

              {/* Mostrar Total y Noches cuando hay reservaData */}
              {reservaData && (
                <>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Total de la Reserva:</span>
                    <span className="text-green-600 font-bold"> ${reservaData.Total?.toFixed(2) || '0.00'}</span>
                  </p>
                  <p className="text-sm text-gray-700 flex items-center">
                    <span className="font-semibold text-gray-900">Noches:</span>
                    <span className="ml-1 text-blue-600 font-medium flex items-center">
                      <Moon className="w-4 h-4 mr-1" />
                      {reservaData.Noches || 0}
                    </span>
                  </p>
                </>
              )}

              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Monto Total Disponible:</span>
                <span className="text-green-600 font-bold"> ${Number(effectiveSaldoData.monto).toFixed(2)}</span>
              </p>

              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monto seleccionado:</p>
                    <p className={`text-lg font-semibold ${Number(montoSeleccionado) > effectiveSaldoData.saldo ? 'text-red-600' : 'text-blue-600'}`}>
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

          {/* Sección de Tabla */}
          <div className="mb-6">
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando {reservaData ? 'datos de saldo' : 'reservas'}...</p>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">
                {error}
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-gray-500 p-4 bg-gray-50 rounded">
                No hay {reservaData ? 'saldos disponibles' : 'reservas con items'} pendientes
              </div>
            ) : (
              <div className="min-h-[300px] max-h-[400px] overflow-auto">
                <Table3
                  registros={tableData}
                  renderers={renderers}
                  maxHeight="100%"
                  customColumns={customColumns}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={montoSeleccionado > effectiveSaldoData.saldo}
            >
              <DollarSign className="w-4 h-4" />
              Registrar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
  //     <div className="bg-white rounded-2xl shadow-xl border border-blue-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
  //       {/* Header */}
  //       <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100 flex justify-between items-center">
  //         <h2 className="text-xl font-semibold text-blue-800">Aplicar Pago con Saldo a Favor</h2>
  //         <button
  //           onClick={onClose}
  //           className="text-gray-500 hover:text-gray-700 transition-colors"
  //         >
  //           <X size={24} />
  //         </button>
  //       </div>

  //       {/* Contenido con scroll */}
  //       <div className="flex-1 overflow-y-auto p-6">
  //         {/* Sección de Información del Saldo */}
  //         <div className="bg-white rounded-2xl shadow-md border border-blue-100 mb-6">
  //           <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100">
  //             <h3 className="text-blue-800 text-lg font-semibold">💰 Información del Saldo</h3>
  //           </div>
  //           <div className="px-6 py-4 space-y-2">
  //             <p className="text-sm text-gray-700">
  //               <span className="font-semibold text-gray-900">Nombre del Agente:</span> {effectiveSaldoData.nombre}
  //             </p>

  //             {/* Mostrar Total y Noches cuando hay reservaData */}
  //             {reservaData && (
  //               <>
  //                 <p className="text-sm text-gray-700">
  //                   <span className="font-semibold text-gray-900">Total de la Reserva:</span>
  //                   <span className="text-green-600 font-bold"> ${reservaData.Total?.toFixed(2) || '0.00'}</span>
  //                 </p>
  //                 <p className="text-sm text-gray-700 flex items-center">
  //                   <span className="font-semibold text-gray-900">Noches:</span>
  //                   <span className="ml-1 text-blue-600 font-medium flex items-center">
  //                     <Moon className="w-4 h-4 mr-1" />
  //                     {reservaData.Noches || 0}
  //                   </span>
  //                 </p>
  //               </>
  //             )}

  //             <p className="text-sm text-gray-700">
  //               <span className="font-semibold text-gray-900">Monto Total Disponible:</span>
  //               <span className="text-green-600 font-bold"> ${Number(effectiveSaldoData.monto).toFixed(2)}</span>
  //             </p>

  //             <div className="mt-4 pt-4 border-t border-blue-100">
  //               <div className="flex justify-between">
  //                 <div>
  //                   <p className="text-sm text-gray-600">Monto seleccionado:</p>
  //                   <p className={`text-lg font-semibold ${Number(montoSeleccionado) > effectiveSaldoData.saldo ? 'text-red-600' : 'text-blue-600'}`}>
  //                     ${Number(montoSeleccionado).toFixed(2)}
  //                   </p>
  //                 </div>
  //                 <div>
  //                   <p className="text-sm text-gray-600">Monto restante:</p>
  //                   <p className="text-lg text-green-600 font-semibold">${Number(montorestante).toFixed(2)}</p>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>

  //         {/* Sección de Tabla */}
  //         <div className="mb-6">
  //           {loading ? (
  //             <div className="text-center py-8">
  //               <p>Cargando {reservaData ? 'datos de saldo' : 'reservas'}...</p>
  //             </div>
  //           ) : error ? (
  //             <div className="text-red-500 p-4 bg-red-50 rounded">
  //               {error}
  //             </div>
  //           ) : tableData.length === 0 ? (
  //             <div className="text-gray-500 p-4 bg-gray-50 rounded">
  //               No hay {reservaData ? 'saldos disponibles' : 'reservas con items'} pendientes
  //             </div>
  //           ) : (
  //             <div className="min-h-[300px] max-h-[400px] overflow-auto">
  //               <Table3
  //                 registros={tableData}
  //                 renderers={renderers}
  //                 maxHeight="100%"
  //                 customColumns={customColumns}
  //               />
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //       {/* Footer con botones */}
  //       <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
  //         <div className="flex justify-end gap-3">
  //           <button
  //             onClick={onClose}
  //             className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
  //           >
  //             Cancelar
  //           </button>
  //           <button
  //             onClick={handleSubmit}
  //             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
  //             disabled={montoSeleccionado > effectiveSaldoData.saldo}
  //           >
  //             <DollarSign className="w-4 h-4" />
  //             Registrar Pago
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

};