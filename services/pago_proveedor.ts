import { API_KEY, URL } from "@/lib/constants";

export const fetchUpdateEmpresasAgentes = async (
  data,
  callback: (data) => void
) => {
  const response = await fetch(`${URL}/mia/agentes/`, {
    method: "PUT",
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateBody),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Error al cargar los datos");
  }
  const data = await response.json();
  console.log(data);
  callback(data);
  return data;
};
