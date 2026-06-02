import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";
import { copyToClipboard } from "@/helpers/utils";
import { Building2, Car, Copy, HelpCircle, Plane } from "lucide-react";
import { useState } from "react";

export const ButtonCopiar = ({
  copy_value,
  label,
}: {
  copy_value: string;
  label: string;
}) => {
  const { showNotification } = useAlert();
  return (
    <div className="flex gap-2 items-center justify-between">
      <span className="font-semibold text-sm">{label}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          try {
            copyToClipboard(copy_value);
            showNotification("success", "Copiado con exito");
          } catch (error) {
            showNotification("error", error.message || "Error al copiar");
          }
        }}
        icon={Copy}
      >
        {" "}
      </Button>
    </div>
  );
};

export const MarginPercent = ({ value }) => (
  <span
    className={`font-semibold border p-1 px-2 text-xs rounded-full ${
      value == "Infinity"
        ? "text-gray-700 bg-gray-100 border-gray-300 "
        : value > 0
          ? "text-green-600 bg-green-100 border-green-300"
          : "text-red-600 bg-red-100 border-red-300"
    }`}
  >
    {value == "Infinity" ? "0%" : `${Number(value).toFixed(2)}%`}
  </span>
);

export const Tooltip = ({ content, children, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId;

  const showTooltip = () => {
    timeoutId = setTimeout(() => setIsVisible(true), 200);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2",
    left: "right-[-4px] top-1/2 -translate-y-1/2",
    right: "left-[-4px] top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg cursor-pointer
            ${positionClasses[position]}
          `}
          role="tooltip"
        >
          {content}

          <div
            className={`absolute h-2 w-2 rotate-45 bg-gray-800 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

export type ServiceType = "flyght" | "car_rental" | "hotel";

const ICON_MAP: Record<ServiceType, React.ElementType> = {
  flyght: Plane,
  car_rental: Car,
  hotel: Building2,
};

interface ServiceIconProps {
  type: ServiceType | string;
  size?: number;
  className?: string;
}

export function ServiceIcon({ type, size = 18, className }: ServiceIconProps) {
  const Icon = ICON_MAP[type as ServiceType] ?? HelpCircle;

  return <Icon size={size} className={className} />;
}

export const LinkCopiar = ({
  link,
  showLangEn,
}: {
  link: string;
  showLangEn?: boolean;
}) => {
  const linkEn = `${link}${link.includes("?") ? "&" : "?"}lang=en`;
  return (
    <span className="flex flex-col gap-1">
      {/* Español */}
      <span className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-gray-400 w-5">ES</span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Ver
        </a>
        <button
          onClick={() => copyToClipboard(link)}
          className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50 transition-colors"
        >
          Copiar
        </button>
      </span>

      {/* Inglés */}
      {showLangEn && (
        <span className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-emerald-500 w-5">EN</span>
          <a
            href={linkEn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:underline font-medium"
          >
            Ver
          </a>
          <button
            onClick={() => copyToClipboard(linkEn)}
            className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 hover:bg-emerald-50 transition-colors"
          >
            Copiar
          </button>
        </span>
      )}
    </span>
  );
};
