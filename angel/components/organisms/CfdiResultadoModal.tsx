"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/angel/components/molecules/Modal";
import Button from "@/components/atom/Button";
import { EmailInput } from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";

type CfdiResultadoEstado = "cargando" | "exito" | "error";

type CfdiResultadoModalProps = {
  open: boolean;
  onClose: () => void;
  estado: CfdiResultadoEstado;
  resultado?: { id_factura: string; id_facturama?: string } | null;
  errorMensaje?: string | null;

  onEnviarCorreo: (correo: string) => void;
  enviandoCorreo?: boolean;

  onDescargarPdf: () => void;
  onDescargarXml: () => void;
  descargando?: "pdf" | "xml" | null;
};

export function CfdiResultadoModal(props: CfdiResultadoModalProps) {
  const {
    open,
    onClose,
    estado,
    resultado,
    errorMensaje,
    onEnviarCorreo,
    enviandoCorreo = false,
    onDescargarPdf,
    onDescargarXml,
    descargando = null,
  } = props;
  const [correo, setCorreo] = useState("");
  const sinFolioFacturama = !resultado?.id_facturama;

  const handleEnviarCorreo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!correo.trim() || enviandoCorreo) return;
    onEnviarCorreo(correo);
  };

  const footer =
    estado === "exito" ? (
      <div className="flex w-full justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    ) : estado === "error" ? (
      <div className="flex w-full justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={estado === "cargando" ? () => {} : onClose}
      title="Resultado de facturación"
      className="max-w-md"
      footer={footer}
    >
      {estado === "cargando" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader size="sm" />
          <p className="text-sm text-gray-700">Generando factura…</p>
        </div>
      )}

      {estado === "exito" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Factura creada:{" "}
            <span className="font-medium">
              {resultado?.id_factura ?? "No disponible"}
            </span>
          </p>

          <form className="space-y-3" onSubmit={handleEnviarCorreo}>
            <EmailInput
              label="Correo electrónico"
              value={correo}
              onChange={setCorreo}
              placeholder="correo@ejemplo.com"
              disabled={enviandoCorreo}
            />
            <Button
              type="submit"
              disabled={!correo.trim() || enviandoCorreo}
              loading={enviandoCorreo}
            >
              {enviandoCorreo ? "Enviando…" : "Enviar por correo"}
            </Button>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={onDescargarPdf}
              disabled={sinFolioFacturama || descargando === "pdf"}
              loading={descargando === "pdf"}
            >
              Descargar PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDescargarXml}
              disabled={sinFolioFacturama || descargando === "xml"}
              loading={descargando === "xml"}
            >
              Descargar XML
            </Button>
          </div>

          {sinFolioFacturama && (
            <p className="text-xs text-gray-500">
              No hay un folio de Facturama disponible para descargar los
              archivos.
            </p>
          )}
        </div>
      )}

      {estado === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-700">
            {errorMensaje ?? "No fue posible generar la factura."}
          </p>
          <p className="text-xs text-gray-500">
            Cierra esta ventana y vuelve a intentarlo desde "Generar" para
            evitar generar la factura dos veces.
          </p>
        </div>
      )}
    </Modal>
  );
}
