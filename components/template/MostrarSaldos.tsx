import React, { useEffect, useState } from "react";
import { Saldo, SaldoFavor } from "@/services/SaldoAFavor";
import { redondear } from "@/helpers/formater";
import { TableFromMia } from "../organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { BalanceCard } from "../molecule/BalanceCard";

interface PagarModalProps {
  onSubmit?: (
    saldos: (Saldo & { restante: number; usado: boolean })[],
    faltante: number,
    isPrimary: boolean
  ) => void;
  precio: number;
  id_agente: string;
  loading: boolean;
}

export const MostrarSaldos: React.FC<PagarModalProps> = ({
  onSubmit,
  precio = 0,
  id_agente,
  loading,
}) => {
  const [faltante, setFaltante] = useState<number>(precio);
  const [saldosFavor, setSaldosFavor] = useState<
    (Saldo & { restante: number; usado: boolean })[]
  >([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchSaldos();
  }, []);

  const fetchSaldos = async () => {
    try {
      if (!id_agente) {
        throw new Error("ID de agente no disponible");
      }
      const { data } = await SaldoFavor.getPagos(id_agente);
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
    }
  };

  const onSelectSaldo = (
    value: boolean,
    item: Saldo & { restante: number; usado: boolean }
  ) => {
    try {
      if (faltante == 0 && value)
        throw new Error("Ya has seleccionado el total del precio");
      if (faltante < 0 && value)
        throw new Error(
          "Parece que se debe regresar dinero por esta reserva, solo presiona en continuar"
        );

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

  let total_saldos = redondear(
    saldosFavor.reduce((previus, current) => previus + Number(current.saldo), 0)
  );

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-4">
      <TableFromMia
        maxHeight="200px"
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
      <BalanceCard
        saldoAFavor={total_saldos}
        precioAPagar={precio}
        loading={loading}
        totalSeleccionado={saldosFavor.reduce(
          (previus, current) =>
            redondear(previus + Number(current.saldo) - current.restante),
          0
        )}
        onSecondary={() =>
          onSubmit(
            saldosFavor
              .filter((saldo) => saldo.usado)
              .map((saldo) => ({
                ...saldo,
                saldo_usado: redondear(
                  Number(saldo.saldo) - saldo.restante
                ).toFixed(2),
              })),
            faltante,
            false
          )
        }
        onConfirm={() =>
          onSubmit(
            saldosFavor
              .filter((saldo) => saldo.usado)
              .map((saldo) => ({
                ...saldo,
                saldo_usado: redondear(
                  Number(saldo.saldo) - saldo.restante
                ).toFixed(2),
              })),
            faltante,
            true
          )
        }
      ></BalanceCard>
    </div>
  );
};
