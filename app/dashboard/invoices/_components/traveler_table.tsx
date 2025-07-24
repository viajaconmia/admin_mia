"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  Link,
} from "lucide-react";
import type { Factura } from "@/types/_types";
import useApi from "@/hooks/useApi";
import Modal from "@/components/organism/Modal";
import { API_KEY, URL } from "@/lib/constants";

function FacturaDetails({ setModal, id_factura }) {
  const [facturaData, setFacturaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${URL}/mia/factura/getDetailsFactura?id_factura=${encodeURIComponent(
          id_factura
        )}`,
        {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFacturaData(data);
    } catch (error) {
      console.error("Error al cargar los detalles de factura:", error);
      setError(error.message);
      setFacturaData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id_factura) {
      fetchFacturas();
    }
  }, [id_factura]);

  return (
    <Modal
      onClose={() => setModal("")}
      title="Detalles de factura"
      subtitle="Reservas relacionadas a la factura"
    >
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>Cargando detalles...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4">
          Error al cargar los detalles: {error}
        </div>
      ) : facturaData.length === 0 ? (
        <div className="p-4 text-gray-500">
          No se encontraron detalles para esta factura
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto px-4">
          {/* Listado de reservas */}
          <div className="flex flex-col gap-5 mb-8">
            {facturaData.map((reserva, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                {/* Encabezado de reserva */}
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <h3 className="m-0 text-base font-medium text-gray-800">
                    {reserva.nombre_hotel}
                  </h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    {reserva.tipo_cuarto}
                  </span>
                </div>

                {/* Cuerpo de reserva */}
                <div className="p-4">
                  {/* Información básica */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Noches facturadas:
                      </p>
                      <p className="text-sm font-medium">
                        {reserva.noches_facturadas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Código Reserva:
                      </p>
                      <p className="text-sm font-medium">
                        {reserva.codigo_reservacion_hotel || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Noches:</p>
                      <p className="text-sm font-medium">{reserva.noches}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Fecha de emisión:
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(reserva.fecha_uso).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <h4 className="mt-0 mb-3 text-sm font-semibold">Montos</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Subtotal:</p>
                        <p className="text-sm">
                          ${parseFloat(reserva.subtotal_booking).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impuestos:</p>
                        <p className="text-sm">
                          ${parseFloat(reserva.impuestos_booking).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total:</p>
                        <p className="text-sm font-semibold text-blue-700">
                          ${parseFloat(reserva.total_booking).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comentarios */}
                  {reserva.comments && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Comentarios:</p>
                      <p className="text-sm italic">{reserva.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Resumen de Factura</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm font-medium">
                  $
                  {facturaData
                    .reduce(
                      (sum, item) =>
                        sum +
                        parseFloat(item.subtotal) *
                          parseFloat(item.noches_facturadas),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Impuestos:</span>
                <span className="text-sm font-medium">
                  $
                  {facturaData
                    .reduce(
                      (sum, item) =>
                        sum +
                        parseFloat(item.impuestos) *
                          parseFloat(item.noches_facturadas),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold">Total Factura:</span>
                <span className="font-semibold text-blue-700">
                  $
                  {facturaData
                    .reduce(
                      (sum, item) =>
                        sum +
                        parseFloat(item.total) *
                          parseFloat(item.noches_facturadas),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function TravelerTable({ facturas }: { facturas: Factura[] }) {
  const { mandarCorreo, descargarFactura, descargarFacturaXML } = useApi();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadXML = (obj: any) => {
    if (!obj) return;

    // Obtener el contenido XML (que está en base64)
    // const base64Content = typeof obj === "string" ? obj : obj.Content;

    // Decodificar de base64 a string
    // const decodedContent = atob(base64Content);

    // Crear el Blob con el tipo MIME correcto para XML
    // Crear el enlace de descarga
    const downloadLink = document.createElement("a");

    downloadLink.href = `data:application/xml;base64,${obj.Content}`;
    downloadLink.download = `factura_${new Date().getTime()}.xml`; // Nombre con timestamp para evitar caché
    document.body.appendChild(downloadLink); // Necesario para Firefox
    downloadLink.click();

    // Limpieza
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      // URL.revomeObjectURL(url);
    }, 100);
  };

  const handleDownloadPDF = (obj: any) => {
    if (!obj) return;

    const linkSource = `data:application/pdf;base64,${obj.Content}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = "factura.pdf";
    downloadLink.click();
  };

  const handleDescargarFactura = async (id: string, tipo: string) => {
    console.log(id);
    if (tipo == "pdf") {
      try {
        const obj = await descargarFactura(id);
        handleDownloadPDF(obj);
      } catch (error) {
        alert("Ha ocurrido un error al descargar la factura");
      }
    } else {
      try {
        const obj = await descargarFacturaXML(id);
        handleDownloadXML(obj);
      } catch (error) {
        console.log(error);
        alert("Ha ocurrido un error al descargar la factura");
      }
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Id Facturama</TableHead>
          <TableHead>Total Factura</TableHead>
          <TableHead>Subtotal Factura</TableHead>
          <TableHead>Fecha de Emisión</TableHead>
          <TableHead>Metodo de Pago</TableHead>
          <TableHead>Hotel</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {facturas.map((factura) => (
          <>
            <TableRow key={factura.id_factura}>
              <TableCell className="font-medium">
                {`${factura.nombre}`}
              </TableCell>
              <TableCell className="font-medium">
                {`${factura.id_facturama}`}
              </TableCell>
              <TableCell>{factura.total}</TableCell>
              <TableCell>{factura.subtotal}</TableCell>
              <TableCell>
                {new Date(factura.fecha_emision).toLocaleDateString()}
              </TableCell>
              <TableCell>{factura.metodo_de_pago}</TableCell>
              <TableCell>{factura.hotel}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    factura.estado === "Confirmada"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : factura.estado === "Cancelada"
                      ? "bg-red-100 text-red-800 border-red-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }
                >
                  {factura.estado}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsModalOpen(factura.id_factura)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      {!!factura.id_facturama && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              handleDescargarFactura(
                                factura.id_facturama || "",
                                "pdf"
                              );
                            }}
                          >
                            <DownloadCloud className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleDescargarFactura(
                                factura.id_facturama || "",
                                "xml"
                              );
                            }}
                          >
                            <DownloadCloud className="mr-2 h-4 w-4" />
                            Descargar XML
                          </DropdownMenuItem>
                        </>
                      )}
                      {!!factura.url_pdf && (
                        <>
                          <DropdownMenuItem>
                            <Link className="mr-2 h-4 w-4" />
                            <a target="_blank" href={factura.url_pdf}>
                              Ver PDF
                            </a>
                          </DropdownMenuItem>
                        </>
                      )}
                      {!!factura.url_xml && (
                        <>
                          <DropdownMenuItem>
                            <Link className="mr-2 h-4 w-4" />
                            <a target="_blank" href={factura.url_xml}>
                              Ver XML
                            </a>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
            {isModalOpen === factura.id_factura && (
              <FacturaDetails
                setModal={setIsModalOpen}
                id_factura={factura.id_factura}
              />
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
