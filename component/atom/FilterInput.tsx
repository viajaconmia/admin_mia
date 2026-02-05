import Button from "@/components/atom/Button";
import { ComboBoxValue2, DateInput, TextInput } from "@/components/atom/Input";
import { X } from "lucide-react";

type BaseProps = {
  label?: string;
  disabled?: boolean;
  value: string | null;
  onChange: (value: string | null, propiedad: string) => void;
  propiedad: string;
};

type TextInputProps = BaseProps & {
  type: "text";
  options?: string[];
};

type SelectInputProps = BaseProps & {
  type: "select";
  options: string[];
};

type DateInputProps = BaseProps & {
  type: "date";
  options?: string[];
};

type FilterInputProps = TextInputProps | SelectInputProps | DateInputProps;

export const FilterInput = ({
  type,
  onChange,
  value,
  disabled = false,
  label,
  options,
  propiedad,
}: FilterInputProps) => {
  return (
    <div className="flex flex-col w-full gap-1">
      <label className="text-sm text-gray-900 font-medium line-clamp-1">
        {label}
      </label>
      <div className="w-full flex border rounded-lg justify-start bg-white">
        {type == "text" ? (
          <TextInput
            value={value || ""}
            onChange={(value: string) => {
              onChange(value, propiedad);
            }}
            disabled={disabled}
            className="flex-1"
          />
        ) : type == "select" ? (
          <ComboBoxValue2
            value={value || null}
            disabled={disabled}
            onChange={function (value: string | null): void {
              onChange(value, propiedad);
            }}
            options={options}
            className="flex-1"
            unstyled={true}
          />
        ) : type == "date" ? (
          <DateInput
            value={(value || "").split("T")[0]}
            onChange={(value: string | null) => {
              onChange(value, propiedad);
            }}
            disabled={disabled}
            className="flex-1"
          />
        ) : (
          <h1>Falta el type o no se encontro</h1>
        )}
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
