import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";
import { formatNumberWithCommas } from "@/helpers/utils";
import { horasDesde } from "@/lib/utils";
import { FacturaService } from "@/services/FacturasService";
import { Factura } from "@/types/_types";
import { RefreshCcw } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";

export const mapFacturaTable = (factura: Factura) => {
  return {
    id: factura.uuid_factura,
    emision: factura.fecha_emision.split("T")[0],
    cliente: factura.nombre_comercial,
    folio: factura.folio,
    total: `$${formatNumberWithCommas(factura.total)}`,
    estado: factura.estado,
    solicitud_cancelacion: factura.request_canceled_time
      ? `${factura.request_canceled_time.split("T")[0]} : ${factura.request_canceled_time.split("T")[1].split(".")[0]}`
      : "",
    horas: factura.request_canceled_time
      ? Math.floor(horasDesde(factura.request_canceled_time))
      : "",
    acciones: {
      cancelar: factura.request_canceled_time
        ? Math.floor(horasDesde(factura.request_canceled_time)) > 72 &&
          factura.estado == "pending"
        : "",
      id: factura.id_factura,
    },
  };
};

export const renders = ({
  setFacturas,
  onCancel,
}: {
  setFacturas: Dispatch<SetStateAction<Factura[]>>;
  onCancel: (id: string) => void;
}) => {
  return {
    estado: ({ value }: { value: string }) => {
      switch (value) {
        case "pending":
          return (
            <span className="text-yellow-500 font-bold bg-yellow-500/10 px-3 border border-yellow-500 py-1 rounded-full">
              Pendiente
            </span>
          );
        case "canceled":
          return (
            <span className="text-red-500 font-bold bg-red-500/10 px-3 border border-red-500 py-1 rounded-full">
              Cancelada
            </span>
          );
        default:
          return (
            <span className="text-gray-500 font-bold bg-gray-500/10 px-3 border border-gray-500 py-1 rounded-full">
              {value}
            </span>
          );
      }
    },
    acciones: ({ value }: { value: { cancelar: boolean; id: string } }) => {
      const [loading, setLoading] = useState(false);
      const { error, success } = useAlert();
      return (
        <>
          <Button
            size="sm"
            icon={RefreshCcw}
            disabled={loading}
            onClick={() => {
              setLoading(true);
              FacturaService.getInstance()
                .actualizarFactura(value.id)
                .then((res) => {
                  setFacturas((prev: any) => {
                    const newFactura = mapFacturaTable(res.data);
                    return prev.map((f: any) =>
                      f.id === res.data.uuid_factura ? newFactura : f,
                    );
                  });
                  if (!!res.metadata) {
                    const eliminar_relacion = window.confirm(
                      res.metadata.message,
                    );
                    if (eliminar_relacion) {
                      FacturaService.getInstance()
                        .eliminarRelacionFactura(res.data.id_factura)
                        .then((r) => {
                          success(
                            r.message || "Relación eliminada correctamente",
                          );
                        });
                    }
                  }
                  success(res.message || "Estado actualizado correctamente");
                })
                .catch((e) => {
                  error(e.message || "Error al actualizar el estado");
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
          >
            Actualizar estado
          </Button>
          {!!value.cancelar && (
            <Button
              disabled={loading}
              size="sm"
              variant="warning"
              onClick={() => {
                onCancel(value.id);
              }}
            >
              Cancelar
            </Button>
          )}
        </>
      );
    },
  };
};
