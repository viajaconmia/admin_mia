import useApi from "@/hooks/useApi";
import { useAlert } from "@/context/useAlert";

export function useDescargarFactura() {
  const { descargarFactura, descargarFacturaXML } = useApi();
  const { error } = useAlert();

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

  return { handleDescargar };
}
