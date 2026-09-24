"use client";

import { useCallback, useState } from "react";
import { useAlert } from "@/context/useAlert";
import useApi from "@/hooks/useApi";
import {
  crearFacturaService,
  facturasService,
} from "@/angel/services/facturas";
import type {
  CfdiFacturableItem,
  CfdiPayload,
} from "@/angel/lib/cfdi/payload";

type UseFacturarPagosSeleccionadosParams = {
  onFacturaCreada?: () => void;
};

type EstadoResultado = "idle" | "cargando" | "exito" | "error";

type ResultadoFactura = {
  id_factura: string;
  id_facturama?: string;
};

type BuilderState = {
  builderAbierto: boolean;
  agenteActivo: string;
  itemsActivos: CfdiFacturableItem[];
};

type ResultadoState = {
  resultadoAbierto: boolean;
  estado: EstadoResultado;
  resultado: ResultadoFactura | null;
  errorMensaje: string | null;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export function useFacturarPagosSeleccionados({
  onFacturaCreada,
}: UseFacturarPagosSeleccionadosParams = {}) {
  const { error, success } = useAlert();
  const { descargarFactura, descargarFacturaXML } = useApi();

  const [builder, setBuilder] = useState<BuilderState>({
    builderAbierto: false,
    agenteActivo: "",
    itemsActivos: [],
  });
  const [resultadoState, setResultadoState] = useState<ResultadoState>({
    resultadoAbierto: false,
    estado: "idle",
    resultado: null,
    errorMensaje: null,
  });
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [descargando, setDescargando] = useState<"pdf" | "xml" | null>(
    null,
  );

  const abrirBuilder = useCallback(
    (agentId: string, items: CfdiFacturableItem[]) => {
      setBuilder({
        builderAbierto: true,
        agenteActivo: agentId,
        itemsActivos: items,
      });
    },
    [],
  );

  const cerrarBuilder = useCallback(() => {
    setBuilder((prev) => ({ ...prev, builderAbierto: false }));
  }, []);

  const crearFactura = useCallback(
    async (payload: CfdiPayload) => {
      setResultadoState({
        resultadoAbierto: true,
        estado: "cargando",
        resultado: null,
        errorMensaje: null,
      });

      try {
        const pagos_asociados = payload.items_facturados.map((it) => ({
          raw_id: it.id_item,
          monto: it.monto,
        }));
        const { data } = await crearFacturaService.crearFacturaMultiplesPagos({
          cfdi: payload.cfdi,
          info_user: payload.info_user,
          datos_empresa: payload.info_user.datos_empresa,
          pagos_asociados,
        });

        if (!data) {
          throw new Error("El servidor no devolvió los datos de la factura");
        }

        setResultadoState({
          resultadoAbierto: true,
          estado: "exito",
          resultado: {
            id_factura: data.id_factura,
            id_facturama: data.facturama?.Id,
          },
          errorMensaje: null,
        });
        onFacturaCreada?.();
      } catch (err: unknown) {
        setResultadoState({
          resultadoAbierto: true,
          estado: "error",
          resultado: null,
          errorMensaje: getErrorMessage(err, "No se pudo crear la factura"),
        });
      }
    },
    [onFacturaCreada],
  );

  const onConfirmarBuilder = useCallback(
    (payload: CfdiPayload) => {
      cerrarBuilder();
      void crearFactura(payload);
    },
    [cerrarBuilder, crearFactura],
  );

  const cerrarResultado = useCallback(() => {
    // Conserva el último resultado para que siga disponible si el modal se reabre.
    setResultadoState((prev) => ({ ...prev, resultadoAbierto: false }));
  }, []);

  const enviarCorreo = useCallback(
    async (correo: string) => {
      if (!resultadoState.resultado) {
        error("No se encontró la factura para enviar");
        return;
      }

      setEnviandoCorreo(true);
      try {
        await facturasService.enviarCorreoFactura({
          id_factura: resultadoState.resultado.id_factura,
          correo_destino: correo,
        });
        success("La factura se envió por correo correctamente");
      } catch (err: unknown) {
        error(getErrorMessage(err, "No se pudo enviar la factura por correo"));
      } finally {
        setEnviandoCorreo(false);
      }
    },
    [error, resultadoState.resultado, success],
  );

  const descargarPdf = useCallback(async () => {
    const idFacturama = resultadoState.resultado?.id_facturama;
    if (!idFacturama) {
      error("No se encontró el ID de Facturama para descargar la factura");
      return;
    }

    setDescargando("pdf");
    try {
      const obj = await descargarFactura(idFacturama);
      const a = document.createElement("a");
      a.href = `data:application/pdf;base64,${obj.Content}`;
      a.download = "factura";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    } catch (err: unknown) {
      error(getErrorMessage(err, "Ha ocurrido un error al descargar la factura"));
    } finally {
      setDescargando(null);
    }
  }, [descargarFactura, error, resultadoState.resultado]);

  const descargarXml = useCallback(async () => {
    const idFacturama = resultadoState.resultado?.id_facturama;
    if (!idFacturama) {
      error("No se encontró el ID de Facturama para descargar la factura");
      return;
    }

    setDescargando("xml");
    try {
      const obj = await descargarFacturaXML(idFacturama);
      const a = document.createElement("a");
      a.href = `data:application/xml;base64,${obj.Content}`;
      a.download = "factura";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    } catch (err: unknown) {
      error(getErrorMessage(err, "Ha ocurrido un error al descargar la factura"));
    } finally {
      setDescargando(null);
    }
  }, [descargarFacturaXML, error, resultadoState.resultado]);

  return {
    builderAbierto: builder.builderAbierto,
    agenteActivo: builder.agenteActivo,
    itemsActivos: builder.itemsActivos,
    abrirBuilder,
    cerrarBuilder,
    onConfirmarBuilder,
    resultadoAbierto: resultadoState.resultadoAbierto,
    estado: resultadoState.estado,
    resultado: resultadoState.resultado,
    errorMensaje: resultadoState.errorMensaje,
    cerrarResultado,
    enviandoCorreo,
    enviarCorreo,
    descargando,
    descargarPdf,
    descargarXml,
  };
}
