"use client";

import { API_KEY } from "../../../constants/constantes";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit } from "lucide-react";
import { CreditDialog } from "./credit-dialog";

interface CreditData {
  id_agente: string;
  nombre: string | null;
  tiene_credito_consolidado: number;
  monto_credito_agente: number | null;
  monto_credito_empresa: number | null;
  id_empresa: string;
  tiene_credito: number;
  nombre_comercial: string;
  razon_social: string;
  tipo_persona: string;
}

interface CreditTableProps {
  data: CreditData[];
  searchTerm: string;
  updateData: () => void;
}

export function CreditTable({
  data,
  searchTerm,
  updateData,
}: CreditTableProps) {
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "agente" | "empresa";
    id: string;
    name: string;
    credit: number;
  } | null>(null);

  // Group data by agent
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.id_agente]) {
      acc[item.id_agente] = {
        id: item.id_agente,
        nombre: item.nombre || "Sin nombre",
        tiene_credito_consolidado: item.tiene_credito_consolidado,
        saldo: item.monto_credito_agente,
        empresas: [],
      };
    }
    acc[item.id_agente].empresas.push({
      id_empresa: item.id_empresa,
      nombre_comercial: item.nombre_comercial,
      razon_social: item.razon_social,
      tipo_persona: item.tipo_persona,
      tiene_credito: item.tiene_credito,
      saldo: item.monto_credito_empresa,
    });
    return acc;
  }, {} as Record<string, any>);

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleEdit = (type: "agente" | "empresa", item: any) => {
    setSelectedItem({
      type,
      id: type === "agente" ? item.id : item.id_empresa,
      name: type === "agente" ? item.nombre : item.nombre_comercial,
      credit: item.saldo || 0,
    });
    setDialogOpen(true);
  };

  const handleSaveCredit = (credit: number) => {
    if (selectedItem) {
      fetch(`https://miaback.vercel.app/v1/mia/pagos/${selectedItem.type}`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY || "",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ id: selectedItem.id, credit }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
        })
        .then(() => updateData())
        .catch((error) => {
          console.log(error);
          alert("Parece que hubo un error al editar el credito");
        });
      setDialogOpen(false);
    }
  };

  // Filter data based on search term
  const filteredData = Object.values(groupedData)
    .map((agent) => {
      // Determina el estado del crédito de las empresas del agente
      const allHaveCredit = agent.empresas.every(
        (empresa) => empresa.tiene_credito === 1
      );
      const someHaveCredit = agent.empresas.some(
        (empresa) => empresa.tiene_credito === 1
      );

      let estadoCredito = 0; // Valor por defecto
      if (allHaveCredit) {
        estadoCredito = 2;
      } else if (someHaveCredit) {
        estadoCredito = 1;
      }

      // Agregar la propiedad estado_credito_empresas al agente
      agent.estado_credito_empresas = estadoCredito;

      // Filtrar los agentes según el término de búsqueda
      const searchLower = searchTerm.toLowerCase();
      if (
        agent.nombre.toLowerCase().includes(searchLower) ||
        agent.empresas.some((empresa) =>
          empresa.nombre_comercial.toLowerCase().includes(searchLower)
        )
      ) {
        return agent;
      }
      return null;
    })
    .filter((agent) => agent !== null);

  console.log(filteredData);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Agente</TableHead>
            <TableHead>Crédito Consolidado</TableHead>
            <TableHead>Monto de Crédito</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((agent) => (
            <>
              <TableRow key={agent.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAgent(agent.id)}
                  >
                    {expandedAgents.includes(agent.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{agent.nombre}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      agent.estado_credito_empresas === 2
                        ? "bg-green-100 text-green-800 border-green-200"
                        : agent.estado_credito_empresas === 1
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {agent.estado_credito_empresas === 2
                      ? "Todas"
                      : agent.estado_credito_empresas === 1
                      ? "Algunas"
                      : "Ninguna"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {agent.saldo
                    ? `$${new Intl.NumberFormat("en-US").format(
                        agent.saldo
                      )}`
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("agente", agent)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Crédito
                  </Button>
                </TableCell>
              </TableRow>
              {expandedAgents.includes(agent.id) && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <div className="bg-slate-50 p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Razón Social</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Tiene Crédito</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead className="text-right">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agent.empresas.map((empresa: any) => (
                            <TableRow key={empresa.id_empresa}>
                              <TableCell className="font-medium">
                                {empresa.nombre_comercial}
                              </TableCell>
                              <TableCell>{empresa.razon_social}</TableCell>
                              <TableCell className="capitalize">
                                {empresa.tipo_persona}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    empresa.tiene_credito
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {empresa.tiene_credito ? "Sí" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {empresa.saldo
                                  ? `$${new Intl.NumberFormat("en-US").format(
                                      empresa.saldo
                                    )}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit("empresa", empresa)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Crédito
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      <CreditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSave={handleSaveCredit}
      />
    </>
  );
}
