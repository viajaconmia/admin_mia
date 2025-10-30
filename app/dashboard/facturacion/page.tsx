//import { ReservationsMain } from "./_components/reservations-main";
import TablaReservation from "@/app/dashboard/facturacion/_components/reservationnew";
import { API_KEY } from "@/lib/constants";
import { Suspense } from "react";

export default async function ReservationsPage() {
  try {
    return (
      <Suspense
        fallback={
          <>
            <h1>Estamos cargando...</h1>
          </>
        }
      >
        <TablaReservation />;
      </Suspense>
    );
  } catch (error) {
    console.error(error);
    return <h1>Ocurrio un error</h1>;
  }
}
