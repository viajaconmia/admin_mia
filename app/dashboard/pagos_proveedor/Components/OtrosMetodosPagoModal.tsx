"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Send, X, Info, Upload, Eye } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";
import { subirArchivoAS3Seguro } from "@/lib/utils";

type SolicitudSeleccionadaComprobante = {
  id_solicitud_proveedor: string;
  monto_solicitado: number;
  monto_pagado?: string;
  codigo_confirmacion?: string | null;
};

type OtrosMetodosPagoModalProps = {
  onClose: () => void;
  onSubmit?: (payload: any) => Promise<void> | void;
  selectedSolicitudes?: SolicitudSeleccionadaComprobante[];
  /** Si es true, oculta el modo "Varias por CSV" y solo permite subir el comprobante de pago. */
  onlyComprobante?: boolean;
};

type Mode = "manual" | "csv";

interface CSVRow {
  [key: string]: string;
}

type ManualForm = {
  id_solicitud_proveedor: string;
  codigo_confirmacion: string;
  monto_pagado: string;
  fecha_pago: string;
  concepto: string;
  comentarios_ap: string;
};

const normalizeHeader = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

const pickFirstValue = (row: CSVRow, aliases: string[]) => {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    const value = row[key];
    if (String(value ?? "").trim() !== "") return String(value).trim();
  }
  return "";
};

const validateComprobanteFile = (
  file: File,
): { isValid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase();

  // Extensiones válidas — incluye heic/heif para iOS "Files" app
  const allowedExtensions = [
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif",
  ];

  // En Android, la cámara suele devolver file.type = "" (vacío).
  // En iOS desde "Files", puede venir image/heic o image/heif.
  // Por eso aceptamos cualquier image/* y también tipo vacío (confiar en accept + extensión).
  const hasValidMime =
    file.type === "" ||                   // Android camera — sin MIME
    file.type.startsWith("image/") ||     // cualquier imagen, incluyendo heic/heif
    file.type === "application/pdf";

  const hasValidExtension = allowedExtensions.some((ext) =>
    fileName.endsWith(ext),
  );

  if (!hasValidMime && !hasValidExtension) {
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

  const headers = parsedData[0].map((h) => normalizeHeader(h ?? ""));
  const rows = parsedData.slice(1);

  const result: CSVRow[] = [];

  for (const row of rows) {
    if (!row || row.every((cell) => !(cell ?? "").trim())) continue;

    const rawItem: CSVRow = {};

    headers.forEach((header, idx) => {
      if (!header) return;
      rawItem[header] = (row[idx] ?? "").trim();
    });

    const idSolicitud = pickFirstValue(rawItem, [
      "id_solicitud_proveedor",
      "id_solicitud",
    ]);

    const codigoConfirmacion = pickFirstValue(rawItem, [
      "codigo_confirmacion",
      "codigo_reserva",
      "folio",
    ]);

    const monto = cleanMoney(
      pickFirstValue(rawItem, ["monto_pagado", "monto", "total"]),
    );

    const fechaPago = pickFirstValue(rawItem, ["fecha_pago", "fecha"]);
    const concepto = pickFirstValue(rawItem, ["concepto"]);

    result.push({
      id_solicitud_proveedor: idSolicitud,
      codigo_confirmacion: codigoConfirmacion,
      monto_pagado: monto !== null ? monto.toFixed(2) : "",
      fecha_pago: fechaPago,
      concepto,
    });
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

const today = () => new Date().toISOString().slice(0, 10);

const initialManualForm: ManualForm = {
  id_solicitud_proveedor: "",
  codigo_confirmacion: "",
  monto_pagado: "",
  fecha_pago: today(),
  concepto: "",
  comentarios_ap: "",
};

const buildSelectedForms = (
  selectedSolicitudes: SolicitudSeleccionadaComprobante[] = [],
): ManualForm[] => {
  return selectedSolicitudes.map((item) => ({
    id_solicitud_proveedor: String(item.id_solicitud_proveedor ?? "").trim(),
    codigo_confirmacion: String(item.codigo_confirmacion ?? "").trim(),
    monto_pagado:
      item.monto_pagado != null
        ? String(item.monto_pagado).trim()
        : Number(item.monto_solicitado ?? 0).toFixed(2),
    fecha_pago: today(),
    concepto: "",
    comentarios_ap: "",
  }));
};

export const OtrosMetodosPagoModal: React.FC<OtrosMetodosPagoModalProps> = ({
  onClose,
  onSubmit,
  selectedSolicitudes = [],
  onlyComprobante = false,
}) => {
  const [mode, setMode] = useState<Mode>("manual");

  const [pdfFiles, setPdfFiles] = useState<(File | null)[]>([null, null]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([
    null,
    null,
  ]);
  const [showMobilePreviewIndex, setShowMobilePreviewIndex] = useState<
    number | null
  >(null);
  const [montoPagado2, setMontoPagado2] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);

  const [formData, setFormData] = useState<ManualForm>(() => {
    if (selectedSolicitudes.length === 1) {
      return buildSelectedForms(selectedSolicitudes)[0];
    }
    return initialManualForm;
  });

  const [selectedForms, setSelectedForms] = useState<ManualForm[]>(
    buildSelectedForms(selectedSolicitudes),
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    const urls = pdfFiles.map((file) =>
      file ? URL.createObjectURL(file) : null,
    );
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [pdfFiles]);

  useEffect(() => {
    const rows = buildSelectedForms(selectedSolicitudes);
    setSelectedForms(rows);

    if (rows.length === 1) {
      setFormData(rows[0]);
      setMode("manual");
    }

    if (rows.length > 1) {
      setMode("manual");
    }
  }, [selectedSolicitudes]);

  const hasSelectedRows = selectedForms.length > 1;

  const originalMontoMap = useMemo(() => {
    const map: Record<string, number> = {};
    selectedSolicitudes.forEach((s) => {
      map[String(s.id_solicitud_proveedor)] = Number(s.monto_solicitado ?? 0);
    });
    return map;
  }, [selectedSolicitudes]);

  const manualValid = useMemo(() => {
  if (hasSelectedRows) {
    return selectedForms.every(
      (row) => row.id_solicitud_proveedor.trim() !== "",
    );
  }

  return (
    formData.id_solicitud_proveedor.trim() !== "" ||
    formData.codigo_confirmacion.trim() !== ""
  );
}, [formData, selectedForms, hasSelectedRows]);

  const updateField = (field: keyof ManualForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSelectedField = (
    index: number,
    field: keyof ManualForm,
    value: string,
  ) => {
    setSelectedForms((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

const handlePdfChange =
  (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const validation = validateComprobanteFile(file);

    if (!validation.isValid) {
      setFileError(validation.error || "Error al validar el comprobante.");
      event.target.value = "";
      return;
    }

    setPdfFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
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

  const clearPdfFile = (index: number) => {
    setPdfFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (index === 1) setMontoPagado2("");
    const input = document.getElementById(
      `pdf-file-${index}`,
    ) as HTMLInputElement | null;
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
    codigo_confirmacion: formData.codigo_confirmacion.trim(),
    monto_pagado:
      monto !== null ? monto.toFixed(2) : formData.monto_pagado.trim(),
    fecha_pago: formData.fecha_pago.trim(),
    concepto: formData.concepto.trim(),
    comentarios_ap: formData.comentarios_ap.trim(),
  };
};

const buildSelectedRows = (): CSVRow[] => {
  return selectedForms.map((row) => {
    const monto = cleanMoney(row.monto_pagado);

    return {
      id_solicitud_proveedor: row.id_solicitud_proveedor.trim(),
      codigo_confirmacion: row.codigo_confirmacion.trim(),
      monto_pagado:
        monto !== null ? monto.toFixed(2) : row.monto_pagado.trim(),
      fecha_pago: row.fecha_pago.trim(),
      concepto: row.concepto.trim(),
      comentarios_ap: row.comentarios_ap.trim(),
    };
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFileError(null);

    if (!pdfFiles[0]) {
      setFormError("Por favor, sube el comprobante en PDF o imagen.");
      return;
    }

    const hasSecondFile =
      mode === "manual" && !hasSelectedRows && !!pdfFiles[1];

    if (hasSecondFile && cleanMoney(montoPagado2) === null) {
      setFormError("Captura el monto del segundo comprobante.");
      return;
    }

    if (mode === "manual" && !manualValid) {
      setFormError("Completa los campos obligatorios.");
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
        if (hasSelectedRows) {
          csvDataArray = buildSelectedRows();

          const invalidRows = csvDataArray
  .map((r, idx) => ({ r, idx }))
  .filter(
    ({ r }) =>
      !String(r["id_solicitud_proveedor"] ?? "").trim() &&
      !String(r["codigo_confirmacion"] ?? "").trim(),
  );

          if (invalidRows.length) {
            const sample = invalidRows
              .slice(0, 3)
              .map(({ idx }) => idx + 1)
              .join(", ");

            setFormError(
              `Hay solicitudes seleccionadas incompletas. Ejemplo: ${sample}.`,
            );
            return;
          }

          // Validar cambios de monto en solicitudes seleccionadas
          for (let i = 0; i < selectedForms.length; i++) {
            const form = selectedForms[i];
            const originalMonto = originalMontoMap[form.id_solicitud_proveedor];
            if (originalMonto === undefined) continue;
            const newMonto = cleanMoney(form.monto_pagado);
            if (newMonto === null) continue;
            const diff = Math.abs(newMonto - originalMonto);
            if (diff > 50) {
              setFormError(
                `Solicitud ${i + 1} (${form.id_solicitud_proveedor}): el monto no puede cambiar más de $50.00 (original: $${originalMonto.toFixed(2)}, nuevo: $${newMonto.toFixed(2)}).`,
              );
              return;
            }
            if (diff > 0 && !form.comentarios_ap.trim()) {
              setFormError(
                `Solicitud ${i + 1} (${form.id_solicitud_proveedor}): se cambió el monto. Debes capturar un comentario en "Razón del ajuste".`,
              );
              return;
            }
          }
        } else {
          const row = buildManualRow();

          if (!row.id_solicitud_proveedor && !row.codigo_confirmacion) {
            setFormError("Debes capturar id_solicitud_proveedor o codigo_confirmacion.");
            return;
          }

          // Validar cambio de monto en formulario individual
          const originalMonto = originalMontoMap[formData.id_solicitud_proveedor];
          if (originalMonto !== undefined) {
            const newMonto = cleanMoney(formData.monto_pagado);
            if (newMonto !== null) {
              const diff = Math.abs(newMonto - originalMonto);
              if (diff > 50) {
                setFormError(
                  `El monto no puede cambiar más de $50.00 (original: $${originalMonto.toFixed(2)}, nuevo: $${newMonto.toFixed(2)}).`,
                );
                return;
              }
              if (diff > 0 && !formData.comentarios_ap.trim()) {
                setFormError(
                  "Se cambió el monto. Debes capturar un comentario en \"Razón del ajuste\".",
                );
                return;
              }
            }
          }

          csvDataArray = [row];
        }
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
  .filter(
    ({ r }) =>
      !String(r["id_solicitud_proveedor"] ?? "").trim() &&
      !String(r["codigo_confirmacion"] ?? "").trim(),
  );

        if (invalidRows.length) {
          const sample = invalidRows
            .slice(0, 3)
            .map(({ idx }) => idx + 2)
            .join(", ");

          setFormError(
            `Hay filas sin identificador válido o sin monto_pagado. Cada fila debe traer id_solicitud_proveedor / id_solicitud o codigo_confirmacion. Ejemplo: ${sample}.`,
          );
          return;
        }
      }

      setPdfUploading(true);
      const urlPdf = await subirArchivoAS3Seguro(pdfFiles[0] as File);

      const payload =
        csvDataArray.length === 1
          ? {
              frontendData: {
                id_solicitud_proveedor: csvDataArray[0].id_solicitud_proveedor || "",
                codigo_confirmacion: csvDataArray[0].codigo_confirmacion || "",
                monto_pagado: csvDataArray[0].monto_pagado
                  ? Number(csvDataArray[0].monto_pagado)
                  : null,
                fecha_pago: csvDataArray[0].fecha_pago || "",
                concepto: csvDataArray[0].concepto || "",
                comentarios_ap: csvDataArray[0].comentarios_ap || "",
                url_pdf: urlPdf,
              },
              isMasivo: false,
            }
          : {
              frontendData: {
                url_pdf: urlPdf,
              },
              isMasivo: true,
              csvData: csvDataArray.map((row) => ({
                id_solicitud_proveedor: row.id_solicitud_proveedor || "",
                codigo_confirmacion: row.codigo_confirmacion || "",
                monto_pagado: row.monto_pagado || "",
                fecha_pago: row.fecha_pago || "",
                concepto: row.concepto || "",
                comentarios_ap: row.comentarios_ap || "",
              })),
            };

      const response = await fetch(
        `${API_URL}/mia/pago_proveedor/comprobante_pago`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(
          data?.details || "Ocurrió un error al guardar el comprobante.",
        );
        return;
      }

      // Segundo comprobante: se sube y se envía por separado con su propio monto
      if (hasSecondFile && payload.frontendData) {
        const urlPdf2 = await subirArchivoAS3Seguro(pdfFiles[1] as File);
        const monto2 = cleanMoney(montoPagado2);

        const payload2 = {
          frontendData: {
            ...payload.frontendData,
            monto_pagado: monto2,
            url_pdf: urlPdf2,
          },
          isMasivo: false,
        };

        const response2 = await fetch(
          `${API_URL}/mia/pago_proveedor/comprobante_pago`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify(payload2),
          },
        );

        const data2 = await response2.json();

        if (!response2.ok) {
          setFormError(
            data2?.details ||
              "Ocurrió un error al guardar el segundo comprobante.",
          );
          return;
        }

        if (onSubmit) {
          await onSubmit(payload2);
        }
      }

      if (onSubmit) {
        await onSubmit(payload);
      }

      onClose();
    } catch (error) {
      console.error(error);
      setFormError("Ocurrió un error al procesar la solicitud.");
    } finally {
      setPdfUploading(false);
    }
  };

  const renderFileSlot = (index: number, label: string) => {
    const file = pdfFiles[index];
    const previewUrl = previewUrls[index];
    const isPdf =
      !!file &&
      (file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"));

    return (
      <div className="space-y-2">
        <label
          htmlFor={`pdf-file-${index}`}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>

        <div className="relative">
          <input
            id={`pdf-file-${index}`}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handlePdfChange(index)}
            className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          <Upload className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {file && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => clearPdfFile(index)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar
            </button>
          </div>
        )}

        {previewUrl && file && (
          <>
            {/* Preview — imágenes inline, PDFs abren en nueva pestaña */}
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                <span className="text-[11px] text-gray-500 truncate max-w-[60%]">
                  {file.name}
                </span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Abrir en nueva pestaña
                </a>
              </div>
              {isPdf ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 text-center">
                  <p className="text-xs text-gray-500">
                    PDF seleccionado correctamente.
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver PDF
                  </a>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa comprobante"
                  className="w-full max-h-64 object-contain p-2"
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-[96vw] ${
        hasSelectedRows && selectedForms.length > 1 ? "max-w-6xl" : "max-w-3xl"
      } relative bg-white rounded-lg shadow-lg flex flex-col max-h-[90dvh]`}
    >
      <div
        className={`mx-auto ${
          hasSelectedRows && selectedForms.length > 1 ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start rounded-t-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">
                {onlyComprobante ? "Comprobante de pago" : "Otros métodos de pago"}
              </h3>
              <p className="text-xs text-blue-700">
                {onlyComprobante
                  ? "Sube el comprobante de pago para las solicitudes seleccionadas."
                  : "Puedes capturar un registro, usar las solicitudes seleccionadas o cargar CSV."}
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

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {!onlyComprobante && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {hasSelectedRows
                  ? `Seleccionadas (${selectedForms.length})`
                  : "Una solicitud"}
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
          )}

          <div className="space-y-4">
            {renderFileSlot(0, "Subir comprobante (PDF o imagen)")}
            <p className="text-xs text-gray-500 -mt-2">
              Se aplicará este archivo (PDF o imagen) al registro individual o a todas las solicitudes.
            </p>

            {mode === "manual" && !hasSelectedRows && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                {renderFileSlot(1, "Segundo comprobante (opcional)")}
                {pdfFiles[1] && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Monto del segundo comprobante *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded-lg p-3 text-sm w-full"
                      placeholder="monto_pagado"
                      value={montoPagado2}
                      onChange={(e) => setMontoPagado2(e.target.value)}
                    />
                    <p className="text-[11px] text-gray-500">
                      Se enviará como un comprobante adicional para la misma solicitud, con su propia URL y monto.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {mode === "manual" && hasSelectedRows && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  Solicitudes seleccionadas: {selectedForms.length}
                </p>
                <p className="text-xs text-slate-500">
                  Puedes editar monto, fecha y concepto por cada solicitud.
                </p>
              </div>

              <div className="max-h-[52vh] overflow-auto pr-1 space-y-3">
                {selectedForms.map((row, index) => (
                  <div
                    key={`${row.id_solicitud_proveedor}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 text-xs font-semibold text-slate-600">
                      Solicitud {index + 1}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        className="border rounded-lg p-3 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="id_solicitud_proveedor"
                        value={row.id_solicitud_proveedor}
                        readOnly
                      />

                      <input
                        className="border rounded-lg p-3 text-sm"
                        placeholder="codigo_confirmacion"
                        value={row.codigo_confirmacion}
                        onChange={(e) =>
                          updateSelectedField(index, "codigo_confirmacion", e.target.value)
                        }
                      />

                      <div className="space-y-1">
                        <input
                          className="border rounded-lg p-3 text-sm w-full"
                          placeholder="monto_pagado"
                          type="number"
                          step="0.01"
                          value={row.monto_pagado}
                          onChange={(e) =>
                            updateSelectedField(index, "monto_pagado", e.target.value)
                          }
                        />
                        {originalMontoMap[row.id_solicitud_proveedor] !== undefined && (
                          <p className="text-[11px] text-slate-400">
                            Original: ${Number(originalMontoMap[row.id_solicitud_proveedor]).toFixed(2)} · máx. ±$50.00
                          </p>
                        )}
                      </div>

                      <input
                        type="date"
                        className="border rounded-lg p-3 text-sm"
                        value={row.fecha_pago}
                        onChange={(e) =>
                          updateSelectedField(index, "fecha_pago", e.target.value)
                        }
                      />

                      <input
                        className="border rounded-lg p-3 text-sm md:col-span-2"
                        placeholder="concepto"
                        value={row.concepto}
                        onChange={(e) =>
                          updateSelectedField(index, "concepto", e.target.value)
                        }
                      />

                      {(() => {
                        const original = originalMontoMap[row.id_solicitud_proveedor];
                        const newMonto = cleanMoney(row.monto_pagado);
                        const changed = original !== undefined && newMonto !== null && Math.abs(newMonto - original) > 0;
                        return changed ? (
                          <textarea
                            className="border rounded-lg p-3 text-sm md:col-span-2 resize-none"
                            placeholder="Razón del ajuste de monto (requerido) *"
                            rows={2}
                            value={row.comentarios_ap}
                            onChange={(e) =>
                              updateSelectedField(index, "comentarios_ap", e.target.value)
                            }
                          />
                        ) : null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "manual" && !hasSelectedRows && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="id_solicitud_proveedor *"
                value={formData.id_solicitud_proveedor}
                onChange={(e) => updateField("id_solicitud_proveedor", e.target.value)}
              />

              <div className="space-y-1">
                <input
                  className="border rounded-lg p-3 text-sm w-full"
                  placeholder="monto_pagado *"
                  type="number"
                  step="0.01"
                  value={formData.monto_pagado}
                  onChange={(e) => updateField("monto_pagado", e.target.value)}
                />
                {originalMontoMap[formData.id_solicitud_proveedor] !== undefined && (
                  <p className="text-[11px] text-slate-400">
                    Original: ${Number(originalMontoMap[formData.id_solicitud_proveedor]).toFixed(2)} · máx. ±$50.00
                  </p>
                )}
              </div>

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

              {(() => {
                const original = originalMontoMap[formData.id_solicitud_proveedor];
                const newMonto = cleanMoney(formData.monto_pagado);
                const changed = original !== undefined && newMonto !== null && Math.abs(newMonto - original) > 0;
                return changed ? (
                  <textarea
                    className="border rounded-lg p-3 text-sm md:col-span-2 resize-none"
                    placeholder="Razón del ajuste de monto (requerido) *"
                    rows={2}
                    value={formData.comentarios_ap}
                    onChange={(e) => updateField("comentarios_ap", e.target.value)}
                  />
                ) : null;
              })()}
            </div>
          )}

          {!onlyComprobante && mode === "csv" && (
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
                  Encabezados permitidos: id_solicitud_proveedor o id_solicitud, o codigo_confirmacion, monto_pagado, fecha_pago, concepto
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
                          <span className="text-gray-700">
                            {r["id_solicitud_proveedor"] ||
                              r["codigo_confirmacion"] ||
                              "—"}
                          </span>
                          <span className="text-gray-500">
                            ${r["monto_pagado"] || "—"}
                          </span>
                        </div>
                        <div className="text-gray-500 truncate">
                          {r["codigo_confirmacion"]
                            ? `Código: ${r["codigo_confirmacion"]}`
                            : r["id_solicitud_proveedor"]
                              ? `Solicitud: ${r["id_solicitud_proveedor"]}`
                              : ""}
                          {(r["fecha_pago"] || r["concepto"]) ? " • " : ""}
                          {r["fecha_pago"] || ""}
                          {r["concepto"] ? ` ${r["concepto"]}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer fijo con botones */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 flex gap-3 bg-white rounded-b-lg">
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
              pdfUploading ||
              !pdfFiles[0] ||
              (mode === "manual" && !hasSelectedRows && !!pdfFiles[1] && cleanMoney(montoPagado2) === null) ||
              (mode === "manual" ? !manualValid : !csvFile || csvLoading)
            }
            className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 ${
              pdfUploading ||
              !pdfFiles[0] ||
              (mode === "manual" && !hasSelectedRows && !!pdfFiles[1] && cleanMoney(montoPagado2) === null) ||
              (mode === "manual" ? !manualValid : !csvFile || csvLoading)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Send className="w-4 h-4" />
            {pdfUploading ? "Subiendo y guardando..." : "Guardar comprobante"}
          </button>
        </div>
      </form>
      </div>

      {/* Mobile full-screen preview */}
      {showMobilePreviewIndex !== null &&
        previewUrls[showMobilePreviewIndex] &&
        pdfFiles[showMobilePreviewIndex] &&
        (() => {
        const previewUrl = previewUrls[showMobilePreviewIndex] as string;
        const pdfFile = pdfFiles[showMobilePreviewIndex] as File;
        const isPdf = pdfFile.type === "application/pdf" || pdfFile.name.toLowerCase().endsWith(".pdf");
        return (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col sm:hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
              <span className="text-sm text-white font-medium truncate max-w-[75%]">{pdfFile.name}</span>
              <div className="flex items-center gap-3">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-blue-200"
                >
                  Abrir
                </a>
                <button
                  type="button"
                  onClick={() => setShowMobilePreviewIndex(null)}
                  className="text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-900/40 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-red-300" />
                  </div>
                  <p className="text-white font-medium text-sm">{pdfFile.name}</p>
                  <p className="text-gray-400 text-xs">Los PDFs no se pueden previsualizar en móvil.</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                  >
                    Abrir PDF
                  </a>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa comprobante"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};