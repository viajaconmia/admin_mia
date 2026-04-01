import Button from "@/components/atom/Button";
import {
  ComboBoxValue2,
  DateInput,
  NumberInput,
  TextInput,
} from "@/components/atom/Input";
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

/* =========================
   TYPES
========================= */

type BasePropsAd = {
  label?: string;
  disabled?: boolean;
  value: string | number | null;
  onChange: (value: string | number | null, propiedad: string) => void;
  propiedad: string;
};

type Option = {
  label: string;
  value: string | number;
};

type TextInputPropsAd = BasePropsAd & {
  type: "text";
};

type NumberInputPropsAd = BasePropsAd & {
  type: "number";
};

type SelectInputPropsAd = BasePropsAd & {
  type: "select";
  options: Option[];
};

type DateInputPropsAd = BasePropsAd & {
  type: "date";
};

type AdvancedFilterInputProps =
  | TextInputPropsAd
  | NumberInputPropsAd
  | SelectInputPropsAd
  | DateInputPropsAd;

/* =========================
   COMPONENT
========================= */

export const AdvancedFilterInput = ({
  type,
  onChange,
  value,
  disabled = false,
  label,
  options,
  propiedad,
}: AdvancedFilterInputProps) => {
  return (
    <div className="flex flex-col w-full gap-1">
      <label className="text-sm text-gray-900 font-medium line-clamp-1">
        {label}
      </label>

      <div className="w-full flex border rounded-lg bg-white overflow-hidden">
        {/* TEXT */}
        {type === "text" && (
          <TextInput
            value={(value as string) || ""}
            onChange={(val: string) => onChange(val || null, propiedad)}
            disabled={disabled}
            className="flex-1"
          />
        )}

        {/* NUMBER */}
        {type === "number" && (
          <NumberInput
            value={value !== null ? Number(value) : null}
            onChange={(val: string) => {
              onChange(Number(val), propiedad);
            }}
            disabled={disabled}
            className="flex-1"
          />
        )}

        {/* SELECT */}
        {type === "select" &&
          options &&
          (() => {
            // Map label -> value
            const labelToValue = new Map(
              options.map((opt) => [opt.label, opt.value]),
            );

            // Map value -> label
            const valueToLabel = new Map(
              options.map((opt) => [opt.value, opt.label]),
            );

            return (
              <ComboBoxValue2
                value={
                  value !== null && value !== undefined
                    ? ((valueToLabel.get(value) as string) ?? null)
                    : null
                }
                disabled={disabled}
                onChange={(label: string | null) => {
                  if (label == null) return onChange(null, propiedad);

                  const realValue = labelToValue.get(label);
                  onChange(realValue ?? null, propiedad);
                }}
                options={options.map((o) => o.label)}
                className="flex-1"
                unstyled
              />
            );
          })()}

        {/* DATE */}
        {type === "date" && (
          <DateInput
            value={value ? String(value).split("T")[0] : ""}
            onChange={(val: string | null) => onChange(val, propiedad)}
            disabled={disabled}
            className="flex-1"
          />
        )}

        {/* CLEAR */}
        {value !== null && value !== "" && (
          <Button
            variant="warning ghost"
            icon={X}
            size="sm"
            className="py-2"
            onClick={() => onChange(null, propiedad)}
          />
        )}
      </div>
    </div>
  );
};
