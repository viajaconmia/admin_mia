import { FullHotelData } from "@/app/dashboard/hoteles/_components/hotel-dialog";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { api_google } from "@/lib/constants";
import { Hotel } from "@/types";
import { Viajero } from "@/types";
import { ChevronDown, CheckCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export const Dropdown = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[] | { value: string; label: string }[]; // Update this line
  disabled?: boolean;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
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
          options.map((option) => {
            // Handle both string and object options
            const optionValue =
              typeof option === "string" ? option : option.value;
            const optionLabel =
              typeof option === "string" ? option : option.label;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm text-gray-900 font-medium">{label}</label>
    <div className="relative">
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  </div>
);

export const DateTimeInput = ({
  label,
  value,
  onChange,
  disabled,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm text-gray-900 font-medium">{label}</label>
    <div className="relative">
      <input
        type="datetime-local"
        min={min}
        max={max}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
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
  className = "",
}: {
  label?: string;
  value: number | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <input
      disabled={disabled}
      type="number"
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-1 focus-visible:outline-gray-950 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

export const TextInput = ({
  label,
  value,
  onChange,
  className,
  disabled = false,
  placeholder = "",
}: {
  label?: string;
  value: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
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
  disabled = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <input
      type="email"
      value={value || ""}
      disabled={disabled}
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
  rows = 1,
  placeholder = "",
  className = "",
  disabled = false,
}: {
  label?: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
    {label && (
      <label className="text-sm text-gray-900 font-medium">{label}</label>
    )}
    <textarea
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);
// Utilidad para soportar opciones como objetos { name, ... }
export type ComboBoxOption<T> = {
  name: string;
  content: T;
};

// Si quieres que el ComboBox soporte objetos, cambia la definición así:
export const ComboBox = <T extends any>({
  label,
  value,
  onChange,
  options = [],
  sublabel,
  placeholderOption = "Selecciona una opción",
  disabled = false,
  onDelete,
}: {
  label?: string;
  sublabel?: string;
  value: ComboBoxOption<T> | null;
  onChange: (value: ComboBoxOption<T> | null) => void;
  options?: ComboBoxOption<T>[];
  placeholderOption?: string;
  disabled?: boolean;
  onDelete?: () => void;
}) => {
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] =
    useState<ComboBoxOption<T>[]>(options);
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

  const handleSelect = (option: ComboBoxOption<T>) => {
    setInputValue(option.name);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col space-y-1" ref={containerRef}>
      {label && (
        <label className="text-sm text-gray-900 font-medium line-clamp-1">
          {label}
          {sublabel && (
            <span className="text-gray-500 text-xs">
              {` - ${sublabel.toLowerCase()}`}
            </span>
          )}
        </label>
      )}
      <div className="relative flex gap-2">
        <div className="flex-1 relative">
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
        {onDelete && (
          <button
            onClick={onDelete}
            type="button"
            className="bg-gray-100 rounded-sm border border-gray-300 shadow-sm w-9 flex justify-center items-center"
          >
            <X className="w-4 h-4"></X>
          </button>
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
export const InputRadio = <T,>({
  name,
  item,
  selectedItem,
  onChange,
  disabled = false,
}: {
  name: string;
  item: {
    id: T;
    label: string;
    icon: React.ElementType;
    color?: string;
    description: string;
  };
  disabled?: boolean;
  selectedItem: string;
  onChange: React.Dispatch<React.SetStateAction<T>>;
}) => {
  const IconComponent = item.icon;
  return (
    <label
      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        disabled === true
          ? "border-gray-50 bg-gray-50"
          : selectedItem === item.id
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={item.id as string}
        checked={selectedItem === item.id}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="sr-only"
      />
      <div
        className={`w-8 h-8 ${item.color || "bg-gray"}${
          disabled ? "-300" : "-600"
        } rounded-full flex items-center justify-center mr-3`}
      >
        <IconComponent className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div
          className={`font-medium ${
            disabled ? "text-gray-500" : "text-gray-800"
          }`}
        >
          {item.label}
        </div>
        <div className="text-xs text-gray-500">{item.description}</div>
      </div>
      {selectedItem === item.id && (
        <CheckCircle className="w-5 h-5 text-blue-500" />
      )}
    </label>
  );
};
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
              ml-1 text-sm font-medium select-none
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

export type ComboBoxOption2<T> = {
  name: string;
  content: T;
};

type ComboBoxProps2<T> = {
  label?: string;
  sublabel?: string;
  value: ComboBoxOption2<T> | null;
  onChange: (value: ComboBoxOption2<T> | null) => void;
  options?: ComboBoxOption2<T>[];
  placeholderOption?: string;
  disabled?: boolean;
  className?: string;
  onDelete?: () => void;
};

export const ComboBox2 = <T,>({
  label,
  sublabel,
  value,
  onChange,
  options = [],
  placeholderOption = "Selecciona una opción",
  disabled = false,
  className,
  onDelete,
}: ComboBoxProps2<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState(value?.name || "");
  const [isOpen, setIsOpen] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);

  // Memoizar opciones filtradas según inputValue
  const filteredOptions = useMemo(() => {
    const lower = inputValue.toLowerCase();
    return options.filter((o) => o?.name?.toLowerCase().includes(lower));
  }, [inputValue, options]);

  // useEffect(() => {
  //   document.addEventListener("keydown", handleMoveFocus);
  //   return () => document.removeEventListener("keydown", handleMoveFocus);
  // }, [filteredOptions, focus]);

  // useEffect(() => {
  //   if(value)
  // },[value])

  const handleMoveFocus = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && filteredOptions.length > 0) {
      if (event.key === "ArrowDown") {
        setFocus((prev) =>
          prev === filteredOptions.length - 1 ? 0 : (prev ?? 0) + 1
        );
        event.preventDefault();
      }
      if (event.key === "ArrowUp") {
        setFocus((prev) =>
          prev === 0 ? filteredOptions.length - 1 : (prev ?? 0) - 1
        );
        event.preventDefault();
      }
      if (event.key === "Enter") {
        handleSelectByEnter();
        event.preventDefault();
      }
    }
  };

  const handleSelectByEnter = () => {
    setFocus((f) => {
      const option = filteredOptions[f ?? 0];
      if (option && option.name !== inputValue) {
        // posponer la llamada al padre
        queueMicrotask(() => onChange(option));
        setInputValue(option.name);
      }
      setIsOpen(false);
      return null;
    });
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocus(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value?.name) setInputValue(value.name);
  }, [value]);

  const handleSelect = (option: ComboBoxOption<T>) => {
    if (option.name !== inputValue) {
      onChange(option);
      setInputValue(option.name);
    }
    setIsOpen(false);
    setFocus(null);
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm text-gray-900 font-medium line-clamp-1">
          {label}
          {sublabel && (
            <span className="text-gray-500 text-xs">{` - ${sublabel.toLowerCase()}`}</span>
          )}
        </label>
      )}
      <div className="relative flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            disabled={disabled}
            value={inputValue}
            placeholder={placeholderOption}
            onFocus={() => {
              setIsOpen(true);
              setFocus(0);
            }}
            onKeyDown={handleMoveFocus}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setFocus(0);
            }}
            className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              value == null && inputValue ? "border-red-600" : ""
            }`}
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
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                    focus == index ? "bg-blue-100" : ""
                  }`}
                >
                  {option.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            type="button"
            className="bg-gray-100 rounded-sm border border-gray-300 shadow-sm w-9 flex justify-center items-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export type AddressType =
  | "street_number"
  | "route"
  | "sublocality"
  | "sublocality_level_1"
  | "locality"
  | "administrative_area_level_1"
  | "country"
  | "postal_code"
  | "political";

export type AddressComponentStrict = {
  long_name: string;
  short_name: string;
  types: AddressType[];
};

export type AddressComponentsStrict = AddressComponentStrict[];
export type Geometry = {
  location: {
    lat: () => number;
    lng: () => number;
  };
  viewport: {
    // viewport normalmente es un objeto LatLngBounds, con northeast y southwest
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
};

export type OpeningHours = {
  open_now: boolean;
  periods: {
    close: {
      day: number; // 0 = domingo, 1 = lunes, ...
      time: string; // formato "HHMM"
      hours: number; // hora en número
      minutes: number; // minutos en número
      nextDate: number; // timestamp en ms
    };
    open: {
      day: number;
      time: string;
      hours: number;
      minutes: number;
      nextDate: number;
    };
  }[];
  weekday_text: string[]; // textos tipo "lunes: 10:00–20:00"
};

export type PlaceMaps = {
  address_components: AddressComponentsStrict;
  geometry: Geometry;
  formatted_address: string;
  vicinity: string;
  opening_hours: OpeningHours;
  international_phone_number: string;
  name: string;
};

export function InputGoogle({
  onChange,
}: {
  onChange: (place: PlaceMaps) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loaded = useGoogleMaps(api_google);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        // componentRestrictions: { country: "mx" },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      console.log(place);
      onChange(place as PlaceMaps);
    });
  }, [loaded]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Buscar ubicación..."
      className="w-96 px-4 py-2 border rounded-full shadow-sm focus:outline-none"
    />
  );
}
