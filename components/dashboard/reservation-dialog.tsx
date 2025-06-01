'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: any;
  mode: 'edit' | 'view';
}

export function ReservationDialog({
  open,
  onOpenChange,
  reservation,
  mode
}: ReservationDialogProps) {
  const [status, setStatus] = useState(reservation?.status || 'pending');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se implementará la lógica de actualización
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Reserva' : 'Detalles de Reserva'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Modifica los detalles de la reserva y su estado actual.'
              : 'Información detallada de la reserva.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Cliente
              </Label>
              <Input
                id="name"
                defaultValue={reservation?.customerName}
                className="col-span-3"
                disabled={mode === 'view'}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={reservation?.customerEmail}
                className="col-span-3"
                disabled={mode === 'view'}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                defaultValue={reservation?.customerPhone}
                className="col-span-3"
                disabled={mode === 'view'}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Fecha
              </Label>
              <Input
                id="date"
                type="datetime-local"
                defaultValue={reservation?.date}
                className="col-span-3"
                disabled={mode === 'view'}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Nota
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="col-span-3"
                placeholder="Agregar una nota administrativa..."
                disabled={mode === 'view'}
              />
            </div>
          </div>
          <DialogFooter>
            {mode === 'edit' && (
              <Button type="submit">Guardar Cambios</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}