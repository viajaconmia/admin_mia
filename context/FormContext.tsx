"use client";

import { createContext, useContext, ReactNode } from "react";

import { useForm } from "@/hooks/useForm";

interface FormContextType<T> {
  values: T;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  setValue: (name: keyof T, value: any) => void;
  reset: () => void;
}

const FormContext = createContext<FormContextType<any> | null>(null);

export function FormProvider<T extends Record<string, any>>({
  initialValues,
  children,
}: {
  initialValues: T;
  children: ReactNode;
}) {
  const form = useForm(initialValues);

  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export function useFormContext<T>() {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("useFormContext debe utilizarse dentro de FormProvider");
  }

  return context as FormContextType<T>;
}
