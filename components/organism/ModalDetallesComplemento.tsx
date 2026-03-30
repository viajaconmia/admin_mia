import { useEffect, useReducer, useState } from "react";
import { Empresa } from "@/services/ExtraServices";
import { SectionForm } from "@/components/atom/SectionForm";
import { CreditCard, File, User2 } from "lucide-react";
import { usosCFDI } from "@/constant";
import * as schema from "@/schemas/tables/complemento_pago";
import { PagosService } from "@/services/PagosService";
import { useAlert } from "@/context/useAlert";
import EmpresasSection from "@/components/molecule/EmpresasSection";
import Button from "@/components/atom/Button";
import Modal from "./Modal";
import { ComboBox2, DateInput, NumberInput, TextInput } from "../atom/Input";
import { Payment, RelatedDocument } from "@/types/ComplementoPago";
import { cfdiReducer, initialState } from "@/reducer/complemento";
import { paymentForms } from "@/constant/complemento";
import { currencies } from "@/constant/moneda";
import { mapOptions, mapValueComboBox } from "@/lib/helpers/reducer";

export const ModalDetallesComplemento = ({
  onClose,
  payment,
}: {
  onClose: () => void;
  payment: schema.SaldoItem;
}) => {
  const [loading, setLoading] = useState(false);
  const [state, dispatcher] = useReducer(cfdiReducer, initialState);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const { error } = useAlert();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const setState = <T,>(path: keyof T, value: any) => {
    dispatcher({
      type: "SET_FIELD",
      path: path as string,
      value,
    });
  };

  const setPayment = (index: number, prop: keyof Payment, value: string) =>
    setState(
      "Complemento.Payments",
      state.Complemento.Payments.map((p, i) =>
        i == index
          ? {
              ...p,
              [prop]: value,
            }
          : p,
      ),
    );

  const setRelatedDocument = (
    indexPago: number,
    indexDocumento: number,
    prop: keyof RelatedDocument,
    value: string,
  ) =>
    setState(
      "Complemento.Payments",
      state.Complemento.Payments.map((p, i) =>
        i == indexPago
          ? {
              ...p,
              RelatedDocuments: p.RelatedDocuments.map((rd, j) =>
                j == indexDocumento
                  ? {
                      ...rd,
                      [prop]: value,
                    }
                  : rd,
              ),
            }
          : p,
      ),
    );

  useEffect(() => {
    console.log(state);
  }, [state]);

  const handleSetEmpresa = (empresa: Empresa) => {
    setEmpresa(empresa);
    setState("Receiver", {
      ...state.Receiver,
      Name: empresa.nombre,
      Rfc: empresa.rfc,
      FiscalRegime: empresa.regimen_fiscal,
      TaxZipCode: empresa.codigo_postal_fiscal,
    });
  };

  useEffect(() => {
    if (!payment) return;
    setLoading(true);
    PagosService.getInstance()
      .obtenerPagoParaComplemento(payment.id_saldos)
      .then(({ data }) => {
        console.log(data);
        dispatcher({ type: "MAP_SALDO_TO_CFDI", payload: data });
      })
      .catch((err) => error(err.message || "Error al obtener los datos"))
      .finally(() => setLoading(false));
  }, [payment]);

  return (
    <>
      {!!payment && (
        <Modal
          onClose={onClose}
          title="Detalles del Complemento de Pago"
          subtitle="Verifica los datos para poder crear el complemento de pago"
        >
          <div className="w-[90vw] max-w-5xl min-h-[200px]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                {!empresa ? (
                  <EmpresasSection
                    id_agente={payment.id_agente}
                    select={empresa}
                    setSelect={handleSetEmpresa}
                    initState={(e: Empresa) => e.rfc == payment.rfc}
                  />
                ) : (
                  <SectionForm
                    legend={"Cliente"}
                    icon={User2}
                    className="bg-blue-50 mt-4 shadow-lg"
                  >
                    <div className=" grid grid-cols-1 md:grid-cols-5 gap-2">
                      <TextInput
                        value={state.Receiver.Name}
                        disabled
                        label="Razon social:"
                      />
                      <TextInput
                        value={state.Receiver.Rfc}
                        disabled
                        label="RFC:"
                      />
                      <ComboBox2
                        options={mapOptions(usosCFDI, "label")}
                        label="Uso de CFDI:"
                        value={mapValueComboBox<{
                          label: string;
                          value: string;
                        }>(
                          usosCFDI.filter(
                            (uc) => uc.value == state.Receiver.CfdiUse,
                          )[0],
                          "label",
                        )}
                        onChange={({ content }) =>
                          setState(
                            "Receiver.CfdiUse",
                            typeof content === "string"
                              ? content
                              : content.value,
                          )
                        }
                      />
                      <TextInput
                        value={state.Receiver.FiscalRegime}
                        disabled
                        label="Regimen fiscal:"
                      />
                      <TextInput
                        value={state.Receiver.TaxZipCode}
                        disabled
                        label="Codigo postal:"
                      />
                    </div>
                  </SectionForm>
                )}
                <SectionForm
                  legend={"Datos de la factura"}
                  icon={File}
                  className="bg-blue-50 shadow-lg flex flex-col gap-4"
                >
                  <div className="w-full grid grid-cols-3 gap-2">
                    <TextInput
                      value={state.ExpeditionPlace}
                      disabled
                      label="Lugar de expedición:"
                    />
                    <TextInput
                      value={state.CfdiType}
                      disabled
                      label="Tipo de CFDI:"
                    />
                    <ComboBox2
                      options={mapOptions(currencies as unknown as string[])}
                      label="Divisa:"
                      value={mapValueComboBox(state.Currency)}
                      onChange={({ content }) => setState("Currency", content)}
                    />
                  </div>
                </SectionForm>
              </div>
              <SectionForm
                legend={"Pagos"}
                icon={CreditCard}
                className="bg-white"
              >
                <form onSubmit={handleSubmit} className="w-full">
                  {state.Complemento.Payments.map((pago, index) => (
                    <div
                      key={index + "_pago_complemento"}
                      className="grid grid-cols-1 md:grid-cols-4 gap-2 gap-y-4"
                    >
                      <NumberInput
                        value={Number(pago.Amount)}
                        label="Monto:"
                        onChange={(value: string) =>
                          setPayment(index, "Amount", value)
                        }
                      />
                      <DateInput
                        value={pago.Date}
                        label="Fecha:"
                        onChange={(value: string) =>
                          setPayment(index, "Date", value)
                        }
                      />
                      <ComboBox2
                        options={mapOptions(paymentForms, "label")}
                        label="Forma de pago:"
                        value={mapValueComboBox(
                          paymentForms.filter(
                            (uc) => uc.value == pago.PaymentForm,
                          )[0],
                          "label",
                        )}
                        onChange={({ content }) =>
                          setPayment(
                            index,
                            "PaymentForm",
                            typeof content === "string"
                              ? content
                              : content.value,
                          )
                        }
                      />
                      <TextInput
                        value={""}
                        label="Concepto de pago:"
                        onChange={(value: string) =>
                          // setPayment(index, "PaymentMethod", value)
                          alert("No sirve este campo, falta agregarlo")
                        }
                      />
                      {pago.RelatedDocuments.map((rd, indexDoc) => (
                        <SectionForm
                          key={indexDoc + "_related_document"}
                          legend={`${indexDoc + 1} Factura`}
                          icon={File}
                          className="bg-white border w-full col-span-4"
                        >
                          <div
                            key={index + "_related_document"}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2"
                          >
                            <NumberInput
                              value={Number(rd.PreviousBalanceAmount)}
                              label="Total de la factura:"
                              disabled
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "PreviousBalanceAmount",
                                  value,
                                )
                              }
                            />
                            <NumberInput
                              value={Number(rd.AmountPaid)}
                              label="Monto pagado:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "AmountPaid",
                                  value,
                                )
                              }
                            />
                            <NumberInput
                              value={Number(rd.ImpSaldoInsoluto)}
                              label="Saldo insoluto:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "ImpSaldoInsoluto",
                                  value,
                                )
                              }
                            />
                            <NumberInput
                              value={Number(rd.PartialityNumber)}
                              label="Parcialidad:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "PartialityNumber",
                                  value,
                                )
                              }
                            />
                            <TextInput
                              value={rd.Uuid}
                              label="UUID:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "Uuid",
                                  value,
                                )
                              }
                            />
                            <TextInput
                              value={rd.Serie}
                              label="Serie:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "Serie",
                                  value,
                                )
                              }
                            />
                            <TextInput
                              value={rd.Folio}
                              label="Folio:"
                              onChange={(value: string) =>
                                setRelatedDocument(
                                  index,
                                  indexDoc,
                                  "Folio",
                                  value,
                                )
                              }
                            />
                          </div>
                        </SectionForm>
                      ))}
                    </div>
                  ))}
                </form>
              </SectionForm>
            </div>
            <div className="p-4 flex justify-end">
              <Button
                onClick={() => {
                  console.log(state);
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
