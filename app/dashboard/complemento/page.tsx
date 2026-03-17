"use client";

import { SaldosService } from "@/services/SaldosService";
import { useEffect, useState } from "react";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import * as schema from "@/schemas/tables/complemento_pago";
import { CompleteTable } from "@/v3/template/Table";
import Modal from "@/components/organism/Modal";
import { TextInput } from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";

type FiltrosComplementos = { proveedor?: string };
const PAGE_SIZE = 50;

export default function ReservationsPage() {
  const [saldos, setSaldos] = useState<schema.SaldoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosComplementos>({});
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );

  const fetchSaldos = async (page: number = tracking.page) => {
    setLoading(true);
    SaldosService.getInstance()
      .obtenerSaldos({ page })
      .then(({ data, metadata }) => {
        console.log("Saldos obtenidos:", data);
        setSaldos(data.map((saldo) => schema.mapSaldo(saldo)));
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  return (
    <>
      <ModalDetallesComplemento
        onClose={() => {
          setSelectedPaymentId(null);
        }}
        id={selectedPaymentId}
      />
      <CompleteTable<schema.SaldoItem>
        pageTracking={tracking}
        fetchData={fetchSaldos}
        registros={saldos}
        loading={loading}
        renderers={schema.createRenderers({
          onVerDetalles: (id) => setSelectedPaymentId(id),
        })}
      />
    </>
  );
}

const ModalDetallesComplemento = ({
  onClose,
  id,
}: {
  onClose: () => void;
  id: number | string;
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!!id) {
      setLoading(true);
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      {!!id && (
        <Modal
          onClose={onClose}
          title="Detalles del Complemento de Pago"
          subtitle="Verifica los datos para poder crear el complemento de pago"
        >
          <div className="w-[90vw] max-w-5xl min-h-[200px]">
            {loading ? (
              <Loader></Loader>
            ) : (
              <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit}>
                  <TextInput
                    label="Nombre"
                    value={""}
                    onChange={function (value: string): void {
                      throw new Error("Function not implemented.");
                    }}
                  />
                </form>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
