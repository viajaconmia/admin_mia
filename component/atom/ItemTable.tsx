import Button from "@/components/atom/Button";
import { useNotification } from "@/context/useNotificacion";
import { copyToClipboard } from "@/helpers/utils";
import { Copy } from "lucide-react";
import { useState } from "react";

export const ButtonCopiar = ({
  copy_value,
  label,
}: {
  copy_value: string;
  label: string;
}) => {
  const { showNotification } = useNotification();
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
