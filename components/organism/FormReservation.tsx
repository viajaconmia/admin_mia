import React, { useState, useEffect, FormEvent } from "react";
import { differenceInDays, parseISO, set } from "date-fns";
import Button from "@/components/atom/Button";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCreateReservaFromSolicitud,
  fetchCreateReservaOperaciones,
  updateReserva,
} from "@/services/reservas";
import {
  ComboBox,
  DateInput,
  Dropdown,
  DropdownValues,
  NumberInput,
  TextInput,

} from "@/components/atom/Input";
import { fetchViajerosFromAgent } from "@/services/viajeros";
import { Hotel, Solicitud, ReservaForm, Viajero, EdicionForm } from "@/types";
import { Table } from "../Table";
import { formatNumberWithCommas, getEstatus } from "@/helpers/utils";
import { updateRoom } from "@/lib/utils";
import { CreditCard, CheckCircle2, BadgeDollarSign, Wallet } from "lucide-react";
import { InputRadio } from "@/components/atom/Input";

// Definir tipos para métodos de pago
type MetodoPago = "wallet" | "credito";

interface MetodoPagoInfo {
  id: MetodoPago;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const metodos_pago: MetodoPagoInfo[] = [
  {
    id: "wallet",
    label: "Wallet",
    icon: Wallet,
    color: "bg-green",
    description: "Saldo a favor disponible",
  },
  {
    id: "credito",
    label: "Credito",
    icon: BadgeDollarSign,
    color: "bg-yellow",
    description: "Credito disponible",
  },
];

interface PaymentTerminalProps {
  total: number;
  onConfirmPayment: () => void;
}

const PaymentTerminal: React.FC<PaymentTerminalProps> = ({
  total,
  onConfirmPayment,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<MetodoPago | null>(null);

  const handleConfirmPayment = () => {
    if (selectedPaymentMethod) {
      onConfirmPayment();
    }
  };

  const metodosPagoJSX = metodos_pago.map((metodo) => (
    <InputRadio
      key={metodo.id}
      item={metodo}
      name="metodo_pago"
      onChange={() => setSelectedPaymentMethod(metodo.id)}
      selectedItem={selectedPaymentMethod}
      disabled={false}
    />
  ));

  return (
    <div className="bg-white rounded-t-lg p-4 shadow-xl border border-gray-300 sticky bottom-0 z-10 mt-6">
      <div className="flex justify-between items-center text-2xl font-bold mb-4">
        <span>Total:</span>
        <span className="text-sky-700">${total.toFixed(2)}</span>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 gap-3">
          {metodos_pago.map((metodo) => {
            const isSelected = selectedPaymentMethod === metodo.id;
            const selectedClass = isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : '';

            return (
              <div
                key={metodo.id}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${metodo.color} ${selectedClass}`}
                onClick={() => setSelectedPaymentMethod(metodo.id)}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 mb-2">
                  <metodo.icon size={20} />
                </div>
                <span className="text-sm font-medium text-center">{metodo.label}</span>
                <span className="text-xs text-center mt-1 opacity-80">{metodo.description}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Button
            className="w-full"
            variant="primary"
            icon={CheckCircle2}
            onClick={handleConfirmPayment}
            disabled={!selectedPaymentMethod}
          >
            Pagar con {selectedPaymentMethod === 'wallet' ? 'Wallet' : 'Tarjeta'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ReservationFormProps {
  solicitud?: Solicitud;
  hotels: Hotel[];
  onClose: () => void;
  edicion?: boolean;
  create?: boolean;
}

export function ReservationForm({
  solicitud,
  hotels,
  onClose,
  edicion = false,
  create = false,
}: ReservationFormProps) {
  let currentNoches = 0;
  let currentHotel;

  if (solicitud.check_in && solicitud.check_out) {
    currentHotel = hotels.filter(
      (item) => item.nombre_hotel == solicitud?.hotel
    )[0];
    currentNoches = differenceInDays(
      parseISO(solicitud.check_out),
      parseISO(solicitud.check_in)
    );
  }

  const [form, setForm] = useState<ReservaForm>({
    hotel: {
      name: solicitud.hotel || "",
      content: currentHotel || null,
    },
    habitacion: updateRoom(solicitud.room) || "",
    check_in: solicitud.check_in ? solicitud.check_in.split("T")[0] : "",
    check_out: solicitud.check_out ? solicitud.check_out.split("T")[0] : "",
    codigo_reservacion_hotel: solicitud.codigo_reservacion_hotel || "",
    viajero: {
      nombre_completo: "",
    },
    noches: currentNoches,
    venta: {
      total: Number(solicitud.total) || 0,
      subtotal: Number(solicitud.total) * 0.84 || 0,
      impuestos: Number(solicitud.total) * 0.16 || 0,
      markup: 0,
    },
    estado_reserva: getEstatus(solicitud.status) as
      | "Confirmada"
      | "En proceso"
      | "Cancelada",
    comments: solicitud.comments || "",
    proveedor: {
      total:
        // ① Si la solicitud viene con costo_total, úsalo
        solicitud.costo_total != null
          ? Number(solicitud.costo_total)
          : // ② Si no, cae al cálculo automático de antes
          Number(
            Number(
              currentHotel?.tipos_cuartos.find(
                (item) =>
                  item.nombre_tipo_cuarto == updateRoom(solicitud.room)
              )?.costo ?? 0
            ) * currentNoches
          ) || 0,
      subtotal: 0,
      impuestos: 0,
    },
    impuestos: {
      iva:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "iva")?.porcentaje
        ) || 0,
      ish:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "ish")?.porcentaje
        ) || 0,
      otros_impuestos:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "otros_impuestos")
            .monto
        ) || 0,
      otros_impuestos_porcentaje:
        Number(
          currentHotel?.impuestos.find(
            (item) => item.name == "otros_impuestos_porcentaje"
          )?.porcentaje
        ) || 0,
    },
    items: [],
    solicitud: {
      ...solicitud,
      viajeros_adicionales: solicitud.viajeros_adicionales || [],
    },
  });
  const [habitaciones, setHabitaciones] = useState(
    currentHotel?.tipos_cuartos || []
  );
  const [edicionForm, setEdicionForm] = useState<EdicionForm>({
    estado_reserva: {
      before: null,
      current: form.estado_reserva,
    },
    metadata: solicitud,
  });
  const [loading, setLoading] = useState(false);
  const [travelers, setTravelers] = useState<Viajero[]>([]);
  const [activeTab, setActiveTab] = useState("cliente");
  const [isCostoManual, setIsCostoManual] = useState(
    () =>
      Number(solicitud.costo_total) !==
      getAutoCostoTotal(
        currentHotel as Hotel,
        updateRoom(solicitud.room),
        currentNoches
      )
  );

  useEffect(() => {
    console.log(form);
  }, [form]);

  useEffect(() => {
    try {
      fetchViajerosFromAgent(solicitud.id_agente, (data) => {
        const viajeroFiltrado = data.filter(
          (viajero) => viajero.id_viajero == solicitud.id_viajero
        );
        if (viajeroFiltrado.length > 0) {
          setForm((prev) => ({ ...prev, viajero: viajeroFiltrado[0] }));
        }
        setTravelers(data);
      });
    } catch (error) {
      console.log(error);
      setTravelers([]);
    }
  }, []);

  useEffect(() => {
    if (
      form.hotel.content &&
      form.check_in &&
      form.check_out &&
      form.habitacion
    ) {
      const nights = differenceInDays(
        parseISO(form.check_out),
        parseISO(form.check_in)
      );

      const roomPrice = Number(
        form.hotel.content.tipos_cuartos.find(
          (item) => item.nombre_tipo_cuarto == form.habitacion
        )?.precio
      );

      // Función para calcular items basados en el costo total
      const calculateItems = (total: number) => {
        const costoBase = total - form.impuestos.otros_impuestos * nights;
        const { subtotal, impuestos } = Object.keys(form.impuestos).reduce(
          (acc, key) => {
            const value = form.impuestos[key as keyof ReservaForm["impuestos"]];
            if (key == "otros_impuestos") {
              return acc;
            } else {
              return {
                subtotal: acc.subtotal - (costoBase * value) / 100,
                impuestos: acc.impuestos + (costoBase * value) / 100,
              };
            }
          },
          { subtotal: costoBase || 0, impuestos: 0 }
        );

        return Array.from({ length: nights }, (_, index) => ({
          noche: index + 1,
          costo: {
            total: Number((total / nights || 0).toFixed(2)),
            subtotal: Number((subtotal / nights || 0).toFixed(2)),
            impuestos: Number((impuestos / nights || 0).toFixed(2)),
          },
          venta: {
            total: Number(roomPrice),
            subtotal: Number((roomPrice * 0.84).toFixed(2)),
            impuestos: Number((roomPrice * 0.16).toFixed(2)),
          },
          impuestos: Object.keys(form.impuestos)
            .map((key) => {
              const value = Number(
                form.impuestos[key as keyof ReservaForm["impuestos"]]
              );
              if (value <= 0) return null;
              const base = Number(
                (total / nights - form.impuestos.otros_impuestos).toFixed(2)
              );
              const totalTax =
                key !== "otros_impuestos"
                  ? Number(((base * value) / 100).toFixed(2))
                  : value;
              return {
                name: key,
                rate: key !== "otros_impuestos" ? value : 0,
                tipo_impuesto: "c",
                monto: key === "otros_impuestos" ? value : 0,
                base: key === "otros_impuestos" ? base + value : base,
                total: totalTax,
              };
            })
            .filter(Boolean),
        }));
      };

      // Calcular el total automático si no es modo manual
      const autoTotal = isCostoManual
        ? form.proveedor.total
        : Number(
          form.hotel.content.tipos_cuartos.find(
            (item) => item.nombre_tipo_cuarto == form.habitacion
          )?.costo ?? 0
        ) * nights;

      const items = calculateItems(autoTotal);

      // Actualizar estado
      setForm((prev) => ({
        ...prev,
        proveedor: {
          ...prev.proveedor,
          total: autoTotal,
          subtotal: Number(
            (autoTotal - form.impuestos.otros_impuestos * nights).toFixed(2)
          ),
          impuestos: Number(
            (form.impuestos.otros_impuestos * nights).toFixed(2)
          ),
        },
        venta: {
          total: Number((roomPrice * nights).toFixed(2) || 0),
          subtotal: Number((roomPrice * nights * 0.84).toFixed(2) || 0),
          impuestos: Number((roomPrice * nights * 0.16).toFixed(2) || 0),
          markup: Number(
            (
              ((roomPrice * nights - autoTotal) / (roomPrice * nights)) *
              100
            ).toFixed(2)
          ),
        },
        items: autoTotal > 0 ? items : [],
        noches: Number(nights),
      }));

      // Lógica para edición
      if (edicion) {
        setEdicionForm((prev) => ({
          ...prev,
          proveedor: {
            before: {
              ...form.proveedor,
              subtotal: form.proveedor.subtotal,
              impuestos: form.proveedor.impuestos,
            },
            current: {
              ...form.proveedor,
              total: autoTotal,
              subtotal: Number(
                (autoTotal - form.impuestos.otros_impuestos * nights).toFixed(2)
              ),
              impuestos: Number(
                (form.impuestos.otros_impuestos * nights).toFixed(2)
              ),
            },
          },
          venta: {
            before: {
              ...form.venta,
              total: form.venta.total,
              subtotal: form.venta.subtotal,
              impuestos: form.venta.impuestos,
              markup: form.venta.markup,
            },
            current: {
              ...form.venta,
              total: Number((roomPrice * nights).toFixed(2) || 0),
              subtotal: Number((roomPrice * nights * 0.84).toFixed(2) || 0),
              impuestos: Number((roomPrice * nights * 0.16).toFixed(2) || 0),
              markup: Number(
                (
                  ((roomPrice * nights - autoTotal) / (roomPrice * nights)) *
                  100
                ).toFixed(2)
              ),
            },
          },
          items: {
            before: form.items,
            current: autoTotal > 0 ? items : [],
          },
          noches: {
            before: form.noches,
            current: Number(nights),
          },
        }));
      }
    }
  }, [
    form.check_in,
    form.check_out,
    form.impuestos,
    form.habitacion,
    form.hotel,
    form.proveedor.total,
    isCostoManual,
    edicion,
  ]);

  const handleSubmit = (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    if (edicion) {
      updateReserva(edicionForm, solicitud.id_booking, (data) => {
        if (data.error) {
          alert("Error al actualizar la reserva");
          setLoading(false);
          return;
        }
        alert("Reserva actualizada correctamente");
        onClose();
        setLoading(false);
        console.log(data);
      });
    } else if (create) {
      fetchCreateReservaOperaciones(form, (data) => {
        console.log(data);
        if (data.error) {
          alert("ERROR");
          setLoading(false);
          return;
        }
        alert("Se creo correctamente la reservación");
        setLoading(false);
        onClose();
      });
    } else {
      fetchCreateReservaFromSolicitud(form, (data) => {
        if (data.error) {
          alert("Error al crear la reserva");
          setLoading(false);
          return;
        }
        alert("Reserva creada correctamente");
        setLoading(false);
        onClose();
      });
    }
  };

  function getAutoCostoTotal(
    hotel: Hotel | null,
    habitacion: string,
    noches: number
  ) {
    if (!hotel) return 0;
    return (
      Number(
        hotel.tipos_cuartos.find(
          (item) => item.nombre_tipo_cuarto === habitacion
        )?.costo ?? 0
      ) * noches
    );
  }

  const handleConfirmPayment = () => {
    console.log("Pago confirmado");
    // Aquí puedes agregar la lógica para procesar el pago
    alert("Pago procesado exitosamente");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 mx-5 overflow-y-auto rounded-md bg-white p-4"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[80vw]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="proveedor">Proveedor</TabsTrigger>
        </TabsList>

        <TabsContent value="cliente" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ComboBox
                label={`Hotel`}
                sublabel={`(${solicitud.hotel})`}
                onChange={(value) => {
                  setIsCostoManual(false); // Agrega esto aquí
                  if ("tipos_cuartos" in value.content) {
                    setHabitaciones((value.content as Hotel).tipos_cuartos);
                  }
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      hotel: {
                        before: {
                          name: form.hotel.name,
                          content: form.hotel.content as Hotel,
                        },
                        current: {
                          name: value.name,
                          content: value.content as Hotel,
                        },
                      },
                    }));
                  }
                  setForm((prev) => {
                    const hotelContent = value.content as Hotel;
                    // Build impuestos object with all required keys
                    const impuestosObj = {
                      iva:
                        Number(
                          hotelContent.impuestos.find(
                            (item) => item.name === "iva"
                          )?.porcentaje
                        ) || 0,
                      ish:
                        Number(
                          hotelContent.impuestos.find(
                            (item) => item.name === "ish"
                          )?.porcentaje
                        ) || 0,
                      otros_impuestos:
                        Number(
                          hotelContent.impuestos.find(
                            (item) => item.name === "otros_impuestos"
                          )?.monto
                        ) || 0,
                      otros_impuestos_porcentaje:
                        Number(
                          hotelContent.impuestos.find(
                            (item) => item.name === "otros_impuestos_porcentaje"
                          )?.porcentaje
                        ) || 0,
                    };
                    return {
                      ...prev,
                      hotel: {
                        name: value.name,
                        content: hotelContent,
                      },
                      proveedor: {
                        ...prev.proveedor,
                        total:
                          Number(
                            hotelContent.tipos_cuartos.find(
                              (item) =>
                                item.nombre_tipo_cuarto ==
                                updateRoom(prev.habitacion)
                            )?.costo ?? 0
                          ) * prev.noches || 0,
                      },
                      impuestos: impuestosObj,
                    };
                  });
                }}
                value={{
                  name: form.hotel.name,
                  content: form.hotel.content as Hotel,
                }}
                options={hotels.map((item) => ({
                  name: item.nombre_hotel,
                  content: item,
                }))}
                placeholderOption={solicitud.hotel}
              />
              <div>
                <DropdownValues
                  label="Tipo de Habitación"
                  onChange={(value) => {
                    setIsCostoManual(false); // El usuario editó manualmente
                    if (edicion) {
                      setEdicionForm((prev) => ({
                        ...prev,
                        habitacion: {
                          before: form.habitacion,
                          current: value.value,
                        },
                      }));
                    }
                    setForm((prev) => ({ ...prev, habitacion: value.value }));
                  }}
                  options={
                    habitaciones.map((item) => ({
                      value: item.nombre_tipo_cuarto,
                      label: `${item.nombre_tipo_cuarto} $${item.precio}`,
                    })) || []
                  }
                  value={form.habitacion}
                />
                <div className="text-xs mt-2">
                  {Boolean(
                    form.hotel.content?.tipos_cuartos.find(
                      (item) => item.nombre_tipo_cuarto === form.habitacion
                    )?.incluye_desayuno
                  ) ? (
                    <p className="text-green-800 p-1  px-3 rounded-full bg-green-200 w-fit border border-green-300">
                      Incluye desayuno
                    </p>
                  ) : (
                    <p className="text-red-800 p-1 px-3 rounded-full bg-red-200 w-fit border border-red-300">
                      No incluye desayuno
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Dropdown
                label="Estado de la reserva"
                onChange={(value) => {
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      estado_reserva: {
                        before: form.estado_reserva,
                        current: value as
                          | "Confirmada"
                          | "Cancelada"
                          | "En proceso",
                      },
                    }));
                  }
                  setForm((prev) => ({
                    ...prev,
                    estado_reserva: value as
                      | "Confirmada"
                      | "Cancelada"
                      | "En proceso",
                  }));
                }}
                options={["Confirmada", "Cancelada", "En proceso"]}
                value={form.estado_reserva}
              />
              <TextInput
                onChange={(value) => {
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      codigo_reservacion_hotel: {
                        before: form.codigo_reservacion_hotel,
                        current: value,
                      },
                    }));
                  }
                  setForm((prev) => ({
                    ...prev,
                    codigo_reservacion_hotel: value,
                  }));
                }}
                value={form.codigo_reservacion_hotel}
                label="Codigo reservación de hotel"
              />
            </div>

            <div className="space-y-2">
              <DateInput
                label="Check-in"
                value={form.check_in}
                onChange={(value) => {
                  setIsCostoManual(false); // Volver a cálculo automático
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      check_in: {
                        before: form.check_in,
                        current: value,
                      },
                    }));
                  }
                  setForm((prev) => ({ ...prev, check_in: value }));
                }}
              />
              <DateInput
                label="Check-out"
                value={form.check_out}
                onChange={(value) => {
                  setIsCostoManual(false);
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      check_out: {
                        before: form.check_out,
                        current: value,
                      },
                    }));
                  }
                  setForm((prev) => ({ ...prev, check_out: value }));
                }}
              />
              {form.solicitud.viajeros_adicionales.map((viajero, index) => (
                <div key={index}>
                  <Label>{`Acompañante ${index + 1}`}</Label>
                  <TextInput
                    value={
                      travelers.find((item) => item.id_viajero === viajero)
                        ?.nombre_completo || ""
                    }
                    disabled
                    onChange={(value) => {
                      console.log("Viajero adicional:", value);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <ComboBox
                label={`Viajeros`}
                sublabel={`(${solicitud.nombre_viajero || solicitud.nombre_viajero_completo
                  } - ${solicitud.id_viajero})`}
                onChange={(value) => {
                  if (edicion) {
                    setEdicionForm((prev) => ({
                      ...prev,
                      viajero: {
                        before: form.viajero,
                        current: value.content as Viajero,
                      },
                    }));
                  }
                  setForm((prev) => ({
                    ...prev,
                    viajero: value.content as Viajero,
                  }));
                }}
                value={{
                  name: form.viajero.nombre_completo || "",
                  content: form.viajero || null,
                }}
                options={travelers.map((item) => ({
                  name: item.nombre_completo,
                  content: item,
                }))}
              />
              <div className="space-y-2">
                <Label>Comentarios de la reserva</Label>
                <Textarea
                  onChange={(e) => {
                    if (edicion) {
                      setEdicionForm((prev) => ({
                        ...prev,
                        comments: {
                          before: form.comments,
                          current: e.target.value,
                        },
                      }));
                    }
                    setForm((prev) => ({ ...prev, comments: e.target.value }));
                  }}
                  value={form.comments}
                ></Textarea>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proveedor" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <NumberInput
                  value={form.proveedor.total}
                  onChange={(value) => {
                    setIsCostoManual(true); // El usuario editó manualmente
                    if (edicion) {
                      setEdicionForm((prev) => ({
                        ...prev,
                        proveedor: {
                          before: { ...form.proveedor },
                          current: {
                            ...form.proveedor,
                            total: Number(value),
                          },
                        },
                      }));
                    }
                    setForm((prev) => ({
                      ...prev,
                      proveedor: { ...prev.proveedor, total: Number(value) },
                    }));
                  }}
                  label="Costo total"
                />
              </div>

              {Object.keys(form.impuestos).map((key) => (
                <NumberInput
                  value={form.impuestos[key as keyof ReservaForm["impuestos"]]}
                  key={key}
                  onChange={(value) => {
                    if (edicion) {
                      setEdicionForm((prev) => ({
                        ...prev,
                        impuestos: {
                          before: {
                            ...form.impuestos,
                          },
                          current: {
                            ...form.impuestos,
                            [key]: Number(value),
                          },
                        },
                      }));
                    }
                    setForm((prev) => ({
                      ...prev,
                      impuestos: { ...prev.impuestos, [key]: Number(value) },
                    }));
                  }}
                  label={key.replace(/_/g, " ").toUpperCase()}
                />
              ))}
            </div>
            <div className="w-xl overflow-auto">
              <Table
                registros={
                  form.items.map((item) => ({
                    noche: item.noche,
                    ...item.impuestos.reduce((acc, tax) => {
                      acc[tax.name] = tax.total;
                      return acc;
                    }, {}),
                    costo_subtotal: item.costo.subtotal,
                    costo: item.costo.total,
                    venta: item.venta.total,
                  })) || []
                }
                exportButton={false}
                renderers={{
                  noche: (props: any) => (
                    <span title={props.value}>{props.value}</span>
                  ),
                  costo_subtotal: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  costo: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  venta: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  iva: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  ish: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  otros_impuestos: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  otros_impuestos_porcentaje: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                  total_impuestos_costo: (props: any) => (
                    <span title={props.value}>
                      ${formatNumberWithCommas(props.value?.toFixed(2) || "")}
                    </span>
                  ),
                }}
                defaultSort={{ key: "noche", sort: true }}
              />
            </div>
            {form.items.length > 0 && (
              <div className="w-full p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Resumen:
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Total venta:</span>
                    <span className="text-gray-900 font-semibold">
                      ${formatNumberWithCommas(form.venta.total.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Costo base:</span>
                    <span className="text-gray-900 font-semibold">
                      ${formatNumberWithCommas(form.proveedor.total.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2 font-medium text-gray-700">
                    <span>Markup:</span>
                    <span className="text-gray-900">
                      {form.venta.markup.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Terminal de pago simplificada */}
      <PaymentTerminal
        total={form.venta.total}
        onConfirmPayment={handleConfirmPayment}
      />

      <DialogFooter>
        <Button disabled={!!loading} type="submit">
          {edicion ? "Actualizar Reserva" : "Crear Reserva"}
        </Button>
      </DialogFooter>
    </form>
  );
}