"use client";

import React, { useState } from "react";
import { Send, X, Info, Upload } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";
import { useAuth } from "@/context/AuthContext";
import { subirArchivoAS3Seguro } from "@/lib/utils";


type Comprobante = {
  onClose: () => void;
  onSubmit?: (payload: any) => Promise<void> | void;
};

// Interface para datos del CSV
interface CSVData {
  [key: string]: string;
}

type DispersionInfo = {
  codigo_dispersion: string; // 8 chars (según tu regex)
  id_dispersion: string; // numeric (lo que quede)
};

const extractDispersionInfo = (referencia?: string): DispersionInfo | null => {
  if (!referencia) return null;

  // Normaliza por si viene con espacios raros
  const ref = referencia.trim();

  // FORMATO NUEVO (el que me indicas):
  // ... wx<codigo>xw<id>
  // Ej: "852 wxDZQIH7Cxw107"
  const reNew = /wx"?\s*([A-Za-z0-9]+)\s*"?xw\s*(\d+)/i;
  const mNew = ref.match(reNew);

  if (mNew) {
    const info = {
      codigo_dispersion: mNew[1].trim(),
      id_dispersion: mNew[2].trim(),
    };
    console.log("🧩 extractDispersionInfo (NEW):", info, "ref:", referencia);
    return info;
  }

  // (OPCIONAL) Fallback por si en algún CSV viejo te llega:
  // ... wx<codigo><id>xw
  // Ej: "852 wxDZQIH7C107xw"
  const reOld = /wx"?\s*([A-Za-z0-9]+?)\s*(\d+)\s*"?xw/i;
  const mOld = ref.match(reOld);

  if (mOld) {
    const info = {
      codigo_dispersion: mOld[1].trim(),
      id_dispersion: mOld[2].trim(),
    };
    console.log("🧩 extractDispersionInfo (OLD):", info, "ref:", referencia);
    return info;
  }

  return null;
};


// =========================
// Helpers: PDF / CSV
// =========================
const validatePDFFiles = (
  files: FileList
): { isValid: boolean; error?: string; validFiles?: File[] } => {
  const validFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.type !== "application/pdf") {
      return {
        isValid: false,
        error: `El archivo "${file.name}" no es un PDF válido. Solo se permiten archivos PDF.`,
      };
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf")) {
      return {
        isValid: false,
        error: `El archivo "${file.name}" debe tener extensión .pdf`,
      };
    }

    validFiles.push(file);
  }

  return { isValid: true, validFiles };
};

const validateCSVFile = (file: File): { isValid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv")) {
    return { isValid: false, error: `El archivo debe tener extensión .csv` };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: `El archivo es demasiado grande. Máximo permitido: 10MB` };
  }

  return { isValid: true };
};

// =========================
// Helpers: dinero / cargo
// =========================
const cleanMoney = (v?: string) => {
  const s = (v ?? "").replace(/[^\d.-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// Prioriza "Cargo" (como tu CSV), con fallback a "Abono" o "Monto" si el banco cambia
const getCargoFromCSVRow = (row: CSVData) => {
  const cargo = cleanMoney(row["Cargo"]);
  const abono = cleanMoney(row["Abono"]);
  const monto = cleanMoney(row["Monto"]);
  return cargo ?? abono ?? monto;
};

// =========================
// Parse CSV (simple)
// =========================
const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split("\n");
  const result: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const regex = /(?:,|\n|^)(?:"([^"]*(?:""[^"]*)*)"|([^",\n]*))/g;
    const row: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line + ",")) !== null) {
      const value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      row.push((value ?? "").trim());
    }

    result.push(row);
  }

  return result;
};

// =========================
// Procesar CSV a objetos
//  - detecta encabezados
//  - extrae codigo/id por fila
//  - agrega "cargo" normalizado (string "0.00")
// =========================
const procesarTodosLosDatosCSV = (parsedData: string[][]): CSVData[] => {
  if (parsedData.length < 1) return [];

  const result: CSVData[] = [];

  // 1) Encontrar fila de headers (contiene "Referencia" o "Referencia Ampliada")
  let headerIndex = 0;
  for (let i = 0; i < parsedData.length; i++) {
    const rowLower = parsedData[i].map((cell) => (cell ?? "").trim().toLowerCase());
    if (rowLower.includes("referencia ampliada") || rowLower.includes("referencia")) {
      headerIndex = i;
      break;
    }
  }

  // 2) Headers (trim) y data rows
  const headers = parsedData[headerIndex].map((h) => (h ?? "").trim());
  const dataRows = parsedData.slice(headerIndex + 1);

  for (const row of dataRows) {
    if (!row || row.length === 0 || row.every((cell) => (cell ?? "").trim() === "")) continue;

    const csvData: CSVData = {};

    // map columnas
    headers.forEach((header, idx) => {
      if (!header) return;
      csvData[header] = (row[idx] ?? "").trim();
    });

    // extraer dispersion
    const referenciaAmpliada = csvData["Referencia Ampliada"];
    const referenciaSimple = csvData["Referencia"];

    const info =
      extractDispersionInfo(referenciaAmpliada) || extractDispersionInfo(referenciaSimple);

    if (info) {
      csvData["codigo_dispersion"] = info.codigo_dispersion;
      csvData["id_dispersion"] = info.id_dispersion;
    }

    // normalizar cargo (string "0.00") para enviar al backend de forma consistente
    const cargoNum = getCargoFromCSVRow(csvData);
    if (cargoNum !== null) {
      csvData["cargo"] = cargoNum.toFixed(2);
    }

    result.push(csvData);
  }

  return result;
};

// =========================
// Read file helper
// =========================
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = reject;
    reader.readAsText(file, "UTF-8");
  });
};

export const ComprobanteModal: React.FC<Comprobante> = ({ onClose, onSubmit }) => {
  // Masivo es el default y ÚNICO modo ahora
  const isMasivo = true;

  const { user } = useAuth();

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<{ done: number; total: number } | null>(
  null
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // (opcional) preview para debug
  const [csvPreview, setCsvPreview] = useState<CSVData[]>([]);

  const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (event.target.files && event.target.files.length > 0) {
      const validation = validatePDFFiles(event.target.files);

      if (!validation.isValid) {
        setFileError(validation.error || "Error al validar archivos PDF");
        event.target.value = "";
        return;
      }

      setPdfFiles(validation.validFiles || []);
    }
  };

  const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setCsvFile(null);
    setCsvPreview([]);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validation = validateCSVFile(file);

      if (!validation.isValid) {
        setFileError(validation.error || "Error al validar archivo CSV");
        event.target.value = "";
        return;
      }

      setCsvFile(file);
      setCsvLoading(true);

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const csvText = e.target?.result;
        try {
          if (typeof csvText !== "string" || !csvText.trim()) {
            throw new Error("CSV vacío");
          }

          const parsed = parseCSV(csvText);
          const processed = procesarTodosLosDatosCSV(parsed);

          if (processed.length === 0) {
            throw new Error("El CSV no tiene filas válidas");
          }

          // Guardar preview (debug)
          setCsvPreview(processed.slice(0, 20));
          console.log("✅ CSV filas procesadas:", processed.length);
        } catch (err) {
          console.error(err);
          setFileError("Error al leer el archivo CSV. Verifica el formato.");
          setCsvFile(null);
          event.target.value = "";
        } finally {
          setCsvLoading(false);
        }
      };

      reader.onerror = () => {
        setFileError("Error al leer el archivo CSV");
        setCsvFile(null);
        setCsvLoading(false);
        event.target.value = "";
      };

      reader.readAsText(file, "UTF-8");
    }
  };

  const clearPdfFiles = () => {
    setPdfFiles([]);
  };

  const clearCsvFile = () => {
    setCsvFile(null);
    setCsvPreview([]);
    const csvInput = document.getElementById("csv-file") as HTMLInputElement;
    if (csvInput) csvInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError(null);
  setFileError(null);

  if (!csvFile) {
    setFormError("Por favor, sube el archivo CSV.");
    return;
  }

  if (pdfFiles.length === 0) {
    setFormError("Por favor, sube al menos un comprobante PDF.");
    return;
  }

  if (csvLoading) {
    setFormError("El CSV se está procesando. Intenta nuevamente en unos segundos.");
    return;
  }

  try {
    // ==========================
    // 1) Procesar CSV completo
    // ==========================
    const csvText = await readFileAsText(csvFile);
    const parsed = parseCSV(csvText);
    const csvDataArray = procesarTodosLosDatosCSV(parsed);

    if (csvDataArray.length === 0) {
      setFormError("No se pudieron procesar los datos del CSV o el archivo está vacío.");
      return;
    }

    // ==========================
    // 2) Validar filas
    // ==========================
    const invalidRows = csvDataArray
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => !r["codigo_dispersion"] || !r["id_dispersion"] || !r["cargo"]);

    if (invalidRows.length > 0) {
      const sample = invalidRows.slice(0, 3).map(({ idx }) => idx + 1).join(", ");
      setFormError(
        `Hay filas sin "codigo_dispersion", "id_dispersion" o "Cargo". Filas (1-based) ejemplo: ${sample}.`
      );
      return;
    }

    // ==========================
    // 3) Construir pagos + total cargo
    // ==========================
    const pagos = csvDataArray.map((r) => ({
      codigo_dispersion: r["codigo_dispersion"],
      id_dispersion: r["id_dispersion"],
      cargo: Number(r["cargo"]),
      referencia: r["Referencia Ampliada"] || r["Referencia"] || "",
      fecha_operacion: r["Fecha Operación"] || "",
      concepto: r["Concepto"] || "",
    }));

    const totalCargo = pagos.reduce(
      (acc, p) => acc + (Number.isFinite(p.cargo) ? p.cargo : 0),
      0
    );

    // ==========================
    // 4) Código global único
    // ==========================
    const uniqueCodes = Array.from(
      new Set(pagos.map((p) => p.codigo_dispersion).filter(Boolean))
    );

    if (uniqueCodes.length !== 1) {
      setFormError(
        `El CSV contiene múltiples códigos de dispersión (${uniqueCodes.join(
          ", "
        )}). Debe venir 1 solo código por carga masiva.`
      );
      return;
    }

    const codigoDispersionGlobal = uniqueCodes[0];

    // ==========================
    // 5) Montos por key (codigo+id)
    // ==========================
    const montosByDispersionKey: Record<string, string> = {};
    for (const p of pagos) {
      const key = `${p.codigo_dispersion}${p.id_dispersion}`;
      montosByDispersionKey[key] = Number(p.cargo).toFixed(2);
    }

    // ==========================
    // 6) SUBIR PDFs A S3 ✅✅✅
    // ==========================
    setPdfUploading(true);
    setPdfUploadProgress({ done: 0, total: pdfFiles.length });

    const pdfsSubidos: Array<{
      name: string;
      size: number;
      type: string;
      url: string;
    }> = [];

    for (const file of pdfFiles) {
      const url = await subirArchivoAS3Seguro(file); // 👈 devuelve tu URL
      pdfsSubidos.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      });

      setPdfUploadProgress((prev) => {
        if (!prev) return { done: 1, total: pdfFiles.length };
        return { ...prev, done: prev.done + 1 };
      });
    }

    setPdfUploading(false);

    // ==========================
    // 7) Frontend data
    // ==========================
    const frontendData = {
      user_created: user?.email || "system",
      user_update: user?.email || "system",
      concepto: "Pago a proveedor",
      descripcion: "Pago generado desde sistema",
      fecha_emision: new Date().toISOString(),
      id_solicitud_proveedor: null,

      // si tu backend espera un url_pdf "single", manda el primero
      url_pdf: pdfsSubidos[0]?.url || null,
    };

    // ==========================
    // 8) Payload final (masivo)
    // ==========================
    const payload = {
      frontendData,
      isMasivo: true,

      csvData: csvDataArray,

      pagos,
      total_cargo: Number(totalCargo.toFixed(2)),

      codigo_dispersion: codigoDispersionGlobal,
      montos: montosByDispersionKey,

      user: user?.id || null,

      // ✅ ahora sí va con URL real
      pdfs: pdfsSubidos,

      // opcional por si tu backend quiere todas juntas
      url_pdf: pdfsSubidos[0].url,
    };

    console.log("📦 Payload a enviar:", payload);

    const response = await fetch(`${API_URL}/mia/pago_proveedor/pago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Respuesta del backend:", data);

      if (onSubmit) {
        await onSubmit(payload);
      }

      onClose();
    } else {
      console.error("❌ Error backend:", data?.message || data?.error || data);
      setFormError(data?.details || "Ocurrió un error al guardar la dispersión. Intenta nuevamente.");
    }
  } catch (err) {
    console.error("Error inesperado:", err);
    setFormError("Ocurrió un error al procesar la solicitud.");
  } finally {
    setPdfUploading(false);
    setPdfUploadProgress(null);
  }
  };


  return (
    <div className="h-fit w-[95vw] max-w-xl relative bg-white rounded-lg shadow-lg">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start rounded-t-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Crear dispersión (Masivo)</h3>
              <p className="text-xs text-blue-700">Sube el CSV y los comprobantes PDF.</p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">¡Ocurrió un error!</h3>
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
          {/* PDFs */}
          <div className="space-y-2">
            <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700">
              Subir Comprobantes PDF
            </label>

            <div className="relative">
              <input
                id="pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handlePdfChange}
                className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Solo PDF. Puedes subir uno o varios.</p>
              {pdfFiles.length > 0 && (
                <button
                  type="button"
                  onClick={clearPdfFiles}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Limpiar PDFs
                </button>
              )}
            </div>

            {pdfFiles.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-700 mb-2">PDFs seleccionados: {pdfFiles.length}</p>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {pdfFiles.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs bg-white p-2 rounded">
                      <span className="truncate">{f.name}</span>
                      <span className="text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CSV */}
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
              <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Solo CSV. Máximo 10MB.</p>
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

            {csvFile && (
              <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium text-green-700">CSV cargado:</p>
                <p className="text-sm text-green-600 truncate">{csvFile.name}</p>
                <p className="text-xs text-green-500 mt-1">
                  Tamaño: {(csvFile.size / 1024).toFixed(1)} KB
                </p>
                {csvLoading ? (
                  <p className="text-xs text-gray-600 mt-1">Procesando CSV...</p>
                ) : (
                  <p className="text-xs text-green-600 mt-1">Listo para enviar.</p>
                )}
              </div>
            )}

            {/* Preview (opcional, para debug) */}
            {csvPreview.length > 0 && !csvLoading && (
              <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-700 mb-2">
                  Preview (hasta 20 filas): se extrae codigo/id y se normaliza cargo.
                </p>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {csvPreview.map((r, i) => (
                    <div key={i} className="text-xs bg-white p-2 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {r["codigo_dispersion"] ?? "—"}
                          {r["id_dispersion"] ? r["id_dispersion"] : ""}
                        </span>
                        <span className="text-gray-500">${r["cargo"] ?? "—"}</span>
                      </div>
                      <div className="text-gray-500 truncate">
                        {r["Referencia Ampliada"] || r["Referencia"] || ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 px-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isMasivo || !csvFile || csvLoading || pdfFiles.length === 0 || pdfUploading}
              className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !csvFile || csvLoading || pdfFiles.length === 0 || pdfUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-sm"
              }`}
              >
              <Send className="w-4 h-4" />
              {pdfUploading
                ? `Subiendo PDFs... (${pdfUploadProgress?.done ?? 0}/${pdfUploadProgress?.total ?? 0})`
                : "Subir comprobantes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
