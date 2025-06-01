'use client';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  History 
} from "lucide-react";
import { ReservationDialog } from "./reservation-dialog";

interface ReservationsTableProps {
  status: 'pending' | 'completed';
}

const mockData = [
  {
    id: '1',
    customerName: 'Juan Pérez',
    customerEmail: 'juan@example.com',
    customerPhone: '+34 123 456 789',
    date: new Date().toISOString(),
    status: 'pending',
    history: [
      { date: new Date().toISOString(), from: 'pending', to: 'confirmed', by: 'Admin' }
    ]
  },
  {
    id: '2',
    customerName: 'María García',
    customerEmail: 'maria@example.com',
    customerPhone: '+34 987 654 321',
    date: new Date().toISOString(),
    status: 'completed',
    history: [
      { date: new Date().toISOString(), from: 'pending', to: 'completed', by: 'Admin' }
    ]
  },
];

export function ReservationsTable({ status }: ReservationsTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'view'>('view');

  const filteredData = mockData.filter(reservation => 
    status === 'pending' ? reservation.status === 'pending' : reservation.status === 'completed'
  );

  const handleAction = (action: 'view' | 'edit', reservation: any) => {
    setSelectedReservation(reservation);
    setDialogMode(action);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Reserva</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">#{reservation.id}</TableCell>
                <TableCell>{reservation.customerName}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">{reservation.customerEmail}</div>
                    <div className="text-sm text-muted-foreground">
                      {reservation.customerPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(reservation.date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction('view', reservation)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('edit', reservation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <History className="mr-2 h-4 w-4" />
                        Ver historial
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservation={selectedReservation}
        mode={dialogMode}
      />
    </>
  );
}