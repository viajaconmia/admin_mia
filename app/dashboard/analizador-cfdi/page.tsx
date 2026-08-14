"use client";

import { AnalizadorFacturaXml } from "@/angel/components/organisms/AnalizadorFacturaXml";

export default function AnalizadorCfdiPage() {
  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Analizador de factura XML
      </h1>
      <div className="max-w-5xl mx-auto bg-white p-4 rounded-lg shadow">
        <AnalizadorFacturaXml />
      </div>
    </div>
  );
}
