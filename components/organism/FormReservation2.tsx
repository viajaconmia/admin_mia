import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { differenceInDays, parseISO } from "date-fns";
import Button from "@/components/atom/Button";
import { Label } from "@/components/ui/label";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateReserva, new_edit } from "@/services/reservas";
import { MostrarSaldos } from "@/components/template/MostrarSaldos";
import { isValid } from "date-fns";
import { EnvioPago, SubmitPayload } from "@/components/template/MostrarSaldos";
import {
  CheckboxInput,
  ComboBox,
  DateInput,
  Dropdown,
  DropdownValues,
  NumberInput,
  TextInput,
} from "@/components/atom/Input";
import { fetchViajerosFromAgent } from "@/services/viajeros";
import { Hotel, ReservaForm, Viajero, EdicionForm, Solicitud2 } from "@/types";
import { Table } from "../Table";
import {
  calcularNoches,
  formatNumberWithCommas,
  getEstatus,
  separarCostos,
} from "@/helpers/utils";
import { updateRoom } from "@/lib/utils";
import Modal from "./Modal";
import EditPrecioVenta from "./EditPrecioVenta";
import { redondear } from "@/helpers/formater";

interface ReservationFormProps {
  solicitud?: Solicitud2 & { nuevo_incluye_desayuno?: boolean | null };
  hotels: Hotel[];
  onClose: () => void;
  edicion?: boolean;
}

export function ReservationForm2({
  solicitud,
  hotels,
  onClose,
  edicion = false,
}: ReservationFormProps) {
  let currentNoches = 0;
  let currentHotel;
  console.log("raro", hotels);
  if (solicitud.check_in && solicitud.check_out) {
    currentHotel = hotels.filter(
      (item) => item.id_hotel == solicitud?.id_hotel
    )[0];
    currentNoches = differenceInDays(
      parseISO(solicitud.check_out),
      parseISO(solicitud.check_in)
    );
  }

  const [nuevo_incluye_desayuno, setNuevoIncluyeDesayuno] = useState<
    boolean | null
  >(
    solicitud.nuevo_incluye_desayuno === null
      ? null
      : Boolean(solicitud.nuevo_incluye_desayuno)
  );

  const [acompanantes, setAcompanantes] = useState<Viajero[]>([]);
  const [cobrar, setCobrar] = useState<boolean | null>(null);
  const [id_agente, setId_agente] = useState<string | null>(null);
  const [reservaData, setReservaData] = useState<any>(null);
  const [precio, setPrecio] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [pagoSeleccion, setPagoSeleccion] = useState<any>(null);
  const [form, setForm] = useState<ReservaForm>({
    hotel: {
      name: solicitud.hotel_reserva || "",
      content: currentHotel || null,
    },
    habitacion: updateRoom(solicitud.tipo_cuarto) || "",
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
    estado_reserva: getEstatus(solicitud.status_reserva) as
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
                    item.nombre_tipo_cuarto == updateRoom(solicitud.tipo_cuarto)
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
      viajeros_adicionales: solicitud.viajeros_acompañantes || [],
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
        updateRoom(solicitud.tipo_cuarto),
        currentNoches
      )
  );
  const [inicial, setInicial] = useState(true);

  useEffect(() => {
    console.log("Edicion FORM", edicionForm, viajero);
    setId_agente(edicionForm.metadata.id_agente || null);
    setPrecio(Number(edicionForm.metadata.total) || 0);
  }, [form]);

  const handleSaldosSubmit = async (saldos, restante, usado) => {
    const data = {
      ...edicionForm,
      nuevo_incluye_desayuno,
      acompanantes,
      saldos,
      restante,
      usado,
    };
    console.log("Saldos para pagar:", saldos, restante, usado);
    setPagoSeleccion({ saldos, restante, usado });
    await new_edit(data, solicitud.id_booking);
    console.log("infoenviada", data);
    // handleSubmit(reservaData);
    setOpen(false);
    // 1) Ensambla la base actual de la reserva (estado más reciente)
    // const baseReserva = {
    //   ...edicionForm,
    //   nuevo_incluye_desayuno,
    //   acompanantes,
    //   id_booking: solicitud.id_booking,
    // };

    // 2) Arma el objeto final que quieres enviar al backend
    //    Incluye el flujo/mode (editar/normal), el pago y, si aplica, la reserva del payload
    // const dataCompleta: any = {
    //   ...baseReserva,
    //   flujo: payload.modo,     // "editar" | "normal"
    //   pago: payload.pago,      // { saldos, faltante, isPrimary }
    // };

    // if (payload.modo === "editar") {
    //   dataCompleta.reserva = payload.reserva; // Solo si existe
    // }

    // 3) Guarda en tu estado para que quede listo para enviarse
    // setReservaData(dataCompleta);

    // 4) (Opcional) Aquí puedes disparar la llamada al backend si quieres enviarlo ya:
    //   - Si ya guardaste la edición: puedes mandar el pago
    //   - Si necesitas cerrar modal o navegar, hazlo aquí
    // console.log("DATA LISTA PARA ENVIAR:", dataCompleta);
    // Si quieres cerrar el modal al confirmar:
  };

  useEffect(() => {
    try {
      fetchViajerosFromAgent(solicitud.id_agente, (data) => {
        const viajeroFiltrado = data.filter(
          (viajero) => viajero.id_viajero == solicitud.id_viajero_reserva
        );
        if (viajeroFiltrado.length > 0) {
          setForm((prev) => ({ ...prev, viajero: viajeroFiltrado[0] }));
        }
        const id_acompanantes = (
          solicitud.viajeros_adicionales_reserva || ""
        ).split(",");
        const acompanantesFiltrados = data.filter((viajero) =>
          id_acompanantes.includes(viajero.id_viajero)
        );
        setAcompanantes(acompanantesFiltrados);
        setTravelers(data);
        // console.log(data);
      });
    } catch (error) {
      console.log(error);
      setTravelers([]);
    }
  }, []);

  const viajero = travelers[0];
  console.log("viajero", viajero);
  console.log("solicitud", travelers);

  const handleData = () => {
    const data = { ...edicionForm, nuevo_incluye_desayuno, acompanantes };
    setReservaData(data);
    setOpen(true);
    console.log("reserfa", reservaData);
  };

  // ⬇️ NUEVO: factoriza la lógica de guardado para reusarla
  const saveReservation = async (): Promise<boolean> => {
    setLoading(true);
    const data = { ...edicionForm, nuevo_incluye_desayuno, acompanantes };
    try {
      if (edicion) {
        await updateReserva(data, solicitud.id_booking);
      }
      const data2 = {
        ...data,
        id_booking: solicitud.id_booking,
        saldos: pagoSeleccion,
      };
      setReservaData(data2);
      console.log("reserfa34344", reservaData);
      // Usa tu notificador si quieres; dejé alert por conservar tu flujo
      alert("Reserva actualizada correctamente");
      return true;
    } catch (error) {
      console.error(error);
      alert("Error al guardar la reserva");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const safeParse = (d?: string) => (d ? parseISO(d) : new Date("Invalid"));
  const ci = safeParse(form.check_in);
  const co = safeParse(form.check_out);
  const nights =
    isValid(ci) && isValid(co) ? Math.max(0, differenceInDays(co, ci)) : 0;

  const roomPrice = Number(
    form.hotel?.content?.tipos_cuartos?.find(
      (item) => item.nombre_tipo_cuarto === form.habitacion
    )?.precio ?? 0
  );

  // Función para calcular items basados en el costo total
  const calculateItems = (total: number) => {
    if (!nights || nights <= 0 || !Number.isFinite(total)) return [];

    const costoBase = total - Number(form.impuestos.otros_impuestos) * nights;
    const { subtotal, impuestos } = (
      Object.keys(form.impuestos) as Array<keyof ReservaForm["impuestos"]>
    ).reduce(
      (acc, key) => {
        const value = Number(form.impuestos[key]) || 0;
        if (key === "otros_impuestos") return acc; // fijo ya restado
        return {
          subtotal: acc.subtotal - (costoBase * value) / 100,
          impuestos: acc.impuestos + (costoBase * value) / 100,
        };
      },
      { subtotal: Math.max(0, costoBase) || 0, impuestos: 0 }
    );

    return Array.from({ length: nights }, (_, index) => {
      const basePorNoche = Number(
        (total / nights - Number(form.impuestos.otros_impuestos)).toFixed(2)
      );
      const impuestosPorNoche = (
        Object.keys(form.impuestos) as Array<keyof ReservaForm["impuestos"]>
      )
        .map((key) => {
          const value = Number(form.impuestos[key]) || 0;
          if (value <= 0) return null;
          const totalTax =
            key !== "otros_impuestos"
              ? Number(((basePorNoche * value) / 100).toFixed(2))
              : value;
          return {
            name: key,
            rate: key !== "otros_impuestos" ? value : 0,
            tipo_impuesto: "c",
            monto: key === "otros_impuestos" ? value : 0,
            base:
              key === "otros_impuestos" ? basePorNoche + value : basePorNoche,
            total: totalTax,
          };
        })
        .filter(Boolean) as any[];

      return {
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
        impuestos: impuestosPorNoche,
      };
    });
  };

  useEffect(() => {
    if (inicial) {
      setInicial(false);
      return;
    }
    console.log("EJECUTANDOME");
    if (
      form.hotel.content &&
      form.check_in &&
      form.check_out &&
      form.habitacion
    ) {
      console.log("ESTOY HACIENDO CAMBIOS");

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
              total: Number(separarCostos(roomPrice * nights).total),
              subtotal: Number(separarCostos(roomPrice * nights).subtotal),
              impuestos: Number(separarCostos(roomPrice * nights).impuestos),
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
    edicion,
  ]);
  // const handleSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   const data = { ...edicionForm, nuevo_incluye_desayuno, acompanantes };
  //   console.log(data);
  //   try {
  //     let response;
  //     if (edicion) {
  //       response = await updateReserva(data, solicitud.id_booking);
  //     }
  //     console.log(response);
  //     alert("Reserva creada correctamente");
  //     // onClose();
  //   } catch (error) {
  //     console.error(error);
  //     alert("Error al guardar la reserva");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: FormEvent) => {
    await saveReservation();
    console.log("reserva", form);
    // onClose(); // si deseas cerrar siempre al guardar manual, descomenta
  };

  const handleConfirmPrecio = async (ctx: {
    tipo: "credito" | "wallet" | "regreso";
    diferencia: number;
    precioActualizado: number;
    metodo_wallet?: "transferencia" | "tarjeta" | "wallet";
    extra?: any;
  }) => {
    // 1) Guarda la edición de la reserva
    const ok = await saveReservation();

    // 2) Opcionalmente puedes tomar decisiones según el tipo
    // console.log("Confirmación de precio:", ctx);

    if (ok) {
      // setCobrar(false);
      setOpen(false); // cierra el modal de precio
      onClose(); // cierra el formulario si así lo quieres
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

  // const hotelDat() => {
  // }
  console.log("form", form);

  const hotelData = useMemo(() => {
    const roomType = form.habitacion || "";
    const roomObj = form.hotel?.content?.tipos_cuartos?.find(
      (t) => t.nombre_tipo_cuarto === roomType
    );

    return {
      "tipo-habi": roomType, // SENCILLO / DOBLE, etc.
      precio: Number(roomObj?.precio ?? 0), // Precio de venta de ese tipo de cuarto
      hotel: form.hotel?.name || "",
      form,
      nuevo_incluye_desayuno,
      acompanantes,
      noches: {
        ...edicionForm.noches,
        before: calcularNoches(solicitud.check_in, solicitud.check_out),
      },
      // Si quieres repetir la clave como pediste:
      // "tipo-habi-2": roomType,
    };
  }, [
    form.habitacion,
    form.hotel,
    form.noches,
    nuevo_incluye_desayuno,
    acompanantes,
    edicionForm.noches,
    solicitud.check_in,
    solicitud.check_out,
  ]);

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
                sublabel={`(${solicitud.hotel_reserva})`}
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
                placeholderOption={solicitud.hotel_reserva}
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
                    // onChange={(value) => {
                    //   setForm((prev) => ({
                    //     ...prev,
                    //     viajeros_adicionales: prev.viajeros_adicionales.map((v, i) =>
                    //       i === index ? { ...v, nombre: value } : v
                    //     ),
                    //   }));
                    // }}
                  />
                </div>
              ))}
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

            <div className="space-y-2">
              <div className="text-xs mt-2">
                <div className="space-y-2">
                  {nuevo_incluye_desayuno == null && (
                    <>
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
                    </>
                  )}

                  {nuevo_incluye_desayuno == null ? (
                    <>
                      <CheckboxInput
                        checked={nuevo_incluye_desayuno}
                        label="Sobre escribir manualmente el desayuno"
                        onChange={(value) => {
                          setNuevoIncluyeDesayuno(
                            !form.hotel.content?.tipos_cuartos.find(
                              (item) =>
                                item.nombre_tipo_cuarto === form.habitacion
                            )?.incluye_desayuno
                          );
                        }}
                      />
                      <p className="text-gray-800 p-1  px-3 rounded-full bg-gray-200 w-fit border border-gray-300">
                        Al guardar la reserva el valor se quedara al del hotel
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckboxInput
                        checked={nuevo_incluye_desayuno}
                        label="incluye desayuno"
                        onChange={(value) => {
                          setNuevoIncluyeDesayuno(value);
                        }}
                      />
                      {nuevo_incluye_desayuno ? (
                        <p className="text-green-800 p-1  px-3 rounded-full bg-green-200 w-fit border border-green-300">
                          Incluira desayuno al guardar aun si el hotel dice que
                          no incluye
                        </p>
                      ) : (
                        <p className="text-red-800 p-1 px-3 rounded-full bg-red-200 w-fit border border-red-300">
                          No incluira el desayuno en el hotel aun si en el hotel
                          dice que lo incluye
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <ComboBox
                label={`Viajeros`}
                sublabel={`(${solicitud.nombre_viajero_reservacion} - ${solicitud.id_viajero_reserva})`}
                onChange={(value) => {
                  setEdicionForm((prev) => ({
                    ...prev,
                    viajero: {
                      before: form.viajero,
                      current: value.content as Viajero,
                    },
                  }));

                  setForm((prev) => ({
                    ...prev,
                    viajero: value.content as Viajero,
                  }));
                }}
                value={{
                  name: form.viajero.nombre_completo || "",
                  content: form.viajero || null,
                }}
                options={[...travelers]
                  .filter(
                    (traveler) =>
                      !acompanantes
                        .map((item) => item.id_viajero)
                        .includes(traveler.id_viajero)
                  )
                  .map((item) => ({
                    name: item.nombre_completo,
                    content: item,
                  }))}
              />

              <div className="space-y-2">
                {acompanantes.map((acompanante, index) => {
                  return (
                    <ComboBox
                      key={acompanante.id_viajero}
                      label={`Acompañante - ${index + 1}`}
                      onDelete={() => {
                        const newAcompanantes = [...acompanantes].toSpliced(
                          index,
                          1
                        );
                        console.log(newAcompanantes);
                        setAcompanantes(newAcompanantes);
                      }}
                      onChange={(value) => {
                        const newAcompanantesList = [...acompanantes];
                        newAcompanantesList[index] = value.content as Viajero;
                        setAcompanantes(newAcompanantesList);
                      }}
                      value={{
                        name: acompanante.nombre_completo || "",
                        content: acompanante || null,
                      }}
                      options={[...travelers]
                        .filter(
                          (traveler) =>
                            (!acompanantes
                              .map((item) => item.id_viajero)
                              .includes(traveler.id_viajero) &&
                              traveler.id_viajero != form.viajero.id_viajero) ||
                            traveler.id_viajero == acompanante.id_viajero
                        )
                        .map((item) => ({
                          name: item.nombre_completo,
                          content: item,
                        }))}
                    />
                  );
                })}
                {travelers.length > acompanantes.length + 1 && (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        const filtrados = [...travelers].filter(
                          (traveler) =>
                            !acompanantes
                              .map((item) => item.id_viajero)
                              .includes(traveler.id_viajero) &&
                            traveler.id_viajero != form.viajero.id_viajero
                        );
                        const nuevoArray = [...acompanantes, filtrados[0]];
                        setAcompanantes(nuevoArray);
                      }}
                    >
                      Agregar acompañante
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3">
            <NumberInput
              label="Precio a cliente"
              value={precio}
              onChange={(value: string) => setPrecio(Number(value))}
            />
            <Button
              className="md:col-start-3"
              type="button"
              onClick={() => {
                setActiveTab("proveedor");
              }}
            >
              Continuar
            </Button>
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
                    const items = calculateItems(Number(value));
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
                        items: {
                          before: form.items,
                          current: items.length > 0 ? items : [],
                        },
                      }));
                    }
                    setForm((prev) => ({
                      ...prev,
                      proveedor: { ...prev.proveedor, total: Number(value) },
                      items: items.length > 0 ? items : [],
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
                    // costo_impuestos: item.costo.impuestos,
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
                  // costo_impuestos: (props: any) => (
                  //   <span title={props.value}>
                  //     ${formatNumberWithCommas(props.value.toFixed(2))}
                  //   </span>
                  // ),
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
                  {/* <div className="flex justify-between border-t pt-2 mt-2 font-medium text-gray-700">
                    <span>Ganancia:</span>
                    <span className="text-gray-900">
                      ${(form.venta.total - form.proveedor.total).toFixed(2)}
                      </span>
                  </div> */}
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
          <div>
            <Button
              type="button"
              icon={CheckCircle}
              onClick={() => {
                handleData(); // guarda los datos
                // abre el modal o lo que sea
              }}
            >
              Ir a pagar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      {cobrar && (
        <Modal
          onClose={() => {
            setCobrar(false);
          }}
          title={`Maneja el precio de la reserva`}
          subtitle="Modifica los valores de los items para poder tener el valor total de venta"
        >
          <EditPrecioVenta
            reserva={solicitud}
            hotelData={hotelData}
            onClose={() => {
              setCobrar(false);
            }}
            onConfirm={handleConfirmPrecio}
            precioNuevo={
              edicionForm?.venta?.current?.total
                ? Number(edicionForm.venta.current.total)
                : Number(solicitud.total) || 0
            }
          ></EditPrecioVenta>
        </Modal>
      )}
      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
          }}
          title="Selecciona con que pagar"
          subtitle="Puedes escoger solo algunos y pagar lo restante con credito"
        >
          <MostrarSaldos
            id_agente={id_agente as string}
            precio={redondear(precio - Number(solicitud.total))}
            reserva_Data={reservaData} // si ya guardaste antes, se manda; si no, irá undefined
            loading={loading}
            onSubmit={handleSaldosSubmit}
          />
        </Modal>
      )}
    </form>
  );
}
