import { environment } from "@/lib/constants";
import { getPaymentForm } from "@/lib/helpers/complemento";
import { setDeep } from "@/lib/helpers/reducer";
import { FacturaSaldo } from "@/services/PagosService";
import { ActionComplemento, CfdiState } from "@/types/ComplementoPago";

export const cfdiReducer = (
  state: CfdiState,
  action: ActionComplemento,
): CfdiState => {
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
    case "MAP_SALDO_TO_CFDI": {
      const saldo = action.payload;

      const newState: CfdiState = structuredClone(state);

      newState.Complemento.Payments = [
        {
          Date: saldo.fecha_pago.split("T")[0],

          PaymentForm: getPaymentForm(saldo.metodo_pago, saldo.tipo_tarjeta),

          Amount: saldo.monto,

          RelatedDocuments: saldo.facturas.map((f: FacturaSaldo) => ({
            TaxObject: "01",
            Uuid: f.uuid_factura,
            Serie: "CP",
            Folio: f.folio || "",
            Currency: "MXN",
            PaymentMethod: "PPD",
            PartialityNumber: String(f.parcialidad + 1),
            PreviousBalanceAmount: f.total,
            AmountPaid: f.monto_asignado,
            ImpSaldoInsoluto: (
              Number(f.saldo_insoluto) - Number(f.monto_asignado)
            ).toFixed(2),
            Taxes: [],
          })),
        },
      ];

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
  Currency: "MXN",
  Receiver: {
    Rfc: null,
    Name: null,
    CfdiUse: "CP01",
    FiscalRegime: null,
    TaxZipCode: null,
  },

  Complemento: {
    Payments: [
      {
        Date: null,
        PaymentForm: null,
        Amount: null,
        RelatedDocuments: [
          // {
          //   TaxObject: "01",
          //   Uuid: "C94C8AF3-C774-4D4C-802E-781411934A6E",
          //   Serie: null,
          //   Folio: "300",
          //   Currency: "MXN",
          //   PaymentMethod: "PUE",
          //   PartialityNumber: "1",
          //   PreviousBalanceAmount: "1486.76",
          //   AmountPaid: "1486.76",
          //   ImpSaldoInsoluto: "0.00",
          //   Taxes: [
          //     {
          //       Name: "IVA",
          //       Rate: "0.16",
          //       Total: 205.07,
          //       Base: 1281.69,
          //       IsRetention: "false",
          //     },
          //   ],
          // },
        ],
      },
    ],
  },
};
