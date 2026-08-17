"use client";

import { useState } from "react";

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setValue = (name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  const handleSubmit = (callback: (values: T) => void) => {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      callback(values);
    };
  };

  return {
    values,
    errors,
    setErrors,
    handleChange,
    setValue,
    reset,
    handleSubmit,
  };
}
