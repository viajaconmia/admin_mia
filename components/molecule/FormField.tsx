import { TextInput } from "../atom/Input";
import { useFormContext } from "@/context/FormContext";

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}

export default function FormField({
  name,
  label,
  type = "text",
  placeholder,
}: FormFieldProps) {
  const { values, errors, setValue } = useFormContext<Record<string, any>>();

  return (
    <div>
      <TextInput
        label={label}
        value={values[name] ?? ""}
        placeholder={placeholder}
        type={type}
        onChange={(value) => {
          setValue(name, value);
        }}
      />

      {errors[name] && (
        <span className="text-red-500 text-sm">{errors[name]}</span>
      )}
    </div>
  );
}
