"use client";
import { set } from "date-fns";
import { useEffect, useState } from "react";

export const ComboBox = ({ options, onSelect, value, children }) => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (option) => {
    console.log("Selected option: ", option);
    setQuery(option.name);
    setShowDropdown(false);
    onSelect(option.value);
  };

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div className="relative w-full ">
      <input
        type="text"
        className={`w-full p-2 border  border-gray-300 relative rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-sky-50 `}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          setShowDropdown(true);
          setShowDelete(true);
        }}
        onBlur={() => {
          setShowDelete(false);
        }}
        placeholder="Buscar..."
      />
      {showDropdown && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg ">
          <li
            className="p-2 hover:bg-blue-100 cursor-pointer flex items-center gap-2"
            onClick={() => {
              setQuery("");
              setShowDropdown(false);
              onSelect("");
            }}
          >
            Selecciona una opción
          </li>
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-blue-100 cursor-pointer flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              {children}
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
