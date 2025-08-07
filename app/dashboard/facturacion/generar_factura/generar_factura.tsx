import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Mail,
  Receipt,
  Building2,
  FileText,
  DollarSign,
  Percent,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { DataInvoice, DescargaFactura, ProductInvoice } from "@/types/billing";
import { Root } from "@/types/billing";
import { URL, API_KEY } from "@/lib/constants/index";
import { useRoute, Link } from "wouter";
import { useApi } from "@/hooks/useApi";


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};


const cfdiUseOptions = [
  { value: "P01", label: "Por definir" },
  { value: "G01", label: "Adquisición de mercancías" },
  { value: "G02", label: "Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "Gastos en general" },
];

const paymentFormOptions = [
  { value: "01", label: "Efectivo" },
  { value: "02", label: "Cheque nominativo" },
  { value: "03", label: "Transferencia electrónica de fondos" },
  { value: "04", label: "Tarjeta de crédito" },
  { value: "28", label: "Tarjeta de débito" },
];

interface FiscalDataModalProps {
  isOpen: boolean;
}

const FiscalDataModal: React.FC<FiscalDataModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <h2 className="text-lg font-semibold text-gray-900">Atención</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Necesitas tener tus datos fiscales en orden, actualiza tus datos
          fiscales en tu configuración.
        </p>
        <div className="flex justify-end">
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Ir a Configuración
          </Link>
        </div>
      </div>
    </div>
  );
};

export const BillingPage: React.FC<BillingPageProps> = ({
  onBack,
  invoiceData,
  userId,
  saldoMonto = 0 // Valor por defecto 0
}) => {
  const [match, params] = useRoute("/factura/:id");
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [solicitud, setSolicitud] = useState(null);
  const [idCompany, setIdCompany] = useState<string | null>(null);
  const [selectedCfdiUse, setSelectedCfdiUse] = useState("G03");
  const [selectedPaymentForm, setSelectedPaymentForm] = useState("03");
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [descarga, setDescarga] = useState<DescargaFactura | null>(null);
  const [descargaxml, setDescargaxml] = useState<DescargaFactura | null>(null);
  const [isEmpresaSelected, setIsEmpresaSelected] = useState("");
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<Root | null>(
    null
  );
  const { crearCfdi, descargarFactura, mandarCorreo } = useApi();
  const [customAmount, setCustomAmount] = useState(saldoMonto);
  const [cfdi, setCfdi] = useState({
    Receiver: {
      Name: "",
      CfdiUse: "",
      Rfc: "",
      FiscalRegime: "",
      TaxZipCode: "",
    },
    CfdiType: "",
    NameId: "",
    Observations: "",
    ExpeditionPlace: "",
    Serie: null,
    Folio: 0,
    PaymentForm: "",
    PaymentMethod: "",
    Exportation: "",
    Items: [
      {
        Quantity: "1",
        ProductCode: "SERV",
        UnitCode: "E48",
        Unit: "Servicio",
        Description: "Pago de servicio",
        // IdentificationNumber: "",
        UnitPrice: customAmount.toString(),
        Subtotal: customAmount.toString(),
        TaxObject: "02",
        Taxes: [
          {
            Name: "IVA",
            Rate: "0.16",
            Total: (customAmount * 0.16).toString(),
            Base: customAmount.toString(),
            IsRetention: "false",
            IsFederalTax: "true",
          },
        ],
        Total: (customAmount * 1.16).toString(),
      },
    ],
  });

  const handleUpdateCompany = (company: any) => {
    console.log("Company object:", company);
    setIsEmpresaSelected(company.id_empresa);

    // Safely access taxInfo and id_datos_fiscales
    setIdCompany(company.taxInfo?.id_datos_fiscales || null);

    // Also update the CFDI receiver data
    setCfdi(prev => ({
      ...prev,
      Receiver: {
        ...prev.Receiver,
        Name: company.razon_social || "",
        Rfc: company.rfc || "",
        FiscalRegime: company.regimen_fiscal || "",
        TaxZipCode: company.codigo_postal || "",
      }
    }));
  };

  useEffect(() => {
    if (!idCompany) {
      setShowFiscalModal(true);
    }
  }, []);

  const handleSendEmail = async () => {
    if (isInvoiceGenerated?.Id) {
      const correo = prompt(
        "¿A que correo electronico deseas mandar la factura?"
      );
      await mandarCorreo(isInvoiceGenerated?.Id, correo || "");
      alert("El correo fue mandado con exito");
    } else {
      alert("ocurrio un error");
    }
  };

  const validateInvoiceData = () => {
    console.log(cfdi.Receiver);
    console.log(selectedCfdiUse);
    console.log(selectedPaymentForm);
    if (
      !cfdi.Receiver.Rfc ||
      !cfdi.Receiver.TaxZipCode ||
      !selectedCfdiUse ||
      !selectedPaymentForm
    ) {
      setShowValidationModal(true);
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async () => {
    if (validateInvoiceData()) {
      const subtotal = customAmount;
      const iva = subtotal * 0.16;
      const total = subtotal + iva;
      const invoiceData = {
        ...cfdi,
        Receiver: {
          ...cfdi.Receiver,
          CfdiUse: selectedCfdiUse,
        },
        PaymentForm: selectedPaymentForm,
        Items: [
          {
            ...cfdi.Items[0],
            UnitPrice: subtotal.toString(),
            Subtotal: subtotal.toString(),
            Taxes: [
              {
                ...cfdi.Items[0].Taxes[0],
                Total: iva.toString(),
                Base: subtotal.toString(),
              },
            ],
            Total: total.toString(),
          },
        ],
      };
      try {
        // Obtener la fecha actual
        const now = new Date();

        // Restar una hora a la fecha actual
        now.setHours(now.getHours() - 6);

        // Formatear la fecha en el formato requerido: "YYYY-MM-DDTHH:mm:ss"
        const formattedDate = now.toISOString().split(".")[0];

        console.log({
          cfdi: {
            ...cfdi,
            Currency: "MXN", // Add the required currency
            OrderNumber: Math.round(Math.random() * 999999), // Add a placeholder or dynamic order number
            Date: formattedDate, // Ensure the date is within the 72-hour limit
          },
          info_user: {
            id_user: authState?.user?.id,
            id_solicitud: params?.id,
          },
          datos_empresa: {
            rfc: cfdi.Receiver.Rfc,
            id_empresa: isEmpresaSelected,
          },
        });

        const response = await crearCfdi({
          cfdi: {
            ...cfdi,
            Currency: "MXN", // Add the required currency
            OrderNumber: Math.round(Math.random() * 999999), // Add a placeholder or dynamic order number
            Date: formattedDate, // Ensure the date is within the 72-hour limit
          },
          info_user: {
            id_user: authState?.user?.id,
            id_solicitud: params?.id,
          },
          datos_empresa: {
            rfc: cfdi.Receiver.Rfc,
            id_empresa: isEmpresaSelected,
          },
        });
        if (response.error) {
          throw new Error(response);
        }
        alert("Se ha generado con exito la factura");
        descargarFactura(response.data.Id)
          .then((factura) => setDescarga(factura))
          .catch((err) => console.error(err));
        descargarFactura(response.data.Id, "xml")
          .then((factura) => setDescargaxml(factura))
          .catch((err) => console.error(err));
        setIsInvoiceGenerated(response.data);
      } catch (error) {
        alert("Ocurrio un error, intenta mas tarde");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <a
            href="/"
            className="flex items-center text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Volver</span>
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-0">
            {/* Left Column - Header and Details */}
            <div className="col-span-8 border-r border-gray-200">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Facturación
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Billing Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                      Datos de Facturación
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        RFC: {cfdi?.Receiver.Rfc}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cfdi?.Receiver.Name}
                      </p>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        {solicitud?.hotel || ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        {solicitud ? (
                          <>
                            {formatDate(solicitud?.check_in)} -
                            {formatDate(solicitud?.check_out)}
                          </>
                        ) : (
                          <p> </p>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    Desglose
                  </h3>

                  <div className="space-y-2">
                    <AmountDetailsSplit
                      amount={formatCurrency(cfdi?.Items?.[0]?.Subtotal || 0)}
                      label="Subtotal"
                      icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                    />
                    <AmountDetailsSplit
                      amount={formatCurrency(
                        cfdi?.Items?.[0]?.Taxes?.[0]?.Total || 0
                      )}
                      label={`IVA (${(cfdi?.Items?.[0]?.Taxes?.[0]?.Rate ?? 0) * 100
                        }%)`}
                      icon={<Percent className="w-4 h-4 text-gray-400" />}
                    />
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          Total
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(cfdi?.Items?.[0]?.Total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="col-span-4 bg-gray-50 p-4 flex flex-col justify-between">
              <div>
                {/* CFDI Use Select */}
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-gray-700">
                    Uso de CFDI
                  </label>
                  <select
                    value={selectedCfdiUse}
                    onChange={(e) => setSelectedCfdiUse(e.target.value)}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {cfdiUseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Form Select */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Forma de Pago
                  </label>
                  <select
                    value={selectedPaymentForm}
                    onChange={(e) => setSelectedPaymentForm(e.target.value)}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {paymentFormOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Custom Amount Input */}
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-gray-700">
                    Monto a facturar
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={saldoMonto}
                      value={customAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= saldoMonto) {
                          setCustomAmount(value);
                        }
                      }}
                      className="block w-full pl-8 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Máximo: {formatCurrency(saldoMonto)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {isInvoiceGenerated ? (
                  <>
                    <button
                      onClick={handleSendEmail}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Enviar por Correo</span>
                    </button>
                    <a
                      href={`data:application/pdf;base64,${descarga?.Content}`}
                      download="factura.pdf"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Descargar PDF</span>
                    </a>
                    <a
                      href={`data:application/xml;base64,${descargaxml?.Content}`}
                      download="factura.pdf"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Descargar XML</span>
                    </a>
                  </>
                ) : (
                  <button
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleGenerateInvoice}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Confirmar y Generar
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataFiscalModalWithCompanies
        onClose={() => setShowFiscalModal(false)}
        actualizarCompany={handleUpdateCompany}
        isOpen={showFiscalModal}
        agentId={userId} // Pasa el ID del usuario aquí
      />

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">
                Error de Validación
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Por favor, regresa a tu configuración y establece los datos
              fiscales para poder realizar tu factura
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AmountDetailsSplit = ({
  amount,
  label,
  icon,
}: {
  amount: string;
  label: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{amount}</span>
    </div>
  );
};

interface BillingPageProps {
  onBack: () => void;
  invoiceData?: DataInvoice;
  userId: string; // Nuevo prop
  saldoMonto?: number;
}

interface DataFiscalModalProps {
  isOpen: boolean;
  onClose: () => void;
  actualizarCompany: (company: any) => void;
  agentId: string; // Nuevo prop
}
export const getEmpresasDatosFiscales = async (agent_id: string) => {
  console.log(agent_id)
  try {
    const response = await fetch(
      `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(agent_id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error al obtener empresas con datos fiscales:", error);
    throw error;
  }
};

const DataFiscalModalWithCompanies: React.FC<DataFiscalModalProps> = ({
  isOpen,
  onClose,
  actualizarCompany,
  agentId
}) => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && agentId) {
      const fetchEmpresas = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getEmpresasDatosFiscales(agentId);

          // Ensure data is an array, if not convert it or handle appropriately
          if (Array.isArray(data)) {
            setEmpresas(data);
          } else if (data && typeof data === 'object') {
            // If the response is an object, try to extract an array from it
            setEmpresas(data.data || data.empresas || []);
          } else {
            setEmpresas([]);
            setError("Formato de datos inesperado");
          }
        } catch (err) {
          console.error("Error fetching companies:", err);
          setError("Error al cargar las empresas");
          setEmpresas([]);
        } finally {
          setLoading(false);
        }
      };

      fetchEmpresas();
    }
  }, [isOpen, agentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Selecciona la empresa para facturar</h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : empresas.length === 0 ? (
          <div className="text-yellow-600 text-center py-4">
            No se encontraron empresas con datos fiscales
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {empresas.map(empresa => (
                <div
                  key={empresa.id_empresa}
                  className="border p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    try {
                      actualizarCompany(empresa);
                      onClose();
                    } catch (error) {
                      console.error("Error updating company:", error);
                      // You might want to show an error message to the user here
                    }
                  }}
                >
                  <h3 className="font-medium">{empresa.razon_social}</h3>
                  <p className="text-sm text-gray-600">RFC: {empresa.rfc}</p>
                  <p className="text-sm text-gray-600">Regimen: {empresa.regimen_fiscal}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
