"use client";

import { SaldosService } from "@/services/SaldosService";
import { useEffect, useState } from "react";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import * as schema from "@/schemas/tables/complemento_pago";
import { CompleteTable } from "@/v3/template/Table";
import Modal from "@/components/organism/Modal";
import { ComboBox2, ComboBoxOption2, TextInput } from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";

type FiltrosComplementos = { proveedor?: string };
const PAGE_SIZE = 50;

export default function ReservationsPage() {
  const [saldos, setSaldos] = useState<schema.SaldoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosComplementos>({});
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const [selectedPayment, setSelectedPayment] =
    useState<schema.SaldoItem | null>(null);

  const fetchSaldos = async (page: number = tracking.page) => {
    setLoading(true);
    SaldosService.getInstance()
      .obtenerSaldos({ page })
      .then(({ data, metadata }) => {
        console.log("Saldos obtenidos:", data);
        setSaldos(data.map((saldo) => schema.mapSaldo(saldo)));
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  return (
    <>
      <ModalDetallesComplemento
        onClose={() => {
          setSelectedPayment(null);
        }}
        payment={selectedPayment as schema.SaldoItem}
        // agente={selectedPayment.agente}
      />
      <CompleteTable<schema.SaldoItem>
        pageTracking={tracking}
        fetchData={fetchSaldos}
        registros={saldos}
        loading={loading}
        renderers={schema.createRenderers({
          onVerDetalles: (payment) => setSelectedPayment(payment),
        })}
      />
    </>
  );
}

import { useReducer } from "react";
import { environment } from "@/lib/constants";
import { currencies } from "@/constant/moneda";
import { lazy, Suspense } from "react";
import { Empresa } from "@/services/ExtraServices";
import { SectionForm } from "@/components/atom/SectionForm";
import { Building2, CreditCard, File } from "lucide-react";
import { usosCFDI } from "@/constant";

const EmpresasSection = lazy(
  () => import("@/components/molecule/EmpresasSection"),
);

const ModalDetallesComplemento = ({
  onClose,
  payment,
}: {
  onClose: () => void;
  payment: schema.SaldoItem;
}) => {
  const [loading, setLoading] = useState(false);
  const [state, dispatcher] = useReducer(cfdiReducer, initialState);
  const [empresa, setEmpresa] = useState(null);

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

  useEffect(() => {
    console.log(state);
  }, [state]);

  return (
    <>
      {!!payment && (
        <Modal
          onClose={onClose}
          title="Detalles del Complemento de Pago"
          subtitle="Verifica los datos para poder crear el complemento de pago"
        >
          <div className="w-[90vw] max-w-5xl min-h-[200px]">
            <div className="flex flex-col gap-2">
              <SectionForm
                legend={"Datos de la factura"}
                icon={File}
                className="bg-gray-50"
              >
                <div className="w-full grid grid-cols-3 gap-2">
                  <TextInput
                    value={state.ExpeditionPlace}
                    disabled
                    label="Lugar de expedición:"
                  />
                  <ComboBox2
                    options={mapOptions(currencies as unknown as string[])}
                    label="Divisa:"
                    value={mapValueComboBox(state.Currency)}
                    onChange={({ content }) => setState("Currency", content)}
                  />
                  <ComboBox2
                    options={mapOptions(usosCFDI, "label")}
                    label="Uso de CFDI:"
                    value={mapValueComboBox<{ label: string; value: string }>(
                      usosCFDI.filter(
                        (uc) => uc.value == state.Receiver.CfdiUse,
                      )[0],
                      "label",
                    )}
                    onChange={({ content }) =>
                      setState(
                        "Receiver.CfdiUse",
                        typeof content === "string" ? content : content.value,
                      )
                    }
                  />
                </div>
              </SectionForm>
              <Suspense fallback={<Loader />}>
                <SectionForm
                  legend={"Empresas"}
                  icon={Building2}
                  className="bg-gray-50"
                >
                  <EmpresasSection
                    id_agente={payment.id_agente}
                    select={empresa}
                    disabled
                    setSelect={setEmpresa}
                    initState={(e: Empresa) => e.rfc == payment.rfc}
                  />
                </SectionForm>
              </Suspense>
              <form onSubmit={handleSubmit}>
                <SectionForm legend={"Pago"} icon={CreditCard}></SectionForm>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

type Tax = {
  Name: string;
  Rate: string;
  Total: number;
  Base: number;
  IsRetention: string;
};

type RelatedDocument = {
  TaxObject: string;
  Uuid: string;
  Serie: string;
  Folio: string;
  Currency: string;
  PaymentMethod: string;
  PartialityNumber: string;
  PreviousBalanceAmount: string;
  AmountPaid: string;
  ImpSaldoInsoluto: string;
  Taxes: Tax[];
};

type Payment = {
  Date: string;
  PaymentForm: string;
  Amount: string;
  RelatedDocuments: RelatedDocument[];
};

type Complemento = {
  Payments: Payment[];
};

type Receiver = {
  Rfc: string;
  Name: string;
  CfdiUse: string;
  FiscalRegime: string;
  TaxZipCode: string;
};

export type CfdiState = {
  NameId: string;
  Folio: string;
  Currency: string;
  ExpeditionPlace: string;
  CfdiType: string;
  PaymentForm: string | null;
  PaymentMethod: string | null;
  PaymentConditions: string | null;
  Receiver: Receiver;
  Complemento: Complemento;
};

type SetFieldAction = {
  type: "SET_FIELD";
  path: string;
  value: unknown;
};

type AddItemAction = {
  type: "ADD_ITEM";
  path: string;
  value: unknown;
};

type RemoveItemAction = {
  type: "REMOVE_ITEM";
  path: string;
  index: number;
};

type Action = SetFieldAction | AddItemAction | RemoveItemAction;

function setDeep<T>(obj: T, path: string, value: unknown): T {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  const newObj: any = structuredClone(obj);

  let current = newObj;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key]) {
        current[key] = isNaN(Number(keys[index + 1])) ? {} : [];
      }
      current = current[key];
    }
  });

  return newObj;
}

export const cfdiReducer = (state: CfdiState, action: Action): CfdiState => {
  switch (action.type) {
    case "SET_FIELD":
      return setDeep(state, action.path, action.value);

    case "ADD_ITEM": {
      const keys = action.path.replace(/\[(\d+)\]/g, ".$1").split(".");
      const newState: any = structuredClone(state);

      let current = newState;

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key].push(action.value);
        } else {
          current = current[key];
        }
      });

      return newState;
    }

    case "REMOVE_ITEM": {
      const keys = action.path.replace(/\[(\d+)\]/g, ".$1").split(".");
      const newState: any = structuredClone(state);

      let current = newState;

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key].splice(action.index, 1);
        } else {
          current = current[key];
        }
      });

      return newState;
    }

    default:
      return state;
  }
};

export const initialState: CfdiState = {
  // NameId: "14", //Este es el mismo siempre
  // Folio: "CP-100", // Este debo generarlo en la base de datos para que sea consecutivo
  // CfdiType: "P", // Este se queda igual
  //Estos van asi alv
  // PaymentForm: null,
  // PaymentMethod: null,
  // PaymentConditions: null,
  ExpeditionPlace: !environment ? "11560" : "42501",
  Currency: "MXN", // Este se queda igual siempre, a menos que pidan cambio

  //Estos los saco de la empresa que seleccionen
  Receiver: {
    // Rfc: "ZUÑ920208KL4",
    // Name: "ZAPATERIA URTADO ÑERI",
    CfdiUse: "CP01", // Creo que este si cambia
    // FiscalRegime: "601",
    // TaxZipCode: "77060",
  },

  Complemento: {
    Payments: [
      {
        Date: "2019-06-20",
        PaymentForm: "03",
        Amount: "1486.76",

        RelatedDocuments: [
          {
            TaxObject: "01",
            Uuid: "C94C8AF3-C774-4D4C-802E-781411934A6E",
            Serie: null, //Mandamos null
            Folio: "300",
            Currency: "MXN",
            PaymentMethod: "PUE",
            PartialityNumber: "1",
            PreviousBalanceAmount: "1486.76",
            AmountPaid: "1486.76",
            ImpSaldoInsoluto: "0.00",

            Taxes: [
              {
                Name: "IVA",
                Rate: "0.16",
                Total: 205.07,
                Base: 1281.69,
                IsRetention: "false",
              },
            ],
          },
        ],
      },
    ],
  },
};

function mapOptions<T extends any>(
  list: T[] | string[],
  propiedad?: keyof T,
): { name: string; content: T | string }[] {
  return list.map((item: T | string) => ({
    name: String(
      propiedad && typeof item === "object" ? (item as T)[propiedad] : item,
    ),
    content: item,
  }));
}
function mapValueComboBox<T extends any>(
  value: T | string,
  propiedad?: keyof T,
): { name: string; content: T | string | null } {
  console.log(value);
  return typeof value == "string"
    ? {
        name: value,
        content: value,
      }
    : !!value && !!value[propiedad]
      ? {
          name: value[propiedad] as string,
          content: value,
        }
      : {
          name: "",
          content: null,
        };
}
