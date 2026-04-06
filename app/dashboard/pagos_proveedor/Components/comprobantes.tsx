"use client";

import React, { useMemo, useState } from "react";
import { Send, X, Info, Upload } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";
import { useAuth } from "@/context/AuthContext";
import { subirArchivoAS3Seguro } from "@/lib/utils";

type ComprobanteProps = {
  onClose: () => void;
  onSubmit?: (payload: any) => Promise<void> | void;
};

interface CSVData {
  [key: string]: string;
}

type DispersionInfo = {
  codigo_dispersion: string;
  id_dispersion: string;
};

type Mode = "csv" | "manual";

type ManualForm = {
  codigo_dispersion: string;
  id_dispersion: string;
  Cargo: string;
  IVA: string;
  Concepto: string;
  Descripcion: string;
  "Fecha Operación": string;
  "Referencia Ampliada": string;
  "Numero de comprobante": string;
  "Cuenta de origen": string;
  "Cuenta de destino": string;
  Moneda: string;
  "Metodo de pago": string;
  "Nombre del pagador": string;
  "RFC del pagador": string;
  "Domicilio del pagador": string;
  "Nombre del beneficiario": string;
  "Domicilio del beneficiario": string;
};

const extractDispersionInfo = (referencia?: string): DispersionInfo | null => {
  if (!referencia) return null;

  const ref = referencia.trim();

  const reNew = /wx"?\s*([A-Za-z0-9]+)\s*"?xw\s*(\d+)/i;
  const mNew = ref.match(reNew);

  if (mNew) {
    return {
      codigo_dispersion: mNew[1].trim(),
      id_dispersion: mNew[2].trim(),
    };
  }

  const reOld = /wx"?\s*([A-Za-z0-9]+?)\s*(\d+)\s*"?xw/i;
  const mOld = ref.match(reOld);

  if (mOld) {
    return {
      codigo_dispersion: mOld[1].trim(),
      id_dispersion: mOld[2].trim(),
    };
  }

  return null;
};

const validatePDFFiles = (
  files: FileList
): { isValid: boolean; error?: string; validFiles?: File[] } => {
  const validFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.type !== "application/pdf") {
      return {
        isValid: false,
        error: `El archivo "${file.name}" no es un PDF válido.`,
      };
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return {
        isValid: false,
        error: `El archivo "${file.name}" debe tener extensión .pdf.`,
      };
    }

    validFiles.push(file);
  }

  return { isValid: true, validFiles };
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

const getCargoFromCSVRow = (row: CSVData) => {
  const cargo = cleanMoney(row["Cargo"]);
  const abono = cleanMoney(row["Abono"]);
  const monto = cleanMoney(row["Monto"]);
  return cargo ?? abono ?? monto;
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

const procesarTodosLosDatosCSV = (parsedData: string[][]): CSVData[] => {
  if (parsedData.length < 1) return [];

  const result: CSVData[] = [];

  let headerIndex = 0;
  for (let i = 0; i < parsedData.length; i++) {
    const rowLower = parsedData[i].map((cell) => (cell ?? "").trim().toLowerCase());
    if (rowLower.includes("referencia ampliada") || rowLower.includes("referencia")) {
      headerIndex = i;
      break;
    }
  }

  const headers = parsedData[headerIndex].map((h) => (h ?? "").trim());
  const dataRows = parsedData.slice(headerIndex + 1);

  for (const row of dataRows) {
    if (!row || row.length === 0 || row.every((cell) => (cell ?? "").trim() === "")) {
      continue;
    }

    const csvData: CSVData = {};

    headers.forEach((header, idx) => {
      if (!header) return;
      csvData[header] = (row[idx] ?? "").trim();
    });

    const referenciaAmpliada = csvData["Referencia Ampliada"];
    const referenciaSimple = csvData["Referencia"];

    const info =
      extractDispersionInfo(referenciaAmpliada) ||
      extractDispersionInfo(referenciaSimple);

    if (info) {
      csvData["codigo_dispersion"] = info.codigo_dispersion;
      csvData["id_dispersion"] = info.id_dispersion;
    }

    const cargoNum = getCargoFromCSVRow(csvData);
    if (cargoNum !== null) {
      csvData["cargo"] = cargoNum.toFixed(2);
      csvData["Cargo"] = cargoNum.toFixed(2);
    }

    result.push(csvData);
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
  codigo_dispersion: "",
  id_dispersion: "",
  Cargo: "",
  IVA: "",
  Concepto: "Pago a proveedor",
  Descripcion: "Pago generado desde sistema",
  "Fecha Operación": "",
  "Referencia Ampliada": "",
  "Numero de comprobante": "",
  "Cuenta de origen": "",
  "Cuenta de destino": "",
  Moneda: "MXN",
  "Metodo de pago": "SPEI",
  "Nombre del pagador": "",
  "RFC del pagador": "",
  "Domicilio del pagador": "",
  "Nombre del beneficiario": "",
  "Domicilio del beneficiario": "",
};

export const ComprobanteModal: React.FC<ComprobanteProps> = ({
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("csv");

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVData[]>([]);
  const [manualForm, setManualForm] = useState<ManualForm>(initialManualForm);

  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const manualModeValid = useMemo(() => {
    return (
      manualForm.codigo_dispersion.trim() !== "" &&
      manualForm.id_dispersion.trim() !== "" &&
      manualForm.Cargo.trim() !== ""
    );
  }, [manualForm]);

  const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (event.target.files && event.target.files.length > 0) {
      const validation = validatePDFFiles(event.target.files);

      if (!validation.isValid) {
        setFileError(validation.error || "Error al validar PDFs.");
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
        setFileError(validation.error || "Error al validar CSV.");
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
    }
  };

  const updateManualField = (field: keyof ManualForm, value: string) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearPdfFiles = () => {
    setPdfFiles([]);
    const pdfInput = document.getElementById("pdf-file") as HTMLInputElement | null;
    if (pdfInput) pdfInput.value = "";
  };

  const clearCsvFile = () => {
    setCsvFile(null);
    setCsvPreview([]);
    const csvInput = document.getElementById("csv-file") as HTMLInputElement | null;
    if (csvInput) csvInput.value = "";
  };

  const buildManualCsvRow = (): CSVData => {
    const cargoNormalizado = cleanMoney(manualForm.Cargo);

    return {
      codigo_dispersion: manualForm.codigo_dispersion.trim(),
      id_dispersion: manualForm.id_dispersion.trim(),
      Cargo: cargoNormalizado !== null ? cargoNormalizado.toFixed(2) : manualForm.Cargo.trim(),
      cargo: cargoNormalizado !== null ? cargoNormalizado.toFixed(2) : manualForm.Cargo.trim(),
      IVA: manualForm.IVA.trim(),
      Concepto: manualForm.Concepto.trim(),
      Descripcion: manualForm.Descripcion.trim(),
      "Fecha Operación": manualForm["Fecha Operación"].trim(),
      "Referencia Ampliada": manualForm["Referencia Ampliada"].trim(),
      "Numero de comprobante": manualForm["Numero de comprobante"].trim(),
      "Cuenta de origen": manualForm["Cuenta de origen"].trim(),
      "Cuenta de destino": manualForm["Cuenta de destino"].trim(),
      Moneda: manualForm.Moneda.trim() || "MXN",
      "Metodo de pago": manualForm["Metodo de pago"].trim() || "SPEI",
      "Nombre del pagador": manualForm["Nombre del pagador"].trim(),
      "RFC del pagador": manualForm["RFC del pagador"].trim(),
      "Domicilio del pagador": manualForm["Domicilio del pagador"].trim(),
      "Nombre del beneficiario": manualForm["Nombre del beneficiario"].trim(),
      "Domicilio del beneficiario": manualForm["Domicilio del beneficiario"].trim(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFileError(null);

    if (pdfFiles.length === 0) {
      setFormError("Por favor, sube al menos un comprobante PDF.");
      return;
    }

    if (mode === "csv" && !csvFile) {
      setFormError("Por favor, sube el archivo CSV.");
      return;
    }

    if (mode === "manual" && !manualModeValid) {
      setFormError("Completa código de dispersión, id de dispersión y cargo.");
      return;
    }

    if (csvLoading) {
      setFormError("El CSV se está procesando.");
      return;
    }

    try {
      let csvDataArray: CSVData[] = [];

      if (mode === "csv") {
        const csvText = await readFileAsText(csvFile as File);
        const parsed = parseCSV(csvText);
        csvDataArray = procesarTodosLosDatosCSV(parsed);

        if (csvDataArray.length === 0) {
          setFormError("No se pudieron procesar los datos del CSV.");
          return;
        }

        const invalidRows = csvDataArray
          .map((r, idx) => ({ r, idx }))
          .filter(({ r }) => !r["codigo_dispersion"] || !r["id_dispersion"] || !r["Cargo"]);

        if (invalidRows.length > 0) {
          const sample = invalidRows
            .slice(0, 3)
            .map(({ idx }) => idx + 1)
            .join(", ");
          setFormError(
            `Hay filas sin codigo_dispersion, id_dispersion o Cargo. Ejemplo: ${sample}.`
          );
          return;
        }
      } else {
        const row = buildManualCsvRow();

        if (!row.codigo_dispersion || !row.id_dispersion || !row["Cargo"]) {
          setFormError("Faltan datos obligatorios para crear el pago.");
          return;
        }

        csvDataArray = [row];
      }

      const pagos = csvDataArray.map((r) => ({
        codigo_dispersion: r["codigo_dispersion"],
        id_dispersion: r["id_dispersion"],
        cargo: Number(r["Cargo"] || 0),
        referencia: r["Referencia Ampliada"] || r["Referencia"] || "",
        fecha_operacion: r["Fecha Operación"] || "",
        concepto: r["Concepto"] || "",
      }));

      const totalCargo = pagos.reduce(
        (acc, p) => acc + (Number.isFinite(p.cargo) ? p.cargo : 0),
        0
      );

      const uniqueCodes = Array.from(
        new Set(pagos.map((p) => p.codigo_dispersion).filter(Boolean))
      );

      if (uniqueCodes.length !== 1) {
        setFormError(
          `Los datos contienen múltiples códigos de dispersión (${uniqueCodes.join(", ")}).`
        );
        return;
      }

      const codigoDispersionGlobal = uniqueCodes[0];

      const montosByDispersionKey: Record<string, string> = {};
      for (const p of pagos) {
        const key = `${p.codigo_dispersion}${p.id_dispersion}`;
        montosByDispersionKey[key] = Number(p.cargo).toFixed(2);
      }

      setPdfUploading(true);
      setPdfUploadProgress({ done: 0, total: pdfFiles.length });

      const pdfsSubidos: Array<{
        name: string;
        size: number;
        type: string;
        url: string;
      }> = [];

      for (const file of pdfFiles) {
        const url = await subirArchivoAS3Seguro(file);

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

      const frontendData = {
        user_created: user?.email || "system",
        user_update: user?.email || "system",
        concepto:
          mode === "manual"
            ? manualForm.Concepto || "Pago a proveedor"
            : "Pago a proveedor",
        descripcion:
          mode === "manual"
            ? manualForm.Descripcion || "Pago generado desde sistema"
            : "Pago generado desde sistema",
        fecha_emision: new Date().toISOString(),
        id_solicitud_proveedor: null,
        url_pdf: pdfsSubidos[0]?.url || null,
      };

      const payload = {
        frontendData,
        isMasivo: true,
        csvData: csvDataArray,
        pagos,
        total_cargo: Number(totalCargo.toFixed(2)),
        codigo_dispersion: codigoDispersionGlobal,
        montos: montosByDispersionKey,
        user: user?.id || null,
        pdfs: pdfsSubidos,
        url_pdf: pdfsSubidos[0]?.url || null,
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

      if (!response.ok) {
        setFormError(
          data?.details || "Ocurrió un error al guardar el pago."
        );
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
      setPdfUploading(false);
      setPdfUploadProgress(null);
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
                Crear pago a proveedor
              </h3>
              <p className="text-xs text-blue-700">
                Puedes cargar CSV o capturar manualmente un solo registro.
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
              onClick={() => setMode("csv")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "csv" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Con CSV
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Sin CSV_transferencia
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700">
              Subir comprobante PDF
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
              <Upload className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Solo PDF.</p>
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
                <p className="text-xs text-gray-700 mb-2">
                  PDFs seleccionados: {pdfFiles.length}
                </p>
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

              {csvPreview.length > 0 && !csvLoading && (
                <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-700 mb-2">Preview</p>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {csvPreview.map((r, i) => (
                      <div key={i} className="text-xs bg-white p-2 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-700">
                            {r["codigo_dispersion"] ?? "—"}
                            {r["id_dispersion"] ? ` ${r["id_dispersion"]}` : ""}
                          </span>
                          <span className="text-gray-500">${r["Cargo"] ?? "—"}</span>
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
          )}

          {mode === "manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="codigo_dispersion *"
                value={manualForm.codigo_dispersion}
                onChange={(e) => updateManualField("codigo_dispersion", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="id_dispersion *"
                value={manualForm.id_dispersion}
                onChange={(e) => updateManualField("id_dispersion", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Cargo *"
                value={manualForm.Cargo}
                onChange={(e) => updateManualField("Cargo", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="IVA"
                value={manualForm.IVA}
                onChange={(e) => updateManualField("IVA", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Concepto"
                value={manualForm.Concepto}
                onChange={(e) => updateManualField("Concepto", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Descripcion"
                value={manualForm.Descripcion}
                onChange={(e) => updateManualField("Descripcion", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Fecha Operación (dd/mm/yyyy)"
                value={manualForm["Fecha Operación"]}
                onChange={(e) => updateManualField("Fecha Operación", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Referencia Ampliada"
                value={manualForm["Referencia Ampliada"]}
                onChange={(e) => updateManualField("Referencia Ampliada", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Numero de comprobante"
                value={manualForm["Numero de comprobante"]}
                onChange={(e) => updateManualField("Numero de comprobante", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Cuenta de origen"
                value={manualForm["Cuenta de origen"]}
                onChange={(e) => updateManualField("Cuenta de origen", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Cuenta de destino"
                value={manualForm["Cuenta de destino"]}
                onChange={(e) => updateManualField("Cuenta de destino", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Moneda"
                value={manualForm.Moneda}
                onChange={(e) => updateManualField("Moneda", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Metodo de pago"
                value={manualForm["Metodo de pago"]}
                onChange={(e) => updateManualField("Metodo de pago", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Nombre del pagador"
                value={manualForm["Nombre del pagador"]}
                onChange={(e) => updateManualField("Nombre del pagador", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="RFC del pagador"
                value={manualForm["RFC del pagador"]}
                onChange={(e) => updateManualField("RFC del pagador", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Domicilio del pagador"
                value={manualForm["Domicilio del pagador"]}
                onChange={(e) => updateManualField("Domicilio del pagador", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Nombre del beneficiario"
                value={manualForm["Nombre del beneficiario"]}
                onChange={(e) => updateManualField("Nombre del beneficiario", e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm"
                placeholder="Domicilio del beneficiario"
                value={manualForm["Domicilio del beneficiario"]}
                onChange={(e) => updateManualField("Domicilio del beneficiario", e.target.value)}
              />
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
                pdfUploading ||
                pdfFiles.length === 0 ||
                csvLoading ||
                (mode === "csv" ? !csvFile : !manualModeValid)
              }
              className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 ${
                pdfUploading ||
                pdfFiles.length === 0 ||
                csvLoading ||
                (mode === "csv" ? !csvFile : !manualModeValid)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send className="w-4 h-4" />
              {pdfUploading
                ? `Subiendo PDFs... (${pdfUploadProgress?.done ?? 0}/${pdfUploadProgress?.total ?? 0})`
                : "Guardar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};