import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Loader2,
  Calendar,
  Wallet2,
} from "lucide-react";
import { useNotification } from "@/context/useNotificacion";
import { Solicitud2 } from "@/types";
import { calcularNoches, formatNumberWithCommas } from "@/helpers/utils";
import { usePagos } from "@/hooks/usePagos";
import Modal from "./Modal";
import { NumberInput } from "../atom/Input";
import { Saldo, TypesSaldoWallet } from "@/types/database_tables";

type SaldoWallet = {
  [key in TypesSaldoWallet]: number;
};

interface SalesManagementPageProps {
  reserva: Solicitud2;
  onClose: () => void;
  total: number;
  idAgente: string;
  noches?: number; // Agregamos noches como prop opcional
  esNuevaReserva?: boolean; // Nueva prop para identificar si es una reserva nueva
  onPagoRealizado?: () => void; // Callback para cuando se complete el pago
}

const SalesManagementPage: React.FC<SalesManagementPageProps> = ({
  reserva,
  onClose,
  total,
  idAgente,
  noches = 0,
  esNuevaReserva = false,
  onPagoRealizado
}) => {
  const { showNotification } = useNotification();
  const [pagos, setPagos] = useState()
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [saldoWallet, setSaldoWallet] = useState<SaldoWallet | null>(null);
  const [precioActualizado, setPrecioActualizado] = useState<number>(total);
  const {
    getTypesSaldo,
    loading,
    ajustePrecioCobrarSaldo,
    cobrarYActualizarPagoCredito,
    getSaldosByType,
    actualizarYRegresarCredito,
    actualizarContadoRegresarSaldo,
  } = usePagos();
  const diferencia = precioActualizado - 0;
  const esBajada = diferencia < 0;
  const precioMinimo = noches;
  const esValido = precioActualizado >= precioMinimo;

  useEffect(() => {
    // Actualizar el precio cuando el total cambie
    setPrecioActualizado(total);
  }, [total]);

  const consultarWallet = async (): Promise<void> => {
    try {
      const { data } = await getTypesSaldo(idAgente);

      // Accumulate saldo by payment method
      const saldoByMetodo = data.reduce(
        (acc: { [key: string]: number }, current) => {
          acc[current.metodo_pago] = Number(current.saldo);
          return acc;
        },
        {}
      );
      setSaldoWallet({
        tarjeta: saldoByMetodo.tarjeta || 0,
        wallet: saldoByMetodo.wallet || 0,
        transferencia: saldoByMetodo.transferencia || 0,
      });
      setShowWalletModal(true);
    } catch (error) {
      console.log(error);
      showNotification(
        "error",
        `Error al consultar wallet: ${error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  useEffect(() => {
    if (esNuevaReserva && total > 0) {
      // Para reservas nuevas, establecer el precio actualizado igual al total
      setPrecioActualizado(total);
    }
  }, [esNuevaReserva, total]);


  const pagarConWallet = async (tipo: TypesSaldoWallet): Promise<void> => {
    try {
      const {
        data: { saldos, item },
      } = await getSaldosByType(tipo, idAgente, reserva.id_hospedaje);
      const updatedSaldos: (Saldo & { monto_cargado_al_item: string })[] = [];
      let total_to_splitear = diferencia;
      saldos.forEach((element) => {
        if (total_to_splitear <= 0) return;
        if (total_to_splitear > Number(element.saldo)) {
          updatedSaldos.push({
            ...element,
            saldo: "0",
            monto_cargado_al_item: element.saldo,
            fecha_pago: element.fecha_pago.split("T")[0],
            fecha_creacion: element.fecha_creacion.split("T")[0],
          });
          total_to_splitear = total_to_splitear - Number(element.saldo);
          return;
        }
        updatedSaldos.push({
          ...element,
          saldo: (Number(element.saldo) - total_to_splitear).toFixed(2),
          monto_cargado_al_item: total_to_splitear.toFixed(2),
          fecha_pago: element.fecha_pago.split("T")[0],
          fecha_creacion: element.fecha_creacion.split("T")[0],
        });
        total_to_splitear = 0;
      });
      const updatedItem = {
        ...item,
        total: diferencia.toFixed(2),
        subtotal: (diferencia / 1.16).toFixed(2),
        impuestos: (diferencia - diferencia / 1.16).toFixed(2),
        saldo: "0",
        id_item: null,
        id_factura: null,
        is_facturado: 0 as 0,
        costo_total: "0",
        costo_subtotal: "0",
        costo_iva: "0",
        costo_impuestos: "0",
        is_ajuste: 1 as 1,
        fecha_uso: item.fecha_uso.split("T")[0],
      };

      const { message } = await ajustePrecioCobrarSaldo({
        updatedItem,
        updatedSaldos: updatedSaldos,
        diferencia,
        precioActualizado,
        id_booking: reserva.id_booking,
        id_servicio: reserva.id_servicio,
      });

      showNotification("success", message);
      setShowWalletModal(false);
      onPagoRealizado?.(); // Llamar al callback
      onClose();
    } catch (error) {
      showNotification(
        "error",
        `Error en pago: ${error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  const pagarConCredito = async (): Promise<void> => {
    try {
      if (!esValido)
        throw new Error("El precio de venta no puede ser menor a $1 por noche");

      const { message, data } = await cobrarYActualizarPagoCredito({
        id_agente: idAgente,
        diferencia,
        id_servicio: reserva.id_servicio,
        hotel: reserva.hotel_reserva,
        id_hospedaje: reserva.id_hospedaje,
        id_booking: reserva.id_booking,
        precio_actualizado: precioActualizado.toFixed(2),
      });
      console.log(data);
      showNotification("success", message);
      onClose();
    } catch (error) {
      showNotification(
        "error",
        `Error en pago con crédito: ${error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  const regresarDinero = async () => {
    try {
      if (!esValido)
        throw new Error("El precio de venta no puede ser menor a $1 por noche");

      if (esBajada) {
        if (reserva.metodo_pago_dinamico === "Credito") {
          const { message } = await actualizarYRegresarCredito({
            id_agente: idAgente,
            id_servicio: reserva.id_servicio,
            diferencia,
            id_booking: reserva.id_booking,
            id_hospedaje: reserva.id_hospedaje,
            precio_actualizado: precioActualizado,
          });
          showNotification("success", message);
        } else {
          console.log(
            "Debemos regresarle el dinero al cliente, por lo tanto cambiamos el precio de los items, de la reserva y le agregamos un saldo con el restante y el otro se lo debemos quitar al pago"
          );
          const { message, data } = await actualizarContadoRegresarSaldo({
            id_agente: idAgente,
            id_servicio: reserva.id_servicio,
            diferencia,
            id_booking: reserva.id_booking,
            id_hospedaje: reserva.id_hospedaje,
            precio_actualizado: precioActualizado,
            id_pago: reserva.id_pago,
          });
          console.log(message, data);
          showNotification("success", message);
        }
      }
      onClose();
      onPagoRealizado?.(); // Llamar al callback
    } catch (error) {
      showNotification(
        "error",
        `Error en pago con crédito: ${error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  return (
    <>
      <div className="w-full mx-auto">
        {/* Reserva Info */}
        <div className="flex flex-col justify-start p-4 border-b border-slate-100">
          <div className="text-left">
            <div className="text-2xl font-bold text-slate-800">
              ${formatNumberWithCommas(total.toFixed(2))}
            </div>
            <div className="text-sm text-slate-500">Precio original</div>
          </div>
          <div>
            <div className="flex items-center justify-end gap-4 mt-1 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{noches} noches</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                <span className="capitalize">
                  {reserva.metodo_pago_dinamico}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Input Section */}
        <div className="space-y-4">
          <NumberInput

            value={precioActualizado}
            onChange={(value) => setPrecioActualizado(Number(value) || 0)}
            placeholder="0"
            label="Precio actualizado"
          />

          {diferencia !== 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {esBajada ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-sm font-medium">
                    {esBajada ? "Reducción" : "Incremento"}:
                  </span>
                </div>
                <span
                  className={`font-bold ${esBajada ? "text-red-600" : "text-emerald-600"
                    }`}
                >
                  {esBajada ? "-" : "+"}${Math.abs(diferencia).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {diferencia !== 0 && esValido && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            {esBajada ? (
              <button
                onClick={regresarDinero}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {loading ? "Procesando..." : "Actualizar Precio"}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={consultarWallet}
                  disabled={loading} // Corregido: eliminado el duplicado
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                  {loading ? "Consultando..." : "Wallet"}
                </button>
                <button
                  onClick={pagarConCredito}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {loading ? "Procesando..." : "Crédito"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {showWalletModal && saldoWallet && (
        <>
          <Modal
            title="Saldos de wallet"
            onClose={() => {
              setShowWalletModal(false);
            }}
          >
            <div className="space-y-2 w-96">
              <div className="mt-2 p-3 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-700 text-center">
                  Monto requerido:{" "}
                  <span className="font-semibold">
                    ${formatNumberWithCommas(diferencia.toFixed(2))}
                  </span>
                </p>
              </div>
              {Object.entries(saldoWallet).map(([type, saldo]) => (
                <WalletOption
                  key={type}
                  tipo={type as TypesSaldoWallet}
                  saldo={saldo}
                  diferencia={diferencia}
                  loading={loading}
                  onClick={() => {
                    pagarConWallet(type as TypesSaldoWallet);
                  }}
                />
              ))}
            </div>
          </Modal>
        </>
      )}
    </>
  );
};

interface WalletOptionProps {
  tipo: "transferencia" | "tarjeta" | "wallet";
  saldo: number;
  diferencia: number;
  loading: boolean;
  onClick: () => void;
}

export const WalletOption = ({
  tipo,
  saldo,
  diferencia,
  loading,
  onClick,
}: WalletOptionProps) => {
  const esTransferencia = tipo === "transferencia";
  const esTarjeta = tipo === "tarjeta";
  const color = esTransferencia ? "blue" : esTarjeta ? "sky" : "green";
  const Icon = esTransferencia ? DollarSign : esTarjeta ? CreditCard : Wallet2;

  return (
    <div
      className={`bg-${color}-50 rounded-xl p-3 flex flex-col gap-2 shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 bg-${color}-100 rounded-full flex items-center justify-center`}
          >
            <Icon className={`w-3 h-3 text-${color}-600`} />
          </div>
          <span className="font-semibold text-sm text-slate-800">
            {esTransferencia
              ? "Transferencia"
              : esTarjeta
                ? "Tarjeta"
                : "Wallet"}
          </span>
        </div>
        <span className={`text-sm font-bold text-${color}-600`}>
          ${formatNumberWithCommas(saldo.toFixed(2))}
        </span>
      </div>
      <button
        onClick={onClick}
        disabled={loading || saldo < diferencia}
        className={`w-full bg-${color}-600 hover:bg-${color}-700 disabled:bg-slate-300 text-white text-xs py-1 px-3 rounded-lg transition-colors`}
      >
        {loading ? "Procesando..." : `Usar ${tipo}`}
      </button>
    </div>
  );
};

export default SalesManagementPage;