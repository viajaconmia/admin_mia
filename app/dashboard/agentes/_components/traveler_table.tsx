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
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Verificado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {travelers.map((traveler) => (
          <TableRow key={traveler.id}>
            <TableCell className="font-medium">
              {`${traveler.user_metadata.full_name}`}
            </TableCell>
            <TableCell>{traveler.user_metadata.email}</TableCell>
            <TableCell>{traveler.user_metadata.phone}</TableCell>
            <TableCell>
              {new Date(traveler.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  traveler.user_metadata.email_verified === true
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {traveler.user_metadata.email_verified === true ? "Verificado" : "No verificado"}
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
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
