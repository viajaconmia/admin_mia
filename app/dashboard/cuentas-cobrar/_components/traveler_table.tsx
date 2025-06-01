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
import type { Agente } from "@/app/_types";

export function TravelerTable({ agentes }: { agentes: Agente[] }) {
  const [travelers, setTravelers] = useState<Agente[]>(agentes);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agente</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Restante por cobrar</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha creado</TableHead>
          {/* <TableHead className="text-right">Acciones</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {travelers.map((traveler) => (
          <TableRow key={traveler.id_credito}>
            <TableCell className="font-medium">
              {`${traveler.nombre_agente}`}
            </TableCell>
            <TableCell>{traveler.concepto}</TableCell>
            <TableCell>{traveler.total_credito}</TableCell>
            <TableCell>{traveler.pendiente_por_cobrar}</TableCell>
            <TableCell>
                {traveler.estado_solicitud}
            </TableCell>
            <TableCell>
              {new Date(traveler.fecha_credito).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
