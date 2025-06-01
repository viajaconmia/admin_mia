import React from "react";

interface NumberInputProps {
  label?: string;
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
}) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm text-gray-600">{label}</label>}
    <input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      min="0"
      step="0.01"
    />
  </div>
);

export default NumberInput;