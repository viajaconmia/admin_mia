import { API_KEY } from "../../constants/constantes";
import { CreditPage } from "./_components/credit-container";

const CreditDashboard = async () => {
  const response = await fetch(
    "https://mianoktos.vercel.app/v1/mia/pagos/todos",
    {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  ).then((res) => res.json());

  console.log(response);

  return (
    <>
      <CreditPage dataUsersCredit={response || []} />
    </>
  );
};

export default CreditDashboard;
