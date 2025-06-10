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
import type { Company } from "@/types/_types";
import { API_KEY } from "../../../../constant/constants/constantes";

export function CompanyTable() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(
          "https://miaback.vercel.app/v1/mia/empresas",
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
        const json = await response.json();
        console.log(json);
        if (json.error) {
          throw new Error("Error fetching companies");
        }
        setCompanies(json || []);
      } catch (error) {
        setCompanies([]);
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Razón Social</TableHead>
          <TableHead>RFC</TableHead>
          <TableHead>Nombre Comercial</TableHead>
          <TableHead>Código Postal</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id_empresa}>
            <TableCell className="font-medium">
              {company.razon_social}
            </TableCell>
            <TableCell>{company.rfc}</TableCell>
            <TableCell>{company.nombre_comercial}</TableCell>
            <TableCell>{company.codigo_postal_fiscal}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  company.status === "active"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {company.status === "active" ? "Activa" : "Inactiva"}
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
