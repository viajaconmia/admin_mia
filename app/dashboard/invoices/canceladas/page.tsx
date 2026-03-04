"use client";

import { Table } from "@/component/molecule/Table";
import { FacturaService } from "@/services/FacturasService";
import { useEffect } from "react";

export default function InvoicesCancelledPage() {
  useEffect(() => {
    const facturas = FacturaService.getInstance()
      .getFacturas({ estado: ["pending", "canceled"] })
      .then((r) => console.log(r));
  }, []);

  return (
    <div className="space-y-2 bg-white p-4 rounded-b-md">
      <h1 className="text-xl font-bold tracking-tight text-sky-950 my-4">
        Facturas canceladas o pendientes de cancelar
      </h1>
      <Table registros={[{ name: "hola" }]} />
    </div>
  );
}
