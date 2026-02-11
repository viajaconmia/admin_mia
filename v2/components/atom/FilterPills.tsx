import { X } from "lucide-react";

export default function FilterPills({ filters, onRemove }) {
  return (
    <div className="w-full">
      {Object.entries(filters).map(([key, value]) => {
        if (!value && value !== false) return null;
        return (
          <label
            className="text-xs font-medium text-sky-900 rounded-full bg-sky-200 px-2 pl-3 py-1 mr-2 mb-2 inline-flex items-center"
            key={key}
          >
            {key === "hasDiscount" && "Descuento: "}
            {key === "paymentMethod" && "Método pago: "}
            {key === "startDate" && "Desde: "}
            {key === "endDate" && "Hasta: "}
            {key === "facturable" && "Facturable: "}
            {key === "comprobante" && "Comprobante: "}
            {key !== "tiene_descuento" &&
              key !== "hasDiscount" &&
              key !== "paymentMethod" &&
              key !== "startDate" &&
              key !== "endDate" &&
              key !== "facturable" &&
              key !== "comprobante" &&
              `${key.toLowerCase().replaceAll("_", " ")}: `}

            {typeof value === "string"
              ? value.toLowerCase()
              : typeof value === "boolean"
                ? value
                  ? "SI"
                  : "NO"
                : value.toString()}

            <X
              onClick={() => onRemove(null, key)}
              className="w-3 h-3 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
            />
          </label>
        );
      })}
    </div>
  );
}
