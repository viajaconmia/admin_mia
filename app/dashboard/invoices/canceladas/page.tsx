"use client";

import { Table } from "@/component/molecule/Table";
import { FacturaService } from "@/services/FacturasService";
import { Factura } from "@/types/_types";
import { useEffect, useState } from "react";
import { mapFacturaTable, renders } from "@/schemas/factura_cancelada";
import Modal from "@/components/organism/Modal";
import { ModalCancelarFactura } from "../_components/traveler_main";

export default function InvoicesCancelledPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState({ estado: ["pending", "canceled"] });
  const [cancelarFactura, setCancelarFactura] = useState<string | null>(null);

  const fetchFacturas = async () => {
    FacturaService.getInstance()
      .getFacturas(filtro)
      .then((r) => setFacturas(r.data.map((f) => mapFacturaTable(f))));
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  return (
    <>
      {cancelarFactura && (
        <Modal
          onClose={() => setCancelarFactura(null)}
          title="Cancelar factura"
        >
          <ModalCancelarFactura
            id={cancelarFactura}
            onClose={() => setCancelarFactura(null)}
            onConfirm={() => {
              fetchFacturas();
            }}
          />
        </Modal>
      )}
      <div className="space-y-2 bg-white p-4 rounded-b-md">
        <h1 className="text-xl font-bold tracking-tight text-sky-950 my-4">
          Facturas canceladas o pendientes de cancelar
        </h1>
        <Table
          registros={facturas}
          renderers={renders({
            setFacturas,
            onCancel: (id) => {
              setCancelarFactura(id);
            },
          })}
        />
      </div>
    </>
  );
}
