"use client";
import { useCallback, useState } from "react";
import { useAlert } from "@/context/useAlert";
import { analizarFacturaXmlDesdeUrl } from "@/angel/lib/cfdi/analizarFacturaXml";
import { mensajeErrorFacturaXml } from "@/angel/lib/cfdi/errors";
import type { InvoiceResult, NormalizedInvoice } from "@/angel/lib/cfdi/types";

export function useAnalizarFacturaXml(urlInicial = "") {
  const [url, setUrl] = useState(urlInicial);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<InvoiceResult | null>(null);
  const [normalizado, setNormalizado] = useState<NormalizedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { error } = useAlert();

  const analizar = useCallback(() => {
    const value = url.trim();

    if (!value) {
      setErrorMsg("Ingresa una URL de XML");
      return;
    }

    try {
      new URL(value);
    } catch {
      setErrorMsg("La URL no es válida");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    analizarFacturaXmlDesdeUrl(value)
      .then(({ normalizado, resultado }) => {
        setNormalizado(normalizado);
        setResultado(resultado);
      })
      .catch((err) => {
        const mensaje = mensajeErrorFacturaXml(err, "No se pudo analizar el XML");
        setErrorMsg(mensaje);
        setResultado(null);
        setNormalizado(null);
        error(mensaje);
      })
      .finally(() => setLoading(false));
  }, [url, error]);

  const reset = useCallback(() => {
    setUrl("");
    setResultado(null);
    setNormalizado(null);
    setErrorMsg(null);
    setLoading(false);
  }, []);

  return { url, setUrl, loading, resultado, normalizado, errorMsg, analizar, reset };
}
