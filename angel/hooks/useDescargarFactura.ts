import useApi from "@/hooks/useApi";
import { useAlert } from "@/context/useAlert";
import { envioFacturaService } from "@/angel/services/facturas/envio";

export function useDescargarFactura() {
  const { descargarFactura, descargarFacturaXML } = useApi();
  const { error, success } = useAlert();

  const handleDescargar = async (
    id_facturama: string,
    tipo: "pdf" | "xml",
    nombre = "factura",
  ) => {
    try {
      const obj =
        tipo === "pdf"
          ? await descargarFactura(id_facturama)
          : await descargarFacturaXML(id_facturama);
      const mime = tipo === "pdf" ? "application/pdf" : "application/xml";
      const a = document.createElement("a");
      a.href = `data:${mime};base64,${obj.Content}`;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    } catch {
      error("Error al descargar la factura");
    }
  };

  const handleMandarCorreo = async (
    id_factura: string,
    onSuccess?: () => void,
  ) => {
    if (!id_factura) {
      error("No se encontró el ID de la factura");
      return;
    }
    const correo = prompt(
      "¿A que correo electronico deseas mandar la factura?"
    );
    if (!correo || !correo.trim()) return;

    try {
      await envioFacturaService.enviarCorreoFactura({
        id_factura,
        correo_destino: correo.trim(),
      });
      success("El correo fue mandado con exito");
      onSuccess?.();
    } catch (err: any) {
      error(err?.message || "Ocurrió un error al enviar el correo");
    }
  };

  return { handleDescargar, handleMandarCorreo };
}
