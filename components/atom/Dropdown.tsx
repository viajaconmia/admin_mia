// components/CustomDropdown.tsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"; // Ejemplo de iconos

// Define el tipo para cada opción del dropdown
interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode; // Permite un icono, que es un nodo de React opcional
}

// Define el tipo de las props que el componente espera recibir
interface CustomDropdownProps {
  options: Option[];
  placeholder: string;
  onSelect: (option: Option) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  placeholder,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook para detectar clics fuera del componente
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={handleToggle}
        >
          {selectedOption ? (
            <div className="flex items-center">
              {selectedOption.icon && (
                <span className="mr-2">{selectedOption.icon}</span>
              )}
              {selectedOption.label}
            </div>
          ) : (
            placeholder
          )}
          {isOpen ? (
            <ChevronUpIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDownIcon
              className="-mr-1 ml-2 h-5 w-5"
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.icon && <span className="mr-3">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
