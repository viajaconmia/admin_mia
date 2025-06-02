import { Suspense } from "react";
import { TravelersPage } from "./_components/traveler_main";
import { API_KEY } from "../../constants/constantes";

export default async function TravelerDashboard() {
  try {
    const apiEndpoints = [
      "https://miaback.vercel.app/v1/mia/empresas",
      "https://miaback.vercel.app/v1/mia/viajeros",
    ];
    const responses = await Promise.all(
      apiEndpoints.map((endpoint) =>
        fetch(endpoint, {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }).then((res) => res.json())
      )
    );
    console.log(responses);
    if (responses[0].error || responses[1].error) {
      throw new Error("Error al cargar los datos");
    }
    const [empresas, viajeros] = responses;

    return (
      <Suspense fallback={<h1>Cargando...</h1>}>
        <TravelersPage
          empresas={empresas || []}
          viajeros={viajeros || []}
        ></TravelersPage>
      </Suspense>
    );
    // return <h1>Estamos en mantenimiento...</h1>;
  } catch (error) {
    console.log("Error al cargar los datos en viajeros:", error);
    console.log(error);
    return <h1>Error al cargar los datos :c</h1>;
  }
}
