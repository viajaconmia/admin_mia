"use client";

import { Table } from "@/component/molecule/Table";
import { useEffect } from "react";

export default function InvoicesCancelledPage() {
  useEffect(() => {}, []);

  return (
    <div className="space-y-2 bg-white p-4 rounded-b-md">
      <h1 className="text-xl font-bold tracking-tight text-sky-950 my-4">
        Facturas canceladas o pendientes de cancelar
      </h1>
      <Table registros={[{ name: "hola" }]} />
    </div>
  );
}
