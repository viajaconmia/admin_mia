"use client";
import { ComboBoxValue2 } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { X } from "lucide-react";

export type SelectOption = { label: string; value: string };

interface SelectFilterProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null, propiedad: string) => void;
  propiedad: string;
  options: SelectOption[];
  disabled?: boolean;
}

export const SelectFilter = ({
  label,
  value,
  onChange,
  propiedad,
  options,
  disabled = false,
}: SelectFilterProps) => {
  const displayLabel = options.find((o) => o.value === value)?.label ?? null;

  const handleChange = (selected: string | null) => {
    const matched = options.find((o) => o.label === selected);
    onChange(matched?.value ?? null, propiedad);
  };

  return (
    <div className="flex flex-col w-full gap-1">
      <label className="text-sm text-gray-900 font-medium line-clamp-1">
        {label}
      </label>
      <div className="w-full flex border rounded-lg justify-start bg-white">
        <ComboBoxValue2
          value={displayLabel}
          disabled={disabled}
          onChange={handleChange}
          options={options.map((o) => o.label)}
          className="flex-1"
          unstyled
        />
        <Button
          variant="warning ghost"
          icon={X}
          size="sm"
          className="py-2"
          onClick={() => onChange(null, propiedad)}
        />
      </div>
    </div>
  );
};
