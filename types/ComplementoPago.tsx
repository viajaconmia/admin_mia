import { SaldoFacturado } from "@/services/PagosService";

type Tax = {
  Name: string;
  Rate: string;
  Total: number;
  Base: number;
  IsRetention: string;
};

export type RelatedDocument = {
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

export type Payment = {
  Date: string;
  PaymentForm: string;
  Amount: string;
  RelatedDocuments: RelatedDocument[];
};

type Complemento = {
  Payments: Payment[];
};

export type Receiver = {
  Rfc?: string;
  Name?: string;
  CfdiUse: string;
  FiscalRegime?: string;
  TaxZipCode?: string;
};

export type CfdiState = {
  NameId?: string;
  Folio?: string;
  Currency?: string;
  ExpeditionPlace: string;
  CfdiType?: string;
  PaymentForm?: string | null;
  PaymentMethod?: string | null;
  PaymentConditions?: string | null;
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

type MapAction = {
  type: "MAP_SALDO_TO_CFDI";
  payload: SaldoFacturado;
};

export type ActionComplemento =
  | SetFieldAction
  | AddItemAction
  | RemoveItemAction
  | MapAction;
