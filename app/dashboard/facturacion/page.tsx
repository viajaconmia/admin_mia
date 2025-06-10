import { ReservationsMain } from "./_components/reservations-main";
import { API_KEY } from "../../../constant/constants/constantes";
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
        <ReservationsMain />;
      </Suspense>
    );
  } catch (error) {
    console.error(error);
    return <h1>Ocurrio un error</h1>;
  }
}
