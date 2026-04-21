import Button from "@/components/atom/Button";
import {
  HotelPermitido,
  HotelPermitidoDTO,
  mapHotelPermitido,
} from "@/services/ExtraServices";
import { Precio } from "@/v3/atom/TableItemsComponent";

export type HotelEditableData = {
  id: number;
  zona: string;
  priority: number;
  is_allowed: boolean;
};

export type HotelPermitidoItem = Omit<
  HotelPermitido,
  | "id_agente"
  | "razon_social"
  | "rfc"
  | "id_hotel"
  | "Ciudad_Zona"
  | "tipo_hospedaje"
  | "calificacion"
  | "score_operaciones"
  | "cliente_nombre"
> & {
  acciones: HotelEditableData;
};

export const mapHotelPermitidoItem = (
  hotel: HotelPermitidoDTO,
): HotelPermitidoItem => {
  const {
    id_agente,
    razon_social,
    rfc,
    id_hotel,
    Ciudad_Zona,
    tipo_hospedaje,
    calificacion,
    score_operaciones,
    cliente_nombre,
    ...hotelPermitido
  } = mapHotelPermitido(hotel);
  return {
    ...hotelPermitido,
    acciones: {
      id: hotel.id,
      zona: hotel.zona,
      priority: hotel.priority,
      is_allowed: hotel.is_allowed === 1,
    },
  };
};

export const createHotelRenderers = ({
  onVerDetalle,
  onEditar,
}: {
  onVerDetalle: (hotel: HotelPermitido) => void;
  onEditar: (data: HotelEditableData) => void;
}) => {
  return {
    precio_sencilla: ({ value }: { value: number }) => (
      <Precio value={value.toString()} />
    ),

    is_allowed: ({ value }: { value: boolean }) => (
      <span>{value ? "✅" : "❌"}</span>
    ),

    activo: ({ value }: { value: boolean }) => (
      <span>{value ? "Activo" : "Inactivo"}</span>
    ),

    calificacion: ({ value }: { value: number | null }) => (
      <span>{value ?? "—"}</span>
    ),

    acciones: ({ value }: { value: HotelEditableData }) => (
      <Button size="sm" variant="secondary" onClick={() => onEditar(value)}>
        Editar
      </Button>
    ),
  };
};
