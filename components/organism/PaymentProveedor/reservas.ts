import { HEADERS_API, URL } from "@/lib/constants";


export const fetchReservation = async (
  id: string,
  callback: (data: any) => void
) => {
  const response = await fetch(`${URL}/v1/mia/solicitud/id?id=${id}`, {
    method: "GET",
    headers: HEADERS_API,
  });
  const json = await response.json();
  console.log(json);
  const data: any = json.data[0];
  callback(data);
};

export const getUbicacion = async (id: string) => {
  const response = await fetch(`${URL}/mia/solicitud/ubicacion?id=${id}`, {
    method: "GET",
    headers: HEADERS_API,
  });
  const json = await response.json();
  console.log(json);
  return json;
};
