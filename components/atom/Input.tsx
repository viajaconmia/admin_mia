import { Hotel } from "@/types";
import { Viajero } from "@/types";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Dropdown = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm text-gray-900 font-medium">{label}</label>
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Selecciona una opción</option>
        {options.length > 0 ? (
          options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        ) : (
          <option value={value}>{value}</option>
        )}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown size={18} className="text-gray-500" />
      </div>
    </div>
  </div>
);

// Custom date input component
export const DateInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm text-gray-900 font-medium">{label}</label>
    <div className="relative">
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  </div>
);

// Custom text input component
export const NumberInput = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  label?: string;
  value: number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <input
      disabled={disabled}
      type="number"
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

export const TextInput = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "",
}: {
  label?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col space-y-1">
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:text-black"
    />
  </div>
);

export const EmailInput = ({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col space-y-1">
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <input
      type="email"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

export const TextAreaInput = ({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col space-y-1">
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);
// Utilidad para soportar opciones como objetos { name, ... }
export type ComboBoxOption = { name: string; content: Hotel | Viajero };

// Si quieres que el ComboBox soporte objetos, cambia la definición así:
export const ComboBox = ({
  label,
  value,
  onChange,
  options = [],
  sublabel,
  placeholderOption = "Selecciona una opción",
  disabled = false,
}: {
  label?: string;
  sublabel?: string;
  value: ComboBoxOption | null;
  onChange: (value: ComboBoxOption | null) => void;
  options?: ComboBoxOption[];
  placeholderOption?: string;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] =
    useState<ComboBoxOption[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    setInputValue(value?.name || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: ComboBoxOption) => {
    setInputValue(option.name);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col space-y-1" ref={containerRef}>
      {label && (
        <label className="text-sm text-gray-900 font-medium line-clamp-1">
          {label}{" "}
          <span className="text-gray-500 text-xs">
            {" "}
            - {sublabel.toLowerCase()}
          </span>{" "}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholderOption}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown size={18} className="text-gray-500" />
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto text-sm">
            {filteredOptions.map((option, index) => (
              <li
                key={option.name + index}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100"
              >
                {option.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

type Option = {
  value: string;
  label: string;
  item: any;
};

export const DropdownValues = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
}: {
  label: string;
  value: string | Option | null;
  onChange: (value: Option | null) => void;
  options?: Option[];
  disabled?: boolean;
}) => {
  // Si el value es un string, buscamos el objeto correspondiente
  const selectedId = typeof value === "string" ? value : value?.value ?? "";

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm text-gray-900 font-medium">{label}</label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => {
            const selectedOption = options.find(
              (opt) => opt.value === e.target.value
            );
            onChange(selectedOption || null);
          }}
          disabled={disabled}
          className="flex w-full rounded-md border appearance-none border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona una opción</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown size={18} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};

interface CheckboxInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  fieldLabel?: string;
  id?: string;
  disabled?: boolean;
}

export const CheckboxInput = ({
  // Asumiendo que este es el wrapper de tu componente
  label, // Texto descriptivo para el interruptor
  checked,
  onChange,
  fieldLabel,
  id,
  disabled = false,
}: CheckboxInputProps) => {
  // Usando la interfaz de props que definimos antes
  const uniqueId =
    id ||
    `toggle-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

  return (
    <div className="flex flex-col space-y-1">
      {/* Muestra la fieldLabel (etiqueta de campo) si se proporciona */}
      {fieldLabel && (
        <label htmlFor={uniqueId} className="text-sm text-gray-900 font-medium">
          {fieldLabel}
        </label>
      )}

      {/* Contenedor para el interruptor visual y su etiqueta descriptiva adyacente */}
      <div className="flex items-center">
        {/* === Inicio del Interruptor Visual === */}
        <label
          htmlFor={uniqueId} // Asocia este label (el riel) con el input oculto
          className={`
            relative inline-flex items-center w-10 h-6 rounded-full cursor-pointer select-none
            transition-colors duration-200 ease-in-out
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${checked ? "bg-green-500" : "bg-gray-300"} 
            /* Estilo de foco para el riel cuando el input interno está enfocado */
            focus-within:ring-2 focus-within:ring-offset-2 
            ${
              disabled
                ? "focus-within:ring-transparent"
                : "focus-within:ring-green-400 dark:focus-within:ring-green-600"
            }
          `}
        >
          <input
            type="checkbox"
            id={uniqueId}
            checked={checked}
            onChange={(e) => !disabled && onChange(e.target.checked)} // Previene el cambio si está deshabilitado
            disabled={disabled}
            className="hidden peer" // Input oculto, 'peer' es útil si quieres estilizar hermanos basado en su estado
          />
          {/* Botón Deslizante (Knob) */}
          <span
            aria-hidden="true" // Es un elemento decorativo
            className={`
              absolute top-1 left-1 inline-block w-4 h-4 rounded-full shadow-md
              transform transition-transform duration-200 ease-in-out
              ${disabled ? "bg-gray-100" : "bg-white"}
              ${checked ? "translate-x-4" : "translate-x-0"}
            `}
          ></span>
        </label>
        {/* === Fin del Interruptor Visual === */}

        {/* Etiqueta de Texto Descriptivo (movida aquí, fuera del label del interruptor) */}
        {label && ( // Solo muestra si hay texto de etiqueta
          <span
            onClick={() => {
              // Permite hacer clic en el texto para cambiar el estado del interruptor
              if (!disabled) {
                const inputElement = document.getElementById(
                  uniqueId
                ) as HTMLInputElement | null;
                if (inputElement) {
                  inputElement.click();
                }
              }
            }}
            className={`
              ml-3 text-sm font-medium select-none
              ${
                disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-900 dark:text-gray-100 cursor-pointer"
              }
            `}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
