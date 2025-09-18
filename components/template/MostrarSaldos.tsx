import React, { useEffect, useState } from "react";
import { DollarSign, X, Moon } from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table3 } from "@/components/organism/Table3";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SaldoFavor } from "@/services/SaldoAFavor";

interface SelectedItem {
  id_item: string;
  saldo: number;
}

interface PagarModalProps {
  rowData?: any;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  open?: boolean;
  id_agente: string;
  precio: number;
}

export const PagarModalComponent: React.FC<PagarModalProps> = ({
  rowData,
  onClose,
  onSubmit,
  open = true,
  id_agente,
  precio,
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montorestante, setMontoRestante] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemsSaldo, setItemsSaldo] = useState<Record<string, number>>({});
  const [originalSaldoItems, setOriginalSaldoItems] = useState<
    Record<string, number>
  >({});
  const [saldoFavorData, setSaldoFavorData] = useState<any[]>([]);

  useEffect(() => {
    fetchSaldoFavorData();
  }, []);

  // Función para obtener datos del nuevo flujo (SaldoFavor)
  const fetchSaldoFavorData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id_agente) {
        throw new Error("ID de agente no disponible en reservaData");
      }

      const response = await SaldoFavor.getPagos(id_agente);
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
      setError(err.message || "Error al cargar los datos de saldo a favor");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldoOriginal: number) => {
    setSelectedItems((prev) => {
      const isCurrentlySelected = prev.some((item) => item.id_item === id_item);
      const currentSaldo = itemsSaldo[id_item] ?? saldoOriginal;

      if (isCurrentlySelected) {
        // Deseleccionar item - restaurar el saldo original
        const newSelection = prev.filter((item) => item.id_item !== id_item);
        const newTotal = newSelection.reduce(
          (sum, item) => sum + item.saldo,
          0
        );
        const restante = precio - newTotal;

        // Restaurar el saldo original del item
        setItemsSaldo((prevSaldo) => ({
          ...prevSaldo,
          [id_item]: saldoOriginal,
        }));

        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Verificar si ya se ha alcanzado el límite
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        const mensaje = "Ya has utilizado todo tu saldo disponible";
        if (currentTotal >= precio) {
          alert(mensaje);
          return prev;
        }

        // Calcular cuánto podemos aplicar de este ítem
        const saldoDisponible = precio - currentTotal;
        const montoAAplicar = Math.min(currentSaldo, saldoDisponible);

        // Actualizar el saldo del ítem (lo que queda por payar)
        const nuevoSaldoItem = currentSaldo - montoAAplicar;
        setItemsSaldo((prevSaldo) => ({
          ...prevSaldo,
          [id_item]: nuevoSaldoItem,
        }));

        const newTotal = currentTotal + montoAAplicar;
        const restante = precio - newTotal;

        const newSelection = [...prev, { id_item, saldo: montoAAplicar }];
        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      }
    });
  };

  const isItemSelected = (id_item: string): boolean => {
    return selectedItems.some((item) => item.id_item === id_item);
  };

  const formatIdItem = (id: string): string => {
    if (!id) return "";
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
  };
  const tableData = saldoFavorData
    .filter((saldo) => saldo.activo !== 0)
    .map((saldo) => ({
      creado: saldo.fecha_creacion ? new Date(saldo.fecha_creacion) : null,
      id_item: `saldo-${saldo.id_saldos}`,
      id_servicio: "",
      codigo_reservacion: saldo.referencia || "",
      hotel: "",
      viajero: "",
      activo: saldo.activo,
      fecha_uso: saldo.fecha_creacion || "",
      total: Number(saldo.monto) || 0,
      item: saldo,
      // Campos adicionales para el nuevo flujo
      forma_De_Pago: formatFormaPago(saldo.metodo_pago),
      tipo_tarjeta: saldo.tipo_tarjeta || "",
      monto_pagado: Number(saldo.monto),
      saldo: Number(saldo.saldo) || 0,
      seleccionado: saldo,
      saldo_restante:
        itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined
          ? itemsSaldo[`saldo-${saldo.id_saldos}`]
          : Number(saldo.saldo) || 0,
    }));
  // Si el modal no está abierto, no renderizar nada
  if (!open) return null;

  const titulo = "💰 Información del Saldo";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-800">
            Aplicar Pago con Saldo a Favor
          </h2>
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
              <h3 className="text-blue-800 text-lg font-semibold">{titulo}</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  Monto Total Disponible:
                </span>
                <span className="text-green-600 font-bold">
                  {" "}
                  ${Number(precio).toFixed(2)}
                </span>
              </p>

              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monto seleccionado:</p>
                    <p
                      className={`text-lg font-semibold ${
                        Number(montoSeleccionado) > precio
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      ${Number(montoSeleccionado).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto restante:</p>
                    <p className="text-lg text-green-600 font-semibold">
                      ${Number(montorestante).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Tabla */}
          <div className="mb-6">
            <div className="min-h-[300px] max-h-[400px] overflow-auto">
              <div>tabla</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
