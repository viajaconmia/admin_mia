"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// dashboard/hoteles/types.ts
export interface FullHotelData {
    id_hotel?: string;
    nombre?: string;
    id_cadena?: number;
    correo?: string;
    telefono?: string;
    rfc?: string;
    razon_social?: string;
    direccion?: string;
    latitud?: string;
    longitud?: string;
    convenio?: string | null;
    descripcion?: string | null;
    calificacion?: number | null;
    tipo_hospedaje?: string;
    cuenta_de_deposito?: string | null;
    Estado?: string;
    Ciudad_Zona?: string;
    NoktosQ?: number;
    NoktosQQ?: number;
    MenoresEdad?: string;
    PaxExtraPersona?: string;
    DesayunoIncluido?: string;
    DesayunoComentarios?: string;
    DesayunoPrecioPorPersona?: string;
    Transportacion?: string;
    TransportacionComentarios?: string;
    URLImagenHotel?: string;
    URLImagenHotelQ?: string;
    URLImagenHotelQQ?: string;
    Activo?: number;
    Comentarios?: string | null;
    Id_Sepomex?: number | null;
    CodigoPostal?: string;
    Id_hotel_excel?: number;
    Colonia?: string;
    precio_sencilla?: number;
    precio_doble?: number;
  }
  
export function HotelDetailDialog({
  open,
  onOpenChange,
  hotel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: FullHotelData | null;
}) {
  if (!hotel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle del hotel</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {hotel.nombre}</p>
          <p><strong>Dirección:</strong> {hotel.direccion}</p>
          <p><strong>Ciudad:</strong> {hotel.Ciudad_Zona}</p>
          <p><strong>Estado:</strong> {hotel.Estado}</p>
          <p><strong>Precio sencilla:</strong> ${hotel.precio_sencilla}</p>
          <p><strong>Precio doble:</strong> ${hotel.precio_doble}</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="destructive">Eliminar</Button>
            <Button>Editar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
