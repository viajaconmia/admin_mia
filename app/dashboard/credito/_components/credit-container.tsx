"use client";

import { API_KEY } from "@/constant/constants/constantes";
import { useEffect, useState } from "react";
import { CreditTable } from "./credit-table";
import { CreditSearch } from "./credit-search";
import { Card } from "@/components/ui/card";

interface CreditData {
  id_agente: string;
  nombre: string | null;
  tiene_credito_consolidado: number;
  monto_credito_agente: number | null;
  monto_credito_empresa: number | null;
  id_empresa: string;
  tiene_credito: number;
  nombre_comercial: string;
  razon_social: string;
  tipo_persona: string;
}

export function CreditPage({
  dataUsersCredit,
}: {
  dataUsersCredit: CreditData[];
}) {
  const [creditData, setCreditData] = useState<CreditData[]>(
    dataUsersCredit || []
  );
  const [searchTerm, setSearchTerm] = useState("");

  const handleUpdate = () => {
    fetch("https://miaback.vercel.app/v1/mia/pagos/todos", {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => setCreditData(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    // setCreditData(mockData);
  }, [searchTerm]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Credito
      </h1>
      <Card>
        <div className="p-6 space-y-4">
          <CreditSearch onSearch={setSearchTerm} />
          <CreditTable
            data={creditData}
            searchTerm={searchTerm}
            updateData={handleUpdate}
          />
        </div>
      </Card>
    </div>
  );
}
