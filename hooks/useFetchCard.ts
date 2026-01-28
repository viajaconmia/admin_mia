// hooks/useFetchCards.js
import { URL, HEADERS_API } from "@/lib/constants";
import { CreditCardInfo } from "@/types";
import { useState, useCallback } from "react";

export const useFetchCards = () => {
  // El estado ahora se llama 'data' porque puede ser un objeto o un array
  const [data, setData] = useState<CreditCardInfo | CreditCardInfo[] | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
 
  // La función ahora tiene un 'id' opcional
  const fetchData = useCallback(async (id = null) => {
    setLoading(true);
    setError(null);

    const endpoint = id ? `/mia/pagar/${id}` : "/mia/pagar";
    const url = `${URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: HEADERS_API,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error en fetchData:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

export type TitularInfo = {
  idTitular: number;
  Titular: string;
  identificacion: string;
  activa: boolean;
};

export const useFetchTitulares = () => {
  const [data, setData] = useState<TitularInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTitulares = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = `${URL}/mia/pagar/titulares`;

    try {
      const response = await fetch(url, {
        headers: HEADERS_API,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Error en fetchTitulares:", err);
      setError(err?.message ?? "Error al cargar titulares");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchTitulares };
};