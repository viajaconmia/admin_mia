import React, { useState, useEffect } from "react";
import { differenceInDays, parseISO } from "date-fns";
import Button from "@/components/atom/Button";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { new_edit } from "@/services/reservas";
import { MostrarSaldos } from "@/components/template/MostrarSaldos";
import { isValid } from "date-fns";
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
  formatNumberWithCommas,
  getEstatus,
  separarCostos,
} from "@/helpers/utils";
import { updateRoom } from "@/lib/utils";
import Modal from "./Modal";
import { redondear } from "@/helpers/formater";
import { useNotification } from "@/context/useNotificacion";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

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
  if (solicitud.check_in && solicitud.check_out) {
    currentHotel = hotels.filter(
      (item) => item.id_hotel == solicitud?.id_hotel
    )[0];
    currentNoches = differenceInDays(
      parseISO(solicitud.check_out),
      parseISO(solicitud.check_in)
    );
  }

  const { hasPermission } = usePermiso();
  const [nuevo_incluye_desayuno, setNuevoIncluyeDesayuno] = useState<
    boolean | null
  >(
    solicitud.nuevo_incluye_desayuno === null
      ? null
      : Boolean(solicitud.nuevo_incluye_desayuno)
  );

  const [acompanantes, setAcompanantes] = useState<Viajero[]>([]);
  const [open, setOpen] = useState<boolean>(false);
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
    estado_reserva: getEstatus(solicitud.status_reserva),
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
  const [precio, setPrecio] = useState<number>(form.venta.total);
  const { showNotification } = useNotification();

  const handleSaldosSubmit = async (saldos, restante, usado) => {
    try {
      setLoading(true);
      console.log(
        Number(solicitud.total).toFixed(2) != Number(precio).toFixed(2),
        solicitud.total,
        precio
      );
      const { venta, ...rest } = edicionForm;
      const data = {
        ...rest,
        ...(Number(solicitud.total).toFixed(2) != Number(precio).toFixed(2)
          ? {
              venta: {
                before: {
                  total: Number(solicitud.total).toFixed(2),
                  impuestos: (
                    Number(solicitud.total) -
                    Number(solicitud.total) / 1.16
                  ).toFixed(2),
                  subtotal: (Number(solicitud.total) / 1.16).toFixed(2),
                },
                current: {
                  total: precio.toFixed(2),
                  impuestos: (precio - precio / 1.16).toFixed(2),
                  subtotal: (precio / 1.16).toFixed(2),
                },
              },
            }
          : {
              venta: {
                before: {
                  total: Number(solicitud.total).toFixed(2),
                  impuestos: (
                    Number(solicitud.total) -
                    Number(solicitud.total) / 1.16
                  ).toFixed(2),
                  subtotal: (Number(solicitud.total) / 1.16).toFixed(2),
                },
                current: {
                  total: Number(solicitud.total).toFixed(2),
                  impuestos: (
                    Number(solicitud.total) -
                    Number(solicitud.total) / 1.16
                  ).toFixed(2),
                  subtotal: (Number(solicitud.total) / 1.16).toFixed(2),
                },
              },
            }),
        nuevo_incluye_desayuno,
        acompanantes,
        saldos,
        restante,
      };
      const response = await new_edit(data, solicitud.id_booking);
      console.log("infoenviada", data);

      setOpen(false);
      onClose();
      showNotification("success", response.message);
    } catch (error) {
      console.log(error);
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
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
      const items = calculateItems(Number(solicitud.total));
      setForm((prev) => ({ ...prev, items }));
    } catch (error) {
      console.log(error);
      setTravelers([]);
    }
  }, []);

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
    if (
      form.hotel.content &&
      form.check_in &&
      form.check_out &&
      form.habitacion
    ) {
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

  const mostrarPrecio = () => {
    if (hasPermission(PERMISOS.COMPONENTES.BOTON.EDITAR_PRECIO_RESERVA)) {
      return (
        <div className="flex flex-col gap-2">
          <NumberInput
            label="Precio a cliente"
            value={precio}
            onChange={(value: string) => setPrecio(Number(value))}
          />
          {form.venta.total.toFixed(2) != precio.toFixed(2) && (
            <p
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              onClick={() => {
                setPrecio(form.venta.total);
              }}
            >
              Quieres cambiar el precio al precio sugerido? : $
              {form.venta.total}
            </p>
          )}
        </div>
      );
    } else {
      return <></>;
    }
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
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
            {mostrarPrecio()}
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
          <div>
            <Button
              type="button"
              icon={CheckCircle}
              onClick={() => setOpen(true)}
            >
              Confirmar cambios
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
          }}
          title="Selecciona con que pagar"
          subtitle="Puedes escoger solo algunos y pagar lo restante con credito"
        >
          <MostrarSaldos
            id_agente={solicitud.id_agente}
            precio={redondear(precio - Number(solicitud.total))}
            loading={loading}
            onSubmit={handleSaldosSubmit}
          />
        </Modal>
      )}
    </form>
  );
}
