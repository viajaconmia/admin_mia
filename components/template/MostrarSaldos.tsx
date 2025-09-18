import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Saldo, SaldoFavor } from "@/services/SaldoAFavor";
import { formatNumberWithCommas } from "@/helpers/formater";
import { TableFromMia } from "../organism/TableFromMia";

interface SelectedItem {
  id_item: string;
  saldo: number;
}

interface PagarModalProps {
  rowData?: any;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  precio: number;
  agente: Agente;
}

export const MostrarSaldos: React.FC<PagarModalProps> = ({
  onClose,
  onSubmit,
  precio,
  agente,
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
  const [saldoFavorData, setSaldoFavorData] = useState<Saldo[]>([]);

  useEffect(() => {
    fetchSaldoFavorData();
  }, []);

  // Función para obtener datos del nuevo flujo (SaldoFavor)
  const fetchSaldoFavorData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(agente);
      if (!agente.id_agente) {
        throw new Error("ID de agente no disponible en reservaData");
      }

      const { data } = await SaldoFavor.getPagos(agente.id_agente);
      const saldosActivos = data.filter((saldo) => Boolean(saldo.activo));
      console.log(saldosActivos);
      setSaldoFavorData(saldosActivos || []);

      // Procesar datos para la tabla
      const initialOriginalSaldo: Record<string, number> = {};
      const initialSaldo: Record<string, number> = {};

      // Adaptar según la estructura real de los datos de SaldoFavor
      saldosActivos?.forEach((saldo: any) => {
        // Para el nuevo flujo, usamos el saldo completo como "item"
        const idItem = `saldo-${saldo.id_saldos}`;
        const saldoValor = Number(saldo.saldo) || 0;

        initialOriginalSaldo[idItem] = saldoValor;
        initialSaldo[idItem] = saldoValor;
      });

      console.log(initialOriginalSaldo);
      console.log(initialSaldo);

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

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Sección de Información del Saldo */}
      <div className="bg-white rounded-2xl shadow-md border border-blue-100 mb-6">
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100">
          <h3 className="text-blue-800 text-lg font-semibold">
            Información de tus saldos
          </h3>
        </div>
        <div className="px-6 py-4 space-y-2">
          <p className="text-sm text-gray-700 flex gap-4">
            <span className="font-semibold text-gray-900">
              Monto Total Disponible:
            </span>
            <span className="text-green-600 font-bold">
              {`$${formatNumberWithCommas(
                saldoFavorData.reduce(
                  (previus, current) => previus + Number(current.saldo),
                  0
                )
              )}`}
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
        <TableFromMia
          data={saldoFavorData}
          columns={[
            {
              component: "checkbox",
              header: null,
              key: "activo",
              componentProps: { label: "" },
            },
            { component: "text", header: "id saldo", key: "id_saldos" },
            { component: "text", header: "cliente", key: "nombre" },
            { component: "date", header: "creado", key: "fecha_creacion" },
            { component: "precio", header: "monto pagado", key: "monto" },
            { component: "precio", header: "saldo", key: "saldo" },
            { component: "text", header: "forma de pago", key: "metodo_pago" },
            { component: "text", header: "referencia", key: "referencia" },
            { component: "text", header: "comentario", key: "comentario" },
            { component: "text", header: "tarjeta", key: "banco_tarjeta" },
            { component: "active", header: "facturable", key: "is_facturable" },
          ]}
        ></TableFromMia>
      </div>
    </div>
  );
};
