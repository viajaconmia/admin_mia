import { ReservationsMain } from "./_components/prepagos-main";
import { API_KEY } from "../../../constant/constants/constantes";
import { Suspense } from "react";
import { URL } from "@/constant";

const historialPrepagos = [
  {
    cliente: "Laura Jiménez",
    email: "laura.jimenez@email.com",
    fecha: "2024-02-05",
    metodo: "SPEI",
    referencia: "REF987654321",
    monto: 6000.00,
    montoRestante: 1500.00,
    estado: "pending"
  },
  {
    cliente: "Diego Torres",
    email: "diego.torres@email.com",
    fecha: "2024-03-10",
    metodo: "Stripe Manual",
    referencia: "ch_7X9Y8Z7A6B5C",
    monto: 4800.00,
    montoRestante: 0.00,
    estado: "applied"
  },
  {
    cliente: "Mariana Pérez",
    email: "mariana.perez@email.com",
    fecha: "2024-03-25",
    metodo: "Stripe Link",
    referencia: "AUTO-987XYZ",
    monto: 3500.00,
    montoRestante: 3500.00,
    estado: "pending"
  },
  {
    cliente: "Omar Castillo",
    email: "omar.castillo@email.com",
    fecha: "2024-04-12",
    metodo: "SPEI",
    referencia: "REF1122334455",
    monto: 5200.00,
    montoRestante: 2000.00,
    estado: "pending"
  },
  {
    cliente: "Sofía Luna",
    email: "sofia.luna@email.com",
    fecha: "2024-04-28",
    metodo: "Stripe Manual",
    referencia: "ch_9K8J7H6G5F4D",
    monto: 7000.00,
    montoRestante: 1200.00,
    estado: "pending"
  }
];


export default async function ReservationsPage() {
  //const [prepagos, setPrepagos] = useState(historialPrepagos);
  // const fetchPrepagos = async () => {
  //   const endpoint = `${URL}/v1/mia/pagos/getPrepagos`;
  //   try {
  //     const response = await fetch(endpoint, {
  //       method: "GET",
  //       headers: {
  //         "x-api-key": API_KEY || "",
  //         "Cache-Control": "no-cache, no-store, must-revalidate",
  //         "Content-Type": "application/json",
  //       },
  //       cache: "no-store", // Este campo es útil en el navegador, pero puedes dejarlo
  //     });

  //     const data = await response.json();

  //     // Verifica si data tiene error (dependiendo de cómo responda tu API)
  //     if (Array.isArray(data) && (data[0]?.error || data[1]?.error)) {
  //       throw new Error("Error al cargar los datos");
  //     }
  //     const prepagos = data;

  //     setPrepagos(prepagos);
  //     // return <h1>Estamos en mantenimiento...</h1>;
  //   } catch (error) {
  //     console.log("Error al cargar los datos en prepagos:", error);
  //     console.log(error);
  //     setPrepagos([]);
  //   }
  // }
  // useEffect(() => {
  //   fetchPrepagos();
  // }, [])

  return (
    <Suspense
      fallback={
        <>
          <h1>Estamos cargando...</h1>
        </>
      }
    >
      <ReservationsMain/>;
    </Suspense>
  );
}
