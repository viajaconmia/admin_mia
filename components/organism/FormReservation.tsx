import React, { useState, useEffect, FormEvent } from "react";
import { differenceInDays, parseISO, set } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PagarModalComponent } from "@/components/template/pagar_saldo"; // Import the modal
import { fetchAgenteById, fetchPagosByAgente } from "@/services/agentes";
import {
  fetchCreateReservaFromSolicitud,
  fetchCreateReservaOperaciones,
  updateReserva,
  codigo_reserva,
} from "@/services/reservas";
import {
  CheckboxInput,
  ComboBox,
  ComboBox2,
  ComboBoxOption2,
  DateInput,
  Dropdown,
  DropdownValues,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import { fetchViajerosFromAgent } from "@/services/viajeros";
import { Hotel, Solicitud, ReservaForm, Viajero, EdicionForm } from "@/types";
import { Table } from "../Table";
import { formatNumberWithCommas, getEstatus } from "@/helpers/utils";
import { updateRoom } from "@/lib/utils";
import { useNotification } from "@/context/useNotificacion";
import { CreditCard, Wallet } from "lucide-react";
import { useHoteles } from "@/context/Hoteles";
import { Proveedor } from "@/services/ProveedoresService";
import { useProveedor } from "@/context/Proveedores";

interface ReservationFormProps {
  solicitud?: Solicitud & {
    nuevo_incluye_desayuno?: boolean | null;
    agente?: any;
  };
  onClose: () => void;
  edicion?: boolean;
  create?: boolean;
}

export function ReservationForm({
  solicitud,
  onClose,
  edicion = false,
  create = false,
}: ReservationFormProps) {
  let currentNoches = 0;
  let currentHotel;
  const { hoteles: hotels } = useHoteles();

  if (solicitud.check_in && solicitud.check_out) {
    currentHotel = hotels.filter(
      (item) => item.nombre_hotel == solicitud?.hotel,
    )[0];
    currentNoches = differenceInDays(
      parseISO(solicitud.check_out),
      parseISO(solicitud.check_in),
    );
  }
  const [intermediario, setIntermediario] = useState<{
    exists: boolean;
    proveedor: Proveedor | null;
  }>({ exists: false, proveedor: null });
  const [nuevo_incluye_desayuno, setNuevoIncluyeDesayuno] = useState<
    boolean | null
  >(solicitud.nuevo_incluye_desayuno || null);
  const { showNotification } = useNotification();
  const { getProveedores, proveedores } = useProveedor();
  const [acompanantes, setAcompanantes] = useState<Viajero[]>([]);
  const [defaultViajero, setDefaultViajero] = useState<Viajero | null>(null);
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
                    item.nombre_tipo_cuarto == updateRoom(solicitud.room),
                )?.costo ?? 0,
              ) * currentNoches,
            ) || 0,
      subtotal: 0,
      impuestos: 0,
    },
    impuestos: {
      iva:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "iva")
            ?.porcentaje,
        ) || 0,
      ish:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "ish")
            ?.porcentaje,
        ) || 0,
      otros_impuestos:
        Number(
          currentHotel?.impuestos.find((item) => item.name == "otros_impuestos")
            ?.monto,
        ) || 0,
      otros_impuestos_porcentaje:
        Number(
          currentHotel?.impuestos.find(
            (item) => item.name == "otros_impuestos_porcentaje",
          )?.porcentaje,
        ) || 0,
    },
    items: [],
    solicitud: {
      ...solicitud,
      viajeros_adicionales: solicitud.viajeros_adicionales || [],
    },
  });
  const [habitaciones, setHabitaciones] = useState(
    currentHotel?.tipos_cuartos || [],
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
  const [usuarioCreador, setUsuarioCreador] = useState(null);
  const [isCostoManual, setIsCostoManual] = useState(
    () =>
      Number(solicitud.costo_total) !==
      getAutoCostoTotal(
        currentHotel as Hotel,
        updateRoom(solicitud.room),
        currentNoches,
      ),
  );

  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    if (!proveedores) {
      setLoading(true);
      getProveedores().finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    try {
      fetchViajerosFromAgent(solicitud.id_agente, ({ data }) => {
        const viajeroFiltrado = data.filter(
          (viajero) => viajero.id_viajero == solicitud.id_viajero,
        );
        if (viajeroFiltrado.length > 0) {
          setForm((prev) => ({ ...prev, viajero: viajeroFiltrado[0] }));
        }
        setTravelers(data);
      });
    } catch (error) {
      console.log("MANEJANDO ERROR", error);
      showNotification(
        "error",
        error.message || "Error al cargar los viajeros",
      );
      setTravelers([]);
    }
  }, []);

  useEffect(() => {
    try {
      updateAgentWallet();
      fetchViajerosFromAgent(solicitud.id_agente, ({ data }) => {
        const viajeroFiltrado = data.filter(
          (viajero) => viajero.id_viajero == solicitud.id_viajero_reserva,
        );

        // guarda el fallback
        const fallback = viajeroFiltrado[0] ?? null;
        setDefaultViajero(fallback);

        // si está disponible y el form no tiene viajero válido, úsalo
        if (fallback && !form.viajero?.id_viajero) {
          setForm((prev) => ({ ...prev, viajero: fallback }));
        }

        const id_acompanantes = (
          solicitud.viajeros_adicionales_reserva || ""
        ).split(",");
        const acompanantesFiltrados = data.filter((viajero) =>
          id_acompanantes.includes(viajero.id_viajero),
        );
        setAcompanantes(acompanantesFiltrados);
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
        parseISO(form.check_in),
      );

      const roomPrice = Number(
        form.hotel.content.tipos_cuartos.find(
          (item) => item.nombre_tipo_cuarto == form.habitacion,
        )?.precio,
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
          { subtotal: costoBase || 0, impuestos: 0 },
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
                form.impuestos[key as keyof ReservaForm["impuestos"]],
              );
              if (value <= 0) return null;
              const base = Number(
                (total / nights - form.impuestos.otros_impuestos).toFixed(2),
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
              (item) => item.nombre_tipo_cuarto == form.habitacion,
            )?.costo ?? 0,
          ) * nights;

      const items = calculateItems(autoTotal);

      // Actualizar estado
      setForm((prev) => ({
        ...prev,
        proveedor: {
          ...prev.proveedor,
          total: autoTotal,
          subtotal: Number(
            (autoTotal - form.impuestos.otros_impuestos * nights).toFixed(2),
          ),
          impuestos: Number(
            (form.impuestos.otros_impuestos * nights).toFixed(2),
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
            ).toFixed(2),
          ),
        },
        items: autoTotal > 0 ? items : [],
        noches: Number(nights),
      }));
    }
  }, [form.check_in, form.check_out, form.habitacion, form.hotel]);

  // Estado para controlar la visibilidad del modal de pago
  const [showPagarModal, setShowPagarModal] = useState(false);
  // Estado para almacenar los datos de la reserva para el modal
  const [reservaData, setReservaData] = useState<any>(null);
  const isTotalZero = form.venta.total === 0;

  const isFormPrepopulated =
    solicitud.hotel !== null &&
    solicitud.hotel !== undefined &&
    solicitud.hotel !== "";

  // Modificar el handleSubmit para que no guarde automáticamente
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("estoy corriendo?");

    if (isFormPrepopulated) {
      // Lógica para formulario prellenado (edición/creación)
      handleProcessRequest();
    } else {
      // Lógica para formulario vacío (nueva reserva)
      setLoading(true);
      setLoading(false);
    }
  };

  function getAutoCostoTotal(
    hotel: Hotel | null,
    habitacion: string,
    noches: number,
  ) {
    if (!hotel) return 0;
    return (
      Number(
        hotel.tipos_cuartos.find(
          (item) => item.nombre_tipo_cuarto === habitacion,
        )?.costo ?? 0,
      ) * noches
    );
  }

  const updateAgentWallet = async () => {
    try {
      setLoadingWallet(true);
      const agenteActualizado = await fetchAgenteById(solicitud.id_agente);
      const walletAmount = Array.isArray(agenteActualizado)
        ? parseFloat(agenteActualizado[0].wallet)
        : parseFloat(agenteActualizado.wallet);

      setWalletAmount(walletAmount);
      return walletAmount;
    } catch (error) {
      console.error("Error al obtener el saldo wallet:", error);
      showNotification("error", "Error al obtener el saldo wallet");
      return 0;
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleWalletPayment = async () => {
    setLoading(true);

    try {
      const validateReservation = await codigo_reserva(
        form.codigo_reservacion_hotel,
      );

      // 1) Si falta código (tu fetch regresa { error: true, message: "Falta codigo_reserva" })
      if (validateReservation?.error) {
        showNotification(
          "error",
          validateReservation.message || "Falta código de reservación",
        );
        setLoading(false);
        return;
      }

      // 2) Solo bloquear cuando venga EXACTAMENTE duplicado:
      // {"ok":false,"exists":true,"message":"Ya existe"}
      if (
        validateReservation?.ok === false &&
        validateReservation?.exists === true
      ) {
        showNotification(
          "error",
          validateReservation.message || "Ya existe codigo de reservacion",
        );
        setLoading(false);
        return;
      }

      // 3) Continuar flujo normal
      const saldo = await updateAgentWallet();

      if (saldo < form.venta.total) {
        showNotification("error", "Saldo insuficiente en la wallet");
        setLoading(false);
        return;
      }

      const reservaConAgente = {
        ...form,
        id_agente: solicitud.id_agente,
        Total: form.venta.total,
        Noches: form.noches,
        metodoPago: "wallet",
        nuevo_incluye_desayuno,
        acompanantes,
        solicitud,
        intermediario,
      };
      console.log("Ejecutando reserva con wallet");
      setReservaData(reservaConAgente);
      setShowPagarModal(true);
      setLoading(false);
    } catch (error: any) {
      console.error("Error en la reserva:", error);
      showNotification(
        "error",
        error?.message || "Ocurrió un error inesperado.",
      );
      setLoading(false);
    }
  };

  const handleprocesar = async () => {
    fetchCreateReservaFromSolicitud(
      { ...form, nuevo_incluye_desayuno, acompanantes, meta: { ...solicitud } },
      (data) => {
        if (data.error) {
          alert("Error al crear la reserva");
          setLoading(false);
          return;
        }
        alert("Reserva creada correctamente");
        setLoading(false);
        onClose();
      },
    );
  };

  const handleCreditPayment = async () => {
    setLoading(true);
    try {
      const validateReservation = await codigo_reserva(
        form.codigo_reservacion_hotel,
      );
      if (
        validateReservation?.ok === false &&
        validateReservation?.exists === true
      ) {
        showNotification(
          "error",
          validateReservation.message || "Ya existe codigo de reservacion",
        );
        setLoading(false);
        return;
      }
      await fetchCreateReservaOperaciones({
        ...form,
        nuevo_incluye_desayuno,
        acompanantes,
        bandera: 0,
        intermediario,
      })
        .then((data) => {
          alert("Se creo correctamente la reservación");
          setLoading(false);
          onClose();
        })
        .catch((error) => {
          console.error("Error al crear la reserva:", error);
          showNotification(
            "error",
            error.message || "Error al crear la reserva",
          );
          setLoading(false);
        });
    } catch (error) {
      console.error("Error en la reserva:", error);
      showNotification(
        "error",
        error.message || "Ocurrió un error inesperado.",
      );
      setLoading(false);
    }
  };

  // Nueva función para procesar solicitud (formulario prellenado)
  const handleProcessRequest = async () => {
    setLoading(true);
    try {
      console.log("Ejecutando reserva con process request");
      await fetchCreateReservaOperaciones({
        ...form,
        nuevo_incluye_desayuno,
        acompanantes,
        bandera: 0,
        usuarioCreador,
        intermediario,
      })
        .then((data) => {
          alert("Se creo correctamente la reservación");
          setLoading(false);
          onClose();
        })
        .catch((error) => {
          console.error("Error al crear la reserva:", error);
          showNotification(
            "error",
            error.message || "Error al crear la reserva",
          );
          setLoading(false);
        });
    } catch (error) {
      console.error("Error en la reserva:", error);
      showNotification(
        "error",
        error.message || "Ocurrió un error inesperado.",
      );
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 mx-5 overflow-y-auto rounded-md bg-white p-4"
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-[80vw]"
        >
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
                              (item) => item.name === "iva",
                            )?.porcentaje,
                          ) || 0,
                        ish:
                          Number(
                            hotelContent.impuestos.find(
                              (item) => item.name === "ish",
                            )?.porcentaje,
                          ) || 0,
                        otros_impuestos:
                          Number(
                            hotelContent.impuestos.find(
                              (item) => item.name === "otros_impuestos",
                            )?.monto,
                          ) || 0,
                        otros_impuestos_porcentaje:
                          Number(
                            hotelContent.impuestos.find(
                              (item) =>
                                item.name === "otros_impuestos_porcentaje",
                            )?.porcentaje,
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
                                  updateRoom(prev.habitacion),
                              )?.costo ?? 0,
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
                      setForm((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }));
                    }}
                    value={form.comments}
                  ></Textarea>
                  <ComboBox2
                    label="Asignar creación a:"
                    value={
                      usuarioCreador
                        ? {
                            name: usuarioCreador.nombre_completo,
                            content: usuarioCreador,
                          }
                        : { name: "", content: null }
                    }
                    onChange={(opcion) => {
                      console.log(opcion);
                    }}
                    options={travelers
                      .filter((tr) => Boolean(tr.is_user))
                      .map((traveler) => ({
                        name: traveler.nombre_completo,
                        content: traveler,
                      }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs mt-2">
                  <div className="space-y-2">
                    {nuevo_incluye_desayuno == null && (
                      <>
                        {Boolean(
                          form.hotel.content?.tipos_cuartos.find(
                            (item) =>
                              item.nombre_tipo_cuarto === form.habitacion,
                          )?.incluye_desayuno,
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
                                  item.nombre_tipo_cuarto === form.habitacion,
                              )?.incluye_desayuno,
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
                            Incluira desayuno al guardar aun si el hotel dice
                            que no incluye
                          </p>
                        ) : (
                          <p className="text-red-800 p-1 px-3 rounded-full bg-red-200 w-fit border border-red-300">
                            No incluira el desayuno en el hotel aun si en el
                            hotel dice que lo incluye
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <ComboBox
                  label={`Viajeros`}
                  sublabel={`(${solicitud.nombre_viajero} - ${solicitud.id_viajero})`}
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
                  options={[...travelers]
                    .filter(
                      (traveler) =>
                        !acompanantes
                          .map((item) => item.id_viajero)
                          .includes(traveler.id_viajero),
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
                        key={index}
                        label={`Acompañante - ${index + 1}`}
                        onDelete={() => {
                          const newAcompanantes = [...acompanantes].toSpliced(
                            index,
                            1,
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
                                traveler.id_viajero !=
                                  form.viajero.id_viajero) ||
                              traveler.id_viajero == acompanante.id_viajero,
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
                              traveler.id_viajero != form.viajero.id_viajero,
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
                <div className="flex justify-between border-t pt-2 mt-2 font-medium text-lg text-blue-700 bg-blue-50 p-2 rounded-md">
                  <NumberInput
                    label="Precio de reserva"
                    value={Number(form.venta.total.toFixed(2))}
                    onChange={(value) => {
                      const nights = differenceInDays(
                        parseISO(form.check_out),
                        parseISO(form.check_in),
                      );

                      const roomPrice = Number(
                        (Number(value) / nights).toFixed(2),
                      );

                      const costo_total = form.proveedor.total;

                      // Función para calcular items basados en el costo total
                      const calculateItems = (total: number) => {
                        const costoBase =
                          costo_total - form.impuestos.otros_impuestos * nights;
                        const { subtotal, impuestos } = Object.keys(
                          form.impuestos,
                        ).reduce(
                          (acc, key) => {
                            const value =
                              form.impuestos[
                                key as keyof ReservaForm["impuestos"]
                              ];
                            if (key == "otros_impuestos") {
                              return acc;
                            } else {
                              return {
                                subtotal:
                                  acc.subtotal - (costoBase * value) / 100,
                                impuestos:
                                  acc.impuestos + (costoBase * value) / 100,
                              };
                            }
                          },
                          { subtotal: costoBase || 0, impuestos: 0 },
                        );

                        return Array.from({ length: nights }, (_, index) => ({
                          noche: index + 1,
                          costo: {
                            total: Number(
                              (costo_total / nights || 0).toFixed(2),
                            ),
                            subtotal: Number(
                              (subtotal / nights || 0).toFixed(2),
                            ),
                            impuestos: Number(
                              (impuestos / nights || 0).toFixed(2),
                            ),
                          },
                          venta: {
                            total: Number(roomPrice),
                            subtotal: Number((roomPrice / 1.16).toFixed(2)),
                            impuestos: Number(
                              (roomPrice - roomPrice / 1.16).toFixed(2),
                            ),
                          },
                          impuestos: Object.keys(form.impuestos)
                            .map((key) => {
                              const value = Number(
                                form.impuestos[
                                  key as keyof ReservaForm["impuestos"]
                                ],
                              );
                              if (value <= 0) return null;
                              const base = Number(
                                (
                                  total / nights -
                                  form.impuestos.otros_impuestos
                                ).toFixed(2),
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
                                base:
                                  key === "otros_impuestos"
                                    ? base + value
                                    : base,
                                total: totalTax,
                              };
                            })
                            .filter(Boolean),
                        }));
                      };

                      const items = calculateItems(Number(value));
                      //VUENO
                      setForm((prev) => ({
                        ...prev,
                        venta: {
                          ...prev.venta,
                          total: Number(value),
                          subtotal: Number((Number(value) / 1.16).toFixed(2)),
                          impuestos: Number(
                            (Number(value) - Number(value) / 1.16).toFixed(2),
                          ),
                        },
                        items,
                      }));
                    }}
                  ></NumberInput>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3">
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
              <div className="grid gap-2 md:grid-cols-3">
                <TextInput
                  value={""}
                  label="Comentarios internos noktos"
                  onChange={function (value: string): void {
                    console.log(intermediario);
                    alert("Function not implemented.");
                  }}
                ></TextInput>
                <div className="flex p-2 items-end h-full w-full">
                  <CheckboxInput
                    label={"Tiene intermediario?"}
                    checked={intermediario.exists}
                    onChange={function (checked: boolean): void {
                      setIntermediario((prev) => ({
                        ...prev,
                        exists: checked,
                      }));
                    }}
                  />
                </div>
                <div>
                  {intermediario.exists && (
                    <ComboBox2
                      value={
                        intermediario.proveedor
                          ? {
                              name: intermediario.proveedor.proveedor,
                              content: intermediario.proveedor,
                            }
                          : null
                      }
                      label="Intermediario"
                      options={proveedores.map((p) => ({
                        name: p.proveedor,
                        content: p,
                      }))}
                      onChange={function (
                        value: ComboBoxOption2<Proveedor>,
                      ): void {
                        setIntermediario((prev) => ({
                          ...prev,
                          proveedor: value.content,
                        }));
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <NumberInput
                    value={form.proveedor.total}
                    onChange={(value) => {
                      setIsCostoManual(true); // El usuario editó manualmente
                      const nights = differenceInDays(
                        parseISO(form.check_out),
                        parseISO(form.check_in),
                      );

                      const roomPrice = Number(
                        (Number(form.venta.total) / nights).toFixed(2),
                      );

                      const costo_total = Number(value);

                      // Función para calcular items basados en el costo total
                      const calculateItems = (total: number) => {
                        const costoBase =
                          costo_total - form.impuestos.otros_impuestos * nights;
                        const { subtotal, impuestos } = Object.keys(
                          form.impuestos,
                        ).reduce(
                          (acc, key) => {
                            const value =
                              form.impuestos[
                                key as keyof ReservaForm["impuestos"]
                              ];
                            if (key == "otros_impuestos") {
                              return acc;
                            } else {
                              return {
                                subtotal:
                                  acc.subtotal - (costoBase * value) / 100,
                                impuestos:
                                  acc.impuestos + (costoBase * value) / 100,
                              };
                            }
                          },
                          { subtotal: costoBase || 0, impuestos: 0 },
                        );

                        return Array.from({ length: nights }, (_, index) => ({
                          noche: index + 1,
                          costo: {
                            total: Number(
                              (costo_total / nights || 0).toFixed(2),
                            ),
                            subtotal: Number(
                              (subtotal / nights || 0).toFixed(2),
                            ),
                            impuestos: Number(
                              (impuestos / nights || 0).toFixed(2),
                            ),
                          },
                          venta: {
                            total: Number(roomPrice),
                            subtotal: Number((roomPrice / 1.16).toFixed(2)),
                            impuestos: Number(
                              (roomPrice - roomPrice / 1.16).toFixed(2),
                            ),
                          },
                          impuestos: Object.keys(form.impuestos)
                            .map((key) => {
                              const value = Number(
                                form.impuestos[
                                  key as keyof ReservaForm["impuestos"]
                                ],
                              );
                              if (value <= 0) return null;
                              const base = Number(
                                (
                                  total / nights -
                                  form.impuestos.otros_impuestos
                                ).toFixed(2),
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
                                base:
                                  key === "otros_impuestos"
                                    ? base + value
                                    : base,
                                total: totalTax,
                              };
                            })
                            .filter(Boolean),
                        }));
                      };

                      const items = calculateItems(form.venta.total);
                      //VUENO
                      setForm((prev) => ({
                        ...prev,
                        proveedor: {
                          ...prev.venta,
                          total: Number(value),
                          subtotal: Number((Number(value) / 1.16).toFixed(2)),
                          impuestos: Number(
                            (Number(value) - Number(value) / 1.16).toFixed(2),
                          ),
                        },
                        items,
                      }));
                    }}
                    label="Costo total"
                  />
                </div>

                {Object.keys(form.impuestos).map((key) => (
                  <NumberInput
                    value={
                      form.impuestos[key as keyof ReservaForm["impuestos"]]
                    }
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
                        $
                        {!props.value
                          ? ""
                          : formatNumberWithCommas(
                              (props.value || 0)?.toFixed(2) || "",
                            )}
                      </span>
                    ),
                    costo: (props: any) => (
                      <span title={props.value}>
                        $
                        {!props.value
                          ? ""
                          : formatNumberWithCommas(
                              (props.value || 0)?.toFixed(2) || "",
                            )}
                      </span>
                    ),
                    venta: (props: any) => (
                      <span title={props.value}>
                        $
                        {!props.value
                          ? ""
                          : formatNumberWithCommas(
                              (props.value || 0)?.toFixed(2) || "",
                            )}
                      </span>
                    ),
                    iva: (props: any) => (
                      <span title={props.value}>
                        $
                        {!props.value
                          ? ""
                          : formatNumberWithCommas(
                              (props.value || 0)?.toFixed(2) || "",
                            )}
                      </span>
                    ),
                    ish: (props: any) => (
                      <span title={props.value}>
                        $
                        {!props.value
                          ? ""
                          : formatNumberWithCommas(
                              (props.value || 0)?.toFixed(2) || "",
                            )}
                      </span>
                    ),
                    otros_impuestos: (props: any) => (
                      <span
                        title={(Math.random() * 99999999).toFixed(0)}
                      ></span>
                    ),
                    otros_impuestos_porcentaje: (props: any) => (
                      <span
                        title={(Math.random() * 99999999).toFixed(0)}
                      ></span>
                    ),
                    total_impuestos_costo: (props: any) => (
                      <span title={props.value}></span>
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
                        $
                        {formatNumberWithCommas(
                          form.proveedor.total.toFixed(2),
                        )}
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
              {isFormPrepopulated ? (
                // Botón para formulario prellenado (edición/creación)
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleprocesar}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  {loading ? "Procesando..." : "Procesar Solicitud"}
                </Button>
              ) : (
                // Botones para formulario vacío (nueva reserva)
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    type="button"
                    disabled={
                      loading ||
                      loadingWallet ||
                      isTotalZero ||
                      walletAmount < form.venta.total
                    }
                    onClick={handleWalletPayment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingWallet ? (
                      <span>Cargando...</span>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Wallet (${walletAmount.toFixed(2)})
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    disabled={
                      loading ||
                      isTotalZero ||
                      solicitud.agente.saldo < form.venta.total
                    }
                    onClick={handleCreditPayment}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Crédito(${solicitud.agente?.saldo || ""})
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {showPagarModal && reservaData && (
        <PagarModalComponent
          onClose={() => setShowPagarModal(false)}
          onEnd={() => {
            setShowPagarModal(false);
            onClose();
          }}
          reservaData={reservaData}
          open={showPagarModal}
        />
      )}
    </>
  );
}
