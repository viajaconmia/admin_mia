import React, { useEffect, useState } from "react";
import { Saldo, SaldoFavor } from "@/services/SaldoAFavor";
import { redondear } from "@/helpers/formater";
import { TableFromMia } from "../organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { BalanceCard } from "../molecule/BalanceCard";

interface PagarModalProps {
  onSubmit?: (data: any) => void;
  precio: number;
  agente: Agente;
}

export const MostrarSaldos: React.FC<PagarModalProps> = ({
  onSubmit,
  precio = 0,
  agente,
}) => {
  const [faltante, setFaltante] = useState<number>(precio);
  const [loading, setLoading] = useState<boolean>(false);
  const [saldosFavor, setSaldosFavor] = useState<
    (Saldo & { restante: number; usado: boolean })[]
  >([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchSaldos();
  }, []);

  const fetchSaldos = async () => {
    try {
      setLoading(true);
      if (!agente.id_agente) {
        throw new Error("ID de agente no disponible");
      }

      const { data } = await SaldoFavor.getPagos(agente.id_agente);
      const saldosActivos = data.filter((saldo) => Boolean(saldo.activo));

      const saldos: (Saldo & { restante: number; usado: boolean })[] =
        saldosActivos.map((saldo: Saldo) => ({
          ...saldo,
          usado: false,
          restante: Number(saldo.saldo),
        }));

      setSaldosFavor(saldos || []);
    } catch (err) {
      showNotification("error", err.message || "error al obtener los saldos");
    } finally {
      setLoading(false);
    }
  };

  const onSelectSaldo = (
    value: boolean,
    item: Saldo & { restante: number; usado: boolean }
  ) => {
    try {
      if (faltante == 0 && value)
        throw new Error("Ya has seleccionado el total del precio");

      const restante: number = value
        ? faltante < item.restante
          ? Number((Number(item.saldo) - faltante).toFixed(2))
          : 0
        : Number(item.saldo);

      setFaltante((prev) =>
        value
          ? prev < item.restante
            ? 0
            : Number((prev - Number(item.saldo)).toFixed(2))
          : Number((prev + Number(item.saldo) - item.restante).toFixed(2))
      );

      setSaldosFavor((prev) =>
        prev.map((saldo) =>
          saldo.id_saldos == item.id_saldos
            ? { ...saldo, usado: value, restante }
            : saldo
        )
      );
    } catch (error) {
      showNotification("error", error.message || "Error al seleccionar saldo");
    }
  };

  const onCreditoConfirm = () => {
    try {
      throw new Error("Aun no existe esta función, esta en proceso");
      showNotification("success", "La reserva ha sido procesada con exito");
    } catch (error) {
      showNotification("error", error.message || "Error al procesar el pago");
    }
  };
  const onConfirm = () => {
    try {
      if (faltante !== 0)
        throw new Error(
          "No has seleccionado el pago, si quieres continuar pagando a credito con el otro boton lo puedes procesar"
        );

      showNotification("success", "La reserva ha sido procesada con exito");
    } catch (error) {
      showNotification("error", error.message || "Error al procesar el pago");
    }
  };

  let total_saldos = redondear(
    saldosFavor.reduce((previus, current) => previus + Number(current.saldo), 0)
  );

  if (precio <= 0)
    return (
      <div className="w-60 h-28">
        <h1>El precio debe tener un valor o ser mayor a 0</h1>
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-4">
      {loading ? (
        <>cargando...</>
      ) : (
        <TableFromMia
          data={saldosFavor}
          columns={[
            {
              component: "checkbox",
              header: null,
              key: "usado",
              componentProps: {
                label: "",
                onChange: onSelectSaldo,
              },
            },
            { component: "text", header: "id saldo", key: "id_saldos" },
            { component: "precio", header: "saldo", key: "restante" },
            {
              component: "text",
              header: "forma de pago",
              key: "metodo_pago",
            },
            { component: "text", header: "comentario", key: "comentario" },
          ]}
        />
      )}
      <BalanceCard
        saldoAFavor={total_saldos}
        precioAPagar={precio}
        totalSeleccionado={saldosFavor.reduce(
          (previus, current) =>
            redondear(previus + Number(current.saldo) - current.restante),
          0
        )}
        onSecondary={onCreditoConfirm}
        onConfirm={onConfirm}
      ></BalanceCard>
    </div>
  );
};
