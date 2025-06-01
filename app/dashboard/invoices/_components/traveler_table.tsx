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
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import type { Factura } from "@/app/_types";

export function TravelerTable({ facturas }: { facturas: Factura[] }) {
  const [invoices, setinvoices] = useState<Factura[]>(facturas);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Id Agente</TableHead>
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
        {invoices.map((factura) => (
          <TableRow key={factura.id_factura}>
            <TableCell className="font-medium">
              {`${factura.usuario_creador}`}
            </TableCell>
            <TableCell className="font-medium">
              {`${factura.id_facturama}`}
            </TableCell>
            <TableCell>{factura.total_factura}</TableCell>
            <TableCell>{factura.subtotal_factura}</TableCell>
            <TableCell>
              {new Date(factura.fecha_emision).toLocaleDateString()}
            </TableCell>
            <TableCell>{factura.metodo_de_pago}</TableCell>
            <TableCell>{factura.hotel}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  factura.estado_factura === "Confirmada"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : factura.estado_factura === "Cancelada" 
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }
              >
                {factura.estado_factura}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
