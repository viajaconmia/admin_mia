import Button from "@/components/atom/Button";
import { ProveedorRaw } from "@/services/ProveedoresService";
import { DateTime } from "@/v3/atom/TableItemsComponent";
import { Building2 } from "lucide-react";

export type ProveedorItem = {
  proveedor: string;
  type: ProveedorRaw["type"];
  estatus: 0 | 1;
  tipo_pago: ProveedorRaw["tipo_pago"];
  tipo_negociacion: ProveedorRaw["negociacion"];
  convenio: 0 | 1;
  ciudad: string | null;
  rfcs: string | null;
  creado_en: string;
  acciones: ProveedorRaw;
};

export const mapProveedorItem = (p: ProveedorRaw): ProveedorItem => ({
  proveedor: p.proveedor,
  type: p.type,
  estatus: p.estatus,
  tipo_negociacion: p.negociacion,
  tipo_pago: p.tipo_pago,
  convenio: p.convenio,
  ciudad: p.ciudad,
  rfcs: p.rfcs,
  creado_en: p.created_at,
  acciones: p,
});

const Badge = ({
  label,
  color,
}: {
  label: string;
  color: "green" | "red" | "blue" | "gray" | "yellow";
}) => {
  const classes: Record<typeof color, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${classes[color]}`}
    >
      {label}
    </span>
  );
};

const TYPE_LABELS: Record<string, string> = {
  vuelo: "Vuelo",
  renta_carro: "Renta carro",
  hotel: "Hotel",
};

export const createRenderers = ({
  onVerProveedor,
}: {
  onVerProveedor: (p: ProveedorRaw) => void;
}) => ({
  type: ({ value }: { value: ProveedorRaw["type"] }) =>
    value ? (
      <Badge label={TYPE_LABELS[value] ?? value} color="blue" />
    ) : (
      <span className="text-gray-400 text-xs">—</span>
    ),

  estatus: ({ value }: { value: 0 | 1 }) =>
    value === 1 ? (
      <Badge label="Activo" color="green" />
    ) : (
      <Badge label="Inactivo" color="red" />
    ),

  tipo_pago: ({ value }: { value: ProveedorRaw["tipo_pago"] }) =>
    value ? (
      <Badge label={value} color={value === "credito" ? "yellow" : "blue"} />
    ) : (
      <span className="text-gray-400 text-xs">—</span>
    ),

  convenio: ({ value }: { value: 0 | 1 }) =>
    value === 1 ? (
      <Badge label="Con convenio" color="green" />
    ) : (
      <Badge label="Sin convenio" color="gray" />
    ),

  ciudad: ({ value }: { value: string | null }) => (
    <span className="text-sm text-gray-700">{value ?? "—"}</span>
  ),

  rfcs: ({ value }: { value: string | null }) => {
    if (!value) return <span className="text-gray-300 text-xs">—</span>;
    const lista = value
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1">
        {lista.map((rfc) => (
          <span
            key={rfc}
            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono"
          >
            {rfc}
          </span>
        ))}
      </div>
    );
  },

  creado_en: ({ value }: { value: string }) => <DateTime value={value} />,

  acciones: ({ value }: { value: ProveedorRaw }) => (
    <Button
      size="sm"
      variant="secondary"
      icon={Building2}
      onClick={() => onVerProveedor(value)}
    >
      Ver proveedor
    </Button>
  ),
});
