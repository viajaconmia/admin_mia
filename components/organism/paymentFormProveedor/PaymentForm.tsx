import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Building2,
  User,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface PaymentData {
  id: string;
  providerName: string;
  providerEmail: string;
  amount: number;
  currency: string;
  concept: string;
  dueDate: string;
  paymentMethod: string;
  status: "pending" | "approved" | "rejected" | "paid";
  notes: string;
}

interface PaymentEditFormProps {
  initialData?: Partial<PaymentData>;
  onSave?: (data: PaymentData) => void;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentEditFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PaymentData>({
    id: initialData?.id || "1",
    providerName: initialData?.providerName || "Proveedor Ejemplo S.A.",
    providerEmail: initialData?.providerEmail || "contacto@proveedor.com",
    amount: initialData?.amount || 15000,
    currency: initialData?.currency || "USD",
    concept: initialData?.concept || "Servicios de consultoría técnica",
    dueDate: initialData?.dueDate || "2024-02-15",
    paymentMethod: initialData?.paymentMethod || "transfer",
    status: initialData?.status || "pending",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: keyof PaymentData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.providerName.trim()) {
      newErrors.providerName = "El nombre del proveedor es requerido";
    }

    if (!formData.providerEmail.trim()) {
      newErrors.providerEmail = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.providerEmail)) {
      newErrors.providerEmail = "Email inválido";
    }

    if (formData.amount <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0";
    }

    if (!formData.concept.trim()) {
      newErrors.concept = "El concepto es requerido";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "La fecha de vencimiento es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // onSave?.(formData);
      console.log(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Information */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            Información del Proveedor
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nombre del Proveedor
            </label>
            <input
              type="text"
              value={formData.providerName}
              onChange={(e) =>
                handleInputChange("providerName", e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.providerName
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="Nombre completo del proveedor"
            />
            {errors.providerName && (
              <p className="text-red-600 text-sm mt-1">{errors.providerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Contacto
            </label>
            <input
              type="email"
              value={formData.providerEmail}
              onChange={(e) =>
                handleInputChange("providerEmail", e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.providerEmail
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="email@proveedor.com"
            />
            {errors.providerEmail && (
              <p className="text-red-600 text-sm mt-1">
                {errors.providerEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            Detalles del Pago
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.amount ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="COP">COP - Peso Colombiano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.dueDate ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.dueDate && (
              <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Concepto del Pago
            </label>
            <input
              type="text"
              value={formData.concept}
              onChange={(e) => handleInputChange("concept", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.concept ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              placeholder="Descripción del servicio o producto"
            />
            {errors.concept && (
              <p className="text-red-600 text-sm mt-1">{errors.concept}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                handleInputChange("paymentMethod", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="transfer">Transferencia Bancaria</option>
              <option value="check">Cheque</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Información adicional sobre el pago..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>
    </form>
  );
};
