export interface TaxInvoice {
  Total: number; //1899.73;
  Name: string; //"IVA";
  Base: number; //11873.3;
  Rate: number; //0.16;
  IsRetention: boolean; //false;
}

export interface ProductInvoice {
  ProductCode: string; //"01010101";
  IdentificationNumber: string; //"EDL";
  Description: string; //"Factura global";
  Unit: string; //"Actividad";
  UnitCode: string; //"ACT";
  UnitPrice: number; //11873.3;
  Quantity: number; //1.0;
  Subtotal: number; //11873.3;
  TaxObject: string; //"02";
  Total: number; //13773.03;
  Taxes: TaxInvoice[];
}

export interface ClientInvoice {
  Rfc: string; //"ZUÑ920208KL4",
  Name: string; //"ZAPATERIA URTADO ÑERI",
  CfdiUse: string; //"G03",
  FiscalRegime: string; //"601",
  TaxZipCode: string; //"34541",
}

export interface CfdiInvoice {
  NameId: string; // "1"
  Folio: number; // Cambiado a number ya que generas un número aleatorio
  Serie: null;
  CfdiType: string; // "I"
  Currency: string; // "MXN"
  PaymentForm: string; // "03"
  PaymentMethod: string; // "PUE"
  OrderNumber: string; // "12345"
  ExpeditionPlace: string; // "42501"
  Date: string; // Formato ISO
  Observations: string;
  Exportation: string; // "01"
  Receiver: ClientInvoice;
  Items: ProductInvoice[];
}

export interface DataInvoice {
  cfdi: CfdiInvoice;
}

export interface Root {
  Id: string;
  CfdiType: string;
  Type: string;
  Serie: string;
  Folio: string;
  Date: string;
  CertNumber: string;
  PaymentTerms: string;
  PaymentMethod: string;
  PaymentAccountNumber: string;
  PaymentBankName: string;
  ExpeditionPlace: string;
  ExchangeRate: number;
  Currency: string;
  Subtotal: number;
  Discount: number;
  Total: number;
  Observations: string;
  OrderNumber: string;
  Issuer: Issuer;
  Receiver: Receiver;
  Items: Item[];
  Taxes: Tax[];
  Complement: Complement;
  Status: string;
  OriginalString: string;
}



export interface Issuer {
  FiscalRegime: string;
  Rfc: string;
  TaxName: string;
  Email: string;
  Phone: string;
  TaxAddress: TaxAddress;
  IssuedIn: IssuedIn;
}

export interface TaxAddress {
  Street: string;
  ExteriorNumber: string;
  InteriorNumber: string;
  Neighborhood: string;
  ZipCode: string;
  Municipality: string;
  State: string;
  Country: string;
}

export interface IssuedIn {
  Street: string;
  ExteriorNumber: string;
  Neighborhood: string;
  ZipCode: string;
  Municipality: string;
  State: string;
  Country: string;
}

export interface Receiver {
  Rfc: string;
  Name: string;
  Email: string;
}

export interface Item {
  ProductCode: string;
  IdentificationNumber: string;
  UnitCode: string;
  Discount: number;
  CuentaPredial: string;
  Quantity: number;
  Unit: string;
  Description: string;
  UnitValue: number;
  Total: number;
}

export interface Tax {
  Total: number;
  Name: string;
  Rate: number;
  Type: string;
}

export interface Complement {
  TaxStamp: TaxStamp;
}

export interface TaxStamp {
  Uuid: string;
  Date: string;
  CfdiSign: string;
  SatCertNumber: string;
  SatSign: string;
  RfcProvCertif: string;
}
export interface DescargaFactura {
  ContentEncoding: string;
  ContentType: string;
  ContentLength: number;
  Content: string;
}

