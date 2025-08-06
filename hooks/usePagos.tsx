"use client";
import { CreditoService } from "@/services/CreditosService";
import { PagosService } from "@/services/PagosService";
import { SaldosService } from "@/services/SaldosService";
import { Item, Saldo, TypesSaldoWallet } from "@/types/database_tables";
import { useCallback, useState } from "react";

export const usePagos = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const getTypesSaldo = useCallback(async (id_agente: string) => {
    setLoading(true);
    try {
      return await SaldosService.getInstance().obtenerSaldoPorTipo(id_agente);
    } catch (error) {
      console.error(
        error.response || error.message || "Error desconocido en la función"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSaldosByType = useCallback(
    async (type: TypesSaldoWallet, id_agente: string, id_hospedaje: string) => {
      setLoading(true);
      try {
        return await SaldosService.getInstance().obtenerSaldosDelTipo(
          type,
          id_agente,
          id_hospedaje
        );
      } catch (error) {
        console.error(
          error.response || error.message || "Error desconocido en la función"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cobrarYActualizarPagoCredito = useCallback(
    async (body: {
      id_agente: string;
      diferencia: number;
      id_servicio: string;
      hotel: string;
      id_hospedaje: string;
      id_booking: string;
      precio_actualizado: string;
    }) => {
      setLoading(true);
      try {
        const response =
          await CreditoService.getInstance().updateAndPayPrecioVenta(body);
        return response;
      } catch (error) {
        console.error(
          error.response || error.message || "Error desconocido en la función"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const actualizarContadoRegresarSaldo = useCallback(
    async (body: {
      id_agente: string;
      id_servicio: string;
      diferencia: number;
      id_booking: string;
      id_hospedaje: string;
      precio_actualizado: number;
      id_pago: string;
    }) => {
      setLoading(true);
      try {
        return await PagosService.getInstance().actualizarContadoRegresarSaldo(
          body
        );
      } catch (error) {
        console.error(
          error.response || error.message || "Error desconocido en la función"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const ajustePrecioCobrarSaldo = useCallback(
    async (body: {
      updatedItem: Item;
      updatedSaldos: (Saldo & { monto_cargado_al_item: string })[];
      diferencia: number;
      precioActualizado: number;
      id_booking: string;
      id_servicio: string;
    }) => {
      setLoading(true);
      try {
        return await PagosService.getInstance().ajustePrecioConSaldo(body);
      } catch (error) {
        console.error(
          error.response || error.message || "Error desconocido en la función"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const actualizarYRegresarCredito = useCallback(
    async (body: {
      id_agente: string;
      id_servicio: string;
      diferencia: number;
      id_booking: string;
      id_hospedaje: string;
      precio_actualizado: number;
    }) => {
      setLoading(true);
      try {
        const response =
          await CreditoService.getInstance().actualizarYRegresarCredito(body);
        return response;
      } catch (error) {
        console.error(
          error.response || error.message || "Error desconocido en la función"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const probarFetch = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve, reject) => setTimeout(reject, 1500));
    } catch (error) {
      console.error("Hubo un error en la operación:", error);
      throw new Error("No se que paso");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    probarFetch,
    loading,
    getTypesSaldo,
    cobrarYActualizarPagoCredito,
    getSaldosByType,
    actualizarYRegresarCredito,
    actualizarContadoRegresarSaldo,
    ajustePrecioCobrarSaldo,
  };
};
