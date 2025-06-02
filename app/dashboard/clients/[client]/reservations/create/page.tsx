import { Suspense } from "react";
import { API_KEY } from "@/app/constants/constantes";
import { ReservationForm } from "../../../_components/ReservationForm";

export default async function ReservationsClient({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  try {
    const { client } = await params;
    const apiEndpoints = [
      "https://miaback.vercel.app/v1/mia/hoteles",
      `https://miaback.vercel.app/v1/mia/viajeros/id?id=${client}`,
    ];
    const responses = await Promise.all(
      apiEndpoints.map((endpoint) =>
        fetch(endpoint, {
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
        }).then((res) => res.json())
      )
    );
    if (responses[0].error || responses[1].error) {
      throw new Error("Error al cargar los datos");
    }
    const [hoteles, viajeros] = responses;

    // return <h1>Estamos en mantenimiento...</h1>;

    return (
      <ReservationForm hotels={hoteles || []} travelers={viajeros || []} />
    );
  } catch (error) {
    console.log("error en las solicitudes: ", error);
    return (
      <div>
        <h1>Ocurrió un error al obtener los registros.</h1>
      </div>
    );
  }
}
