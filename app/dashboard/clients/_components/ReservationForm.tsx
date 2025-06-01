"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Building2, Calendar, CreditCard } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { useParams } from "next/navigation";
import { fetchCreateReserva } from "@/services/reservas";
import { Hotel } from "@/types";

interface Tax {
  id_impuesto: number;
  name: string;
  rate: number;
  mount: number;
  base: number;
  total: number;
}

interface NightCost {
  night: number;
  baseCost: number;
  taxes: Tax[];
  totalWithTaxes: number;
}

interface PaymentMethod {
  type: "spei" | "credit_card" | "balance";
  paymentDate: string;
  cardLastDigits?: string;
  comments: string;
}

interface Room {
  id_tipo_cuarto: number;
  nombre_tipo_cuarto: string;
  id_tarifa: number;
  precio: string;
  id_agente: null | string;
}

interface Traveler {
  id_viajero: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  created_at: string;
  updated_at: string;
  nacionalidad: string | null;
  numero_pasaporte: string | null;
  numero_empleado: string | null;
}

interface ReservationFormProps {
  hotels: Hotel[];
  travelers: Traveler[];
}

const DEFAULT_TAXES = [
  {
    id: 1,
    selected: false,
    descripcion: "IVA (16%)",
    name: "IVA",
    rate: 0.16,
    mount: 0,
  },
  {
    id: 2,
    selected: false,
    descripcion: "ISH (3%)",
    name: "ISH",
    rate: 0.03,
    mount: 0,
  },
  {
    id: 3,
    selected: false,
    descripcion: "Saneamiento ($32)",
    name: "Saneamiento",
    rate: 0,
    mount: 32,
  },
];

export function ReservationForm({ hotels, travelers }: ReservationFormProps) {
  const [activeTab, setActiveTab] = useState("cliente");
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedTraveler, setSelectedTraveler] = useState<string>("");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [totalSalePrice, setTotalSalePrice] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalCostWithTaxes, setTotalCostWithTaxes] = useState<number>(0);
  const [nights, setNights] = useState<NightCost[]>([]);
  const [reservationStatus, setReservationStatus] = useState("Confirmada");
  const [hotelReservationCode, setHotelReservationCode] = useState("");
  const [enabledTaxes, setEnabledTaxes] = useState(DEFAULT_TAXES);
  const { client } = useParams();
  const [customTaxes, setCustomTaxes] = useState<
    { name: string; rate: number }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: "spei",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    comments: "",
  });

  const selectedHotelData = hotels.find((h) => h.id_hotel === selectedHotel);
  const selectedRoomData = selectedHotelData?.tipos_cuartos.find(
    (r) => r.id_tipo_cuarto.toString() === selectedRoom
  );

  useEffect(() => {
    if (checkIn && checkOut && selectedRoomData) {
      const nightsCount = differenceInDays(
        parseISO(checkOut),
        parseISO(checkIn)
      );
      const roomPrice = parseFloat(selectedRoomData.precio);
      setTotalSalePrice(roomPrice * nightsCount);
      calculateNightlyCosts(nightsCount, roomPrice);
    }
  }, [checkIn, checkOut, selectedRoomData, enabledTaxes]);
  useEffect(() => {
    calculateNightlyCosts(nights.length, totalCost);
  }, [enabledTaxes]);

  const calculateNightlyCosts = (nightsCount: number, baseCost: number) => {
    if (nightsCount > 0 && baseCost > 0) {
      const taxFilter = enabledTaxes.filter((tax) => tax.selected);
      const newNights: NightCost[] = Array.from(
        { length: nightsCount },
        (_, index) => ({
          night: index + 1,
          baseCost: baseCost / nightsCount,
          taxes: taxFilter.map(({ id, name, rate, mount }) => ({
            id_impuesto: id,
            name,
            rate,
            mount,
            base: baseCost / nightsCount,
            total: (baseCost / nightsCount) * rate + mount,
          })),
          totalWithTaxes: taxFilter.reduce(
            (prev, current) =>
              prev + ((baseCost / nightsCount) * current.rate + current.mount),
            baseCost / nightsCount
          ),
        })
      );

      setNights(newNights);
      const totalWithTaxes = newNights.reduce(
        (sum, night) => sum + night.totalWithTaxes,
        0
      );
      setTotalCost(baseCost);
      setTotalCostWithTaxes(totalWithTaxes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nightsCount = differenceInDays(parseISO(checkOut), parseISO(checkIn));
    const reservation = {
      solicitud: {
        confirmation_code: Math.round(Math.random() * 9999999),
        id_viajero: selectedTraveler,
        hotel: selectedHotelData?.nombre_hotel,
        check_in: checkIn,
        check_out: checkOut,
        room: selectedRoomData?.nombre_tipo_cuarto,
        total: totalSalePrice,
        status: "complete",
        id_usuario_generador: client,
      },
      estado: reservationStatus,
      check_in: checkIn,
      check_out: checkOut,
      id_viajero: selectedTraveler,
      id_hotel: selectedHotel,
      nombre_hotel: selectedHotelData?.nombre_hotel,
      total: totalSalePrice,
      subtotal: totalSalePrice / 1.16,
      impuestos: totalSalePrice - totalSalePrice / 1.16,
      tipo_cuarto: selectedRoomData?.nombre_tipo_cuarto,
      noches: nightsCount,
      costo_subtotal: totalCost,
      costo_total: totalCostWithTaxes,
      costo_impuestos: totalCostWithTaxes - totalCost,
      codigo_reservacion_hotel: hotelReservationCode,
      id_usuario_generador: client,
      items: nights.map((night) => ({
        total: totalSalePrice / nightsCount,
        subtotal: (totalSalePrice / nightsCount) * 0.84,
        impuestos: (totalSalePrice / nightsCount) * 0.16,
        costo_total: night.totalWithTaxes,
        costo_subtotal: night.baseCost,
        costo_impuestos: night.totalWithTaxes - night.baseCost,
        costo_iva: night.taxes.find((tax) => tax.name === "IVA")?.total || 0,
        taxes: night.taxes,
      })),
    };

    console.log(reservation);
    try {
      const response = await fetchCreateReserva(reservation);
      alert("creado con exito");
      console.log(response);
    } catch (error) {
      alert("hubo un error");
    }
  };

  const addCustomTax = () => {
    setCustomTaxes([...customTaxes, { name: "", rate: 0 }]);
  };

  const removeCustomTax = (index: number) => {
    setCustomTaxes(customTaxes.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 mx-5 rounded-md shadow-md bg-white p-4"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="proveedor">Proveedor</TabsTrigger>
          <TabsTrigger value="pago">Pago a Proveedor</TabsTrigger>
        </TabsList>

        <TabsContent value="cliente" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hotel</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id_hotel} value={hotel.id_hotel}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {hotel.nombre_hotel || "Hotel sin nombre"} -{" "}
                        {hotel.Ciudad_Zona}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Habitación</Label>
              <Select
                value={selectedRoom}
                onValueChange={setSelectedRoom}
                disabled={!selectedHotel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar habitación" />
                </SelectTrigger>
                <SelectContent>
                  {selectedHotelData?.tipos_cuartos.map((room) => (
                    <SelectItem
                      key={room.id_tipo_cuarto}
                      value={room.id_tipo_cuarto.toString()}
                    >
                      {room.nombre_tipo_cuarto} - ${room.precio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Check-in</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Check-out</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Viajero</Label>
              <Select
                value={selectedTraveler}
                onValueChange={setSelectedTraveler}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar viajero" />
                </SelectTrigger>
                <SelectContent>
                  {travelers.map((traveler) => (
                    <SelectItem
                      key={traveler.id_viajero}
                      value={traveler.id_viajero}
                    >
                      {`${traveler.primer_nombre} ${traveler.apellido_paterno} ${traveler.apellido_materno}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado de la Reserva</Label>
              <Select
                value={reservationStatus}
                onValueChange={setReservationStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                  <SelectItem value="En proceso">En proceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proveedor" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Reserva del Hotel</Label>
                <Input
                  value={hotelReservationCode}
                  onChange={(e) => setHotelReservationCode(e.target.value)}
                  placeholder="Ej: RES123456"
                />
              </div>
              <div className="space-y-2">
                <Label>Costo Subtotal</Label>
                <Input
                  type="number"
                  value={totalCost > 0 ? totalCost : ""}
                  onChange={(e) => {
                    const totalCost = Number(e.target.value);
                    const nightsCount = nights.length;
                    setTotalCost(totalCost);
                    calculateNightlyCosts(nightsCount, totalCost);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {enabledTaxes.map((tax) => (
                <Label key={tax.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={tax.selected}
                    onCheckedChange={(checked) => {
                      setEnabledTaxes(
                        enabledTaxes.map((t) =>
                          t.id === tax.id ? { ...t, selected: !!checked } : t
                        )
                      );
                    }}
                  />
                  <span>{tax.descripcion}</span>
                </Label>
              ))}
              <Button type="button" variant="outline" onClick={addCustomTax}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Impuesto
              </Button>
            </div>

            {customTaxes.map((tax, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Input
                  placeholder="Nombre del impuesto"
                  value={tax.name}
                  onChange={(e) => {
                    const newTaxes = [...customTaxes];
                    newTaxes[index].name = e.target.value;
                    setCustomTaxes(newTaxes);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Tasa (%)"
                  value={tax.rate}
                  onChange={(e) => {
                    const newTaxes = [...customTaxes];
                    newTaxes[index].rate = Number(e.target.value) / 100;
                    setCustomTaxes(newTaxes);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeCustomTax(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {nights.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Noche</TableHead>
                    <TableHead>Costo Base</TableHead>
                    {enabledTaxes
                      .filter((tax) => tax.selected)
                      .map((tax) => (
                        <TableHead key={tax.id}>{tax.descripcion}</TableHead>
                      ))}
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nights.map((night) => (
                    <TableRow key={night.night}>
                      <TableCell>{night.night}</TableCell>
                      <TableCell>${night.baseCost.toFixed(2)}</TableCell>
                      {night.taxes.map((tax) => (
                        <TableCell key={tax.id_impuesto}>
                          ${tax.total.toFixed(2)}
                        </TableCell>
                      ))}
                      <TableCell>${night.totalWithTaxes.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Venta Total:</span>
                <span>${totalSalePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo Total:</span>
                <span>${totalCostWithTaxes.toFixed(2)}</span>
              </div>
              {totalCost > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Markup:</span>
                  <span>
                    {(
                      ((totalSalePrice - totalCostWithTaxes) /
                        totalCostWithTaxes) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pago" className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod.type}
                onValueChange={(value: "spei" | "credit_card" | "balance") =>
                  setPaymentMethod({ ...paymentMethod, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spei">SPEI</SelectItem>
                  <SelectItem value="credit_card">
                    Tarjeta de Crédito
                  </SelectItem>
                  <SelectItem value="balance">Saldo a Favor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={paymentMethod.paymentDate}
                  onChange={(e) =>
                    setPaymentMethod({
                      ...paymentMethod,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {paymentMethod.type === "credit_card" && (
              <div className="space-y-2">
                <Label>Últimos 4 dígitos</Label>
                <div className="relative">
                  <CreditCard className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    maxLength={4}
                    value={paymentMethod.cardLastDigits}
                    onChange={(e) =>
                      setPaymentMethod({
                        ...paymentMethod,
                        cardLastDigits: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Comentarios</Label>
              <Textarea
                value={paymentMethod.comments}
                onChange={(e) =>
                  setPaymentMethod({
                    ...paymentMethod,
                    comments: e.target.value,
                  })
                }
                placeholder="Agregar comentarios sobre el pago..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="submit">Guardar Reserva</Button>
      </DialogFooter>
    </form>
  );
}
