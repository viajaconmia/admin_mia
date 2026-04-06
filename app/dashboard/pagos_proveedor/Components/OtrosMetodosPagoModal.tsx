"use client";

import React, { useMemo, useState } from "react";
import { Send, X, Info, Upload } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";
import { subirArchivoAS3Seguro } from "@/lib/utils";

type OtrosMetodosPagoModalProps = {
  onClose: () => void;
  onSubmit?: (payload: any) => Promise<void> | void;
};

type Mode = "manual" | "csv";

interface CSVRow {
  [key: string]: string;
}

type ManualForm = {
  id_solicitud_proveedor: string;
  monto_pagado: string;
  fecha_pago: string;
  concepto: string;
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const validateComprobanteFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isImage =
    ALLOWED_IMAGE_TYPES.includes(file.type) ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp");

  if (!isPdf && !isImage) {
    return {
      isValid: false,
      error: `El archivo "${file.name}" debe ser PDF o imagen (PNG, JPG, JPEG, WEBP).`,
    };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "El archivo es demasiado grande. Máximo 10MB.",
    };
  }

  return { isValid: true };
};

const validateCSVFile = (file: File): { isValid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv")) {
    return { isValid: false, error: "El archivo debe tener extensión .csv." };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: "El archivo es demasiado grande. Máximo 10MB." };
  }

  return { isValid: true };
};

const cleanMoney = (v?: string) => {
  const s = (v ?? "").replace(/[^\d.-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split("\n");
  const result: string[][] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const regex = /(?:,|\n|^)(?:"([^"]*(?:""[^"]*)*)"|([^",\n]*))/g;
    const row: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line + ",")) !== null) {
      const value =
        match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      row.push((value ?? "").trim());
    }

    result.push(row);
  }

  return result;
};

const procesarCSV = (parsedData: string[][]): CSVRow[] => {
  if (!parsedData.length) return [];

  const headers = parsedData[0].map((h) => (h ?? "").trim());
  const rows = parsedData.slice(1);

  const result: CSVRow[] = [];

  for (const row of rows) {
    if (!row || row.every((cell) => !(cell ?? "").trim())) continue;

    const item: CSVRow = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      item[header] = (row[idx] ?? "").trim();
    });

    if (item["monto_pagado"]) {
      const monto = cleanMoney(item["monto_pagado"]);
      if (monto !== null) {
        item["monto_pagado"] = monto.toFixed(2);
      }
    }

    result.push(item);
  }

  return result;
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = reject;
    reader.readAsText(file, "UTF-8");
  });
};

const initialManualForm: ManualForm = {
  id_solicitud_proveedor: "",
  monto_pagado: "",
  fecha_pago: new Date().toISOString().slice(0, 10),
  concepto: "",
};

export const OtrosMetodosPagoModal: React.FC<OtrosMetodosPagoModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<Mode>("manual");

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [comprobanteUploading, setComprobanteUploading] = useState(false);

  const [formData, setFormData] = useState<ManualForm>(initialManualForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const manualValid = useMemo(() => {
    return (
      formData.id_solicitud_proveedor.trim() !== "" &&
      formData.monto_pagado.trim() !== ""
    );
  }, [formData]);

  const updateField = (field: keyof ManualForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComprobanteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const validation = validateComprobanteFile(file);

    if (!validation.isValid) {
      setFileError(validation.error || "Error al validar el comprobante.");
      event.target.value = "";
      return;
    }

    setComprobanteFile(file);
  };

  const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setCsvFile(null);
    setCsvPreview([]);

    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const validation = validateCSVFile(file);

    if (!validation.isValid) {
      setFileError(validation.error || "Error al validar CSV.");
      event.target.value = "";
      return;
    }

    setCsvFile(file);
    setCsvLoading(true);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const csvText = e.target?.result;
        if (typeof csvText !== "string" || !csvText.trim()) {
          throw new Error("CSV vacío");
        }

        const parsed = parseCSV(csvText);
        const processed = procesarCSV(parsed);

        if (!processed.length) {
          throw new Error("El CSV no tiene filas válidas");
        }

        setCsvPreview(processed.slice(0, 20));
      } catch (error) {
        console.error(error);
        setFileError("Error al leer el archivo CSV. Verifica el formato.");
        setCsvFile(null);
        event.target.value = "";
      } finally {
        setCsvLoading(false);
      }
    };

    reader.onerror = () => {
      setFileError("Error al leer el archivo CSV.");
      setCsvFile(null);
      setCsvLoading(false);
      event.target.value = "";
    };

    reader.readAsText(file, "UTF-8");
  };

  const clearComprobanteFile = () => {
    setComprobanteFile(null);
    const input = document.getElementById("comprobante-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const clearCsvFile = () => {
    setCsvFile(null);
    setCsvPreview([]);
    const input = document.getElementById("csv-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const buildManualRow = (): CSVRow => {
    const monto = cleanMoney(formData.monto_pagado);

    return {
      id_solicitud_proveedor: formData.id_solicitud_proveedor.trim(),
      monto_pagado: monto !== null ? monto.toFixed(2) : formData.monto_pagado.trim(),
      fecha_pago: formData.fecha_pago.trim(),
      concepto: formData.concepto.trim(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFileError(null);

    if (!comprobanteFile) {
      setFormError("Por favor, sube el comprobante PDF o imagen.");
      return;
    }

    if (mode === "manual" && !manualValid) {
      setFormError("Completa id_solicitud_proveedor y monto_pagado.");
      return;
    }

    if (mode === "csv" && !csvFile) {
      setFormError("Por favor, sube el archivo CSV.");
      return;
    }

    if (csvLoading) {
      setFormError("El CSV se está procesando.");
      return;
    }

    try {
      let csvDataArray: CSVRow[] = [];

      if (mode === "manual") {
        const row = buildManualRow();

        if (!row.id_solicitud_proveedor || !row.monto_pagado) {
          setFormError("Faltan datos obligatorios.");
          return;
        }

        csvDataArray = [row];
      } else {
        const csvText = await readFileAsText(csvFile as File);
        const parsed = parseCSV(csvText);
        csvDataArray = procesarCSV(parsed);

        if (!csvDataArray.length) {
          setFormError("No se pudieron procesar los datos del CSV.");
          return;
        }

        const invalidRows = csvDataArray
          .map((r, idx) => ({ r, idx }))
          .filter(({ r }) => !r["id_solicitud_proveedor"] || !r["monto_pagado"]);

        if (invalidRows.length) {
          const sample = invalidRows
            .slice(0, 3)
            .map(({ idx }) => idx + 2)
            .join(", ");

          setFormError(
            `Hay filas sin id_solicitud_proveedor o monto_pagado. Ejemplo: ${sample}.`
          );
          return;
        }
      }

      setComprobanteUploading(true);
      const urlComprobante = await subirArchivoAS3Seguro(comprobanteFile);

      const payload =
        mode === "manual"
          ? {
              frontendData: {
                id_solicitud_proveedor: csvDataArray[0].id_solicitud_proveedor,
                monto_pagado: Number(csvDataArray[0].monto_pagado),
                fecha_pago: csvDataArray[0].fecha_pago || new Date().toISOString(),
                concepto: csvDataArray[0].concepto || "",
                url_pdf: urlComprobante,
              },
              isMasivo: false,
            }
          : {
              frontendData: {
                url_pdf: urlComprobante,
              },
              isMasivo: true,
              csvData: csvDataArray.map((row) => ({
                id_solicitud_proveedor: row.id_solicitud_proveedor,
                monto_pagado: row.monto_pagado,
                fecha_pago: row.fecha_pago || "",
                concepto: row.concepto || "",
              })),
            };

      const response = await fetch(`${API_URL}/mia/pago_proveedor/comprobante_pago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data?.details || "Ocurrió un error al guardar el comprobante.");
        return;
      }

      if (onSubmit) {
        await onSubmit(payload);
      }

      onClose();
    } catch (error) {
      console.error(error);
      setFormError("Ocurrió un error al procesar la solicitud.");
    } finally {
      setComprobanteUploading(false);
    }
  };

  return (
    <div className="h-fit w-[95vw] max-w-3xl relative bg-white rounded-lg shadow-lg">
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start rounded-t-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">
                Otros métodos de pago
              </h3>
              <p className="text-xs text-blue-700">
                Puedes capturar un registro o cargar varios por CSV.
              </p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            </div>
          )}

          {fileError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error en archivo</h3>
                <p className="text-xs text-red-700">{fileError}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Una solicitud
            </button>

            <button
              type="button"
              onClick={() => setMode("csv")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "csv" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Varias por CSV
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="comprobante-file" className="block text-sm font-medium text-gray-700">
              Subir comprobante
            </label>

            <div className="relative">
              <input
                id="comprobante-file"
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleComprobanteChange}
                className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <Upload className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Acepta PDF o imagen. Se aplicará al registro manual o a todas las filas del CSV.
              </p>
              {comprobanteFile && (
                <button
                  type="button"
                  onClick={clearComprobanteFile}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Limpiar comprobante
                </button>
              )}
            </div>

            {comprobanteFile && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between text-xs bg-white p-2 rounded">
                  <span className="truncate">{comprobanteFile.name}</span>
                  <span className="text-gray-500">{(comprobanteFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}
          </div>

          {mode === "manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="id_solicitud_proveedor *"
                value={formData.id_solicitud_proveedor}
                onChange={(e) => updateField("id_solicitud_proveedor", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="monto_pagado *"
                value={formData.monto_pagado}
                onChange={(e) => updateField("monto_pagado", e.target.value)}
              />
              <input
                type="date"
                className="border rounded-lg p-3 text-sm"
                value={formData.fecha_pago}
                onChange={(e) => updateField("fecha_pago", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="concepto"
                value={formData.concepto}
                onChange={(e) => updateField("concepto", e.target.value)}
              />
            </div>
          )}

          {mode === "csv" && (
            <div className="space-y-2">
              <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700">
                Subir archivo CSV
              </label>

              <div className="relative">
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvChange}
                  className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <Upload className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Encabezados: id_solicitud_proveedor, monto_pagado, fecha_pago, concepto
                </p>
                {csvFile && (
                  <button
                    type="button"
                    onClick={clearCsvFile}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Limpiar CSV
                  </button>
                )}
              </div>

              {csvPreview.length > 0 && !csvLoading && (
                <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-700 mb-2">Preview</p>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {csvPreview.map((r, i) => (
                      <div key={i} className="text-xs bg-white p-2 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-700">{r["id_solicitud_proveedor"] || "—"}</span>
                          <span className="text-gray-500">${r["monto_pagado"] || "—"}</span>
                        </div>
                        <div className="text-gray-500 truncate">
                          {r["fecha_pago"] || ""} {r["concepto"] ? `• ${r["concepto"]}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 px-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                comprobanteUploading ||
                !comprobanteFile ||
                (mode === "manual" ? !manualValid : !csvFile || csvLoading)
              }
              className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 ${
                comprobanteUploading ||
                !comprobanteFile ||
                (mode === "manual" ? !manualValid : !csvFile || csvLoading)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send className="w-4 h-4" />
              {comprobanteUploading ? "Subiendo y guardando..." : "Guardar comprobante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};