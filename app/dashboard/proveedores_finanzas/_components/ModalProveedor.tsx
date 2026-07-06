"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArchivoProveedor,
  ProveedorCuenta,
  ProveedorRaw,
  ProveedoresService,
} from "@/services/ProveedoresService";
import { useAlert } from "@/context/useAlert";
import { DateTime } from "@/v3/atom/TableItemsComponent";
import Modal from "@/components/organism/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table } from "@/component/molecule/Table";
import { ModalCuentasCRUD } from "@/app/dashboard/proveedores/[id]/_components";
import Button from "@/components/atom/Button";
import { NumberInput, TextInput } from "@/components/atom/Input";
import { ApiResponse } from "@/services/ApiService";
import {
  File,
  FileText,
  Image,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
// ── Helpers ────────────────────────────────────────────────────────────────

const Badge = ({
  label,
  color,
}: {
  label: string;
  color: "green" | "red" | "blue" | "gray" | "yellow";
}) => {
  const classes: Record<typeof color, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${classes[color]}`}
    >
      {label}
    </span>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-1">
      {title}
    </p>
    <div className="bg-gray-50 rounded-lg px-3 py-1">{children}</div>
  </div>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center gap-8 py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 shrink-0">{label}</span>
    <span className="text-xs text-gray-900 text-right">
      {value ?? <span className="text-gray-300">—</span>}
    </span>
  </div>
);

const FileIcon = ({ mime_type }: { mime_type: string | null }) => {
  if (mime_type?.startsWith("image/"))
    return <Image className="w-4 h-4 text-blue-500" />;
  if (mime_type === "application/pdf")
    return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-400" />;
};

const TYPE_LABELS: Record<string, string> = {
  vuelo: "Vuelo",
  renta_carro: "Renta carro",
  hotel: "Hotel",
};
// ── Componente principal ───────────────────────────────────────────────────

export const ModalProveedor = ({
  proveedor,
  onClose,
}: {
  proveedor: ProveedorRaw | null;
  onClose: () => void;
}) => {
  // Cuentas
  const [cuentas, setCuentas] = useState<ProveedorCuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [isCuentaOpen, setIsCuentaOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<ProveedorCuenta | null>(
    null,
  );

  const handleToggleActive = async (cuenta: ProveedorCuenta) => {
    try {
      const nuevoEstado = cuenta.active === 1 ? 0 : 1;

      await svc.updateCuentaActive(cuenta.id, nuevoEstado);

      setCuentas((prev) =>
        prev.map((c) =>
          c.id === cuenta.id ? { ...c, active: nuevoEstado } : c,
        ),
      );

      showNotification(
        "success",
        nuevoEstado === 1 ? "Cuenta activada" : "Cuenta desactivada",
      );
    } catch (error) {
      showNotification("error", error.message || "Error al actualizar");
    }
  };
  // Días crédito (editable)
  const [editingDias, setEditingDias] = useState(false);
  const [diasCredito, setDiasCredito] = useState<number | null>(null);
  const [savingDias, setSavingDias] = useState(false);

  // Archivos
  const [archivos, setArchivos] = useState<ArchivoProveedor[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showNotification } = useAlert();
  const svc = ProveedoresService.getInstance();

  useEffect(() => {
    if (!proveedor) return;
    setDiasCredito(proveedor.vencimiento_credito);
    setEditingDias(false);
    setPendingFile(null);
    setNombreArchivo("");

    setLoadingCuentas(true);
    svc
      .getCuentasByProveedor(proveedor.id, true)
      .then(({ data }) => setCuentas(data))
      .catch(() => setCuentas([]))
      .finally(() => setLoadingCuentas(false));

    setLoadingArchivos(true);
    svc
      .getArchivos(proveedor.id)
      .then(({ data }) => setArchivos(data ?? []))
      .catch(() => setArchivos([]))
      .finally(() => setLoadingArchivos(false));
  }, [proveedor?.id]);

  // ── Cuentas ──────────────────────────────────────────────────────────────
  const handleSaveCuenta = async (datos: ProveedorCuenta, caratula?: File) => {
    try {
      let response: ApiResponse<ProveedorCuenta[]>;

      if (selectedCuenta) {
        response = await svc.updateCuentasProveedor(datos, caratula);
      } else {
        response = await svc.createCuentasProveedor(datos, caratula);
      }

      const cuentasActualizadas = await svc.getCuentasByProveedor(
        proveedor.id,
        true,
      );

      setCuentas(cuentasActualizadas.data ?? []);

      showNotification("success", response.message);
    } catch (error) {
      showNotification("error", error.message || "Error al guardar la cuenta");
    } finally {
      setSelectedCuenta(null);
      setIsCuentaOpen(false);
    }
  };

  const handleDeleteCuenta = async (id: number) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      const response = await svc.deleteCuentaProveedor(id);
      setCuentas(response.data);
      showNotification("success", "Cuenta eliminada");
    } catch (error) {
      showNotification("error", error.message || "Error al eliminar la cuenta");
    }
  };

  // ── Días crédito ──────────────────────────────────────────────────────────

  const handleSaveDias = async () => {
    setSavingDias(true);
    try {
      await svc.updateProveedor({
        id: proveedor.id,
        vencimiento_credito: diasCredito,
      });
      showNotification("success", "Días de crédito actualizados");
      setEditingDias(false);
    } catch (error) {
      showNotification("error", error.message || "Error al guardar");
    } finally {
      setSavingDias(false);
    }
  };

  // ── Archivos ──────────────────────────────────────────────────────────────

  const handleFileSelected = (file: File) => {
    setPendingFile(file);
    setNombreArchivo(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!pendingFile || !nombreArchivo.trim()) return;
    setUploading(true);
    try {
      const response = await svc.uploadArchivo(
        proveedor.id,
        nombreArchivo.trim(),
        pendingFile,
      );
      setArchivos(response.data ?? []);
      setPendingFile(null);
      setNombreArchivo("");
      showNotification("success", "Archivo subido correctamente");
    } catch (error) {
      showNotification("error", error.message || "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArchivo = async (id: number) => {
    try {
      const response = await svc.deleteArchivo(id);
      setArchivos(response.data ?? []);
      showNotification("success", "Archivo eliminado");
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al eliminar el archivo",
      );
    }
  };

  if (!proveedor) return null;

  return (
    <>
      <Modal
        onClose={onClose}
        title={proveedor.proveedor}
        subtitle={
          proveedor.type ? TYPE_LABELS[proveedor.type] : "Sin tipo asignado"
        }
      >
        <div className="w-[680px] max-w-[85vw]">
          <Tabs defaultValue="info">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
              <TabsTrigger value="archivos">Archivos</TabsTrigger>
            </TabsList>

            {/* ── Tab: Información ── */}
            <TabsContent value="info" className="p-4 space-y-4">
              <Section title="General">
                <InfoRow
                  label="Tipo"
                  value={
                    proveedor.type ? (
                      <Badge label={TYPE_LABELS[proveedor.type]} color="blue" />
                    ) : null
                  }
                />
                <InfoRow
                  label="Estatus"
                  value={
                    <Badge
                      label={proveedor.estatus === 1 ? "Activo" : "Inactivo"}
                      color={proveedor.estatus === 1 ? "green" : "red"}
                    />
                  }
                />
                <InfoRow
                  label="Intermediario"
                  value={proveedor.intermediario === 1 ? "Sí" : "No"}
                />
                <InfoRow
                  label="Internacional"
                  value={proveedor.internacional === 1 ? "Sí" : "No"}
                />
                <InfoRow
                  label="Bilingüe"
                  value={proveedor.bilingue === 1 ? "Sí" : "No"}
                />
                <InfoRow label="Negociación" value={proveedor.negociacion} />
                <InfoRow label="Notas" value={proveedor.notas_proveedor} />
              </Section>

              <Section title="Pagos">
                <InfoRow
                  label="Tipo de pago"
                  value={
                    proveedor.tipo_pago ? (
                      <Badge
                        label={proveedor.tipo_pago}
                        color={
                          proveedor.tipo_pago === "credito" ? "yellow" : "blue"
                        }
                      />
                    ) : null
                  }
                />
                {/* Días de crédito — editable */}
                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500 shrink-0">
                    Días de crédito
                  </span>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={diasCredito}
                      onChange={(v) =>
                        setDiasCredito(v === "" ? null : Number(v))
                      }
                      placeholder="ej. 30"
                      disabled={!editingDias}
                      className="w-24"
                    />
                    {editingDias ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSaveDias}
                          disabled={savingDias}
                        >
                          {savingDias ? "..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setDiasCredito(proveedor.vencimiento_credito);
                            setEditingDias(false);
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Pencil}
                        onClick={() => setEditingDias(true)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
                <InfoRow
                  label="Notas tipo de pago"
                  value={proveedor.notas_tipo_pago}
                />
                <InfoRow label="Notas de pagos" value={proveedor.notas_pagos} />
              </Section>

              <Section title="Convenio">
                <InfoRow
                  label="Convenio"
                  value={
                    <Badge
                      label={
                        proveedor.convenio === 1
                          ? "Con convenio"
                          : "Sin convenio"
                      }
                      color={proveedor.convenio === 1 ? "green" : "gray"}
                    />
                  }
                />
                <InfoRow
                  label="Contactos"
                  value={proveedor.contactos_convenio}
                />
              </Section>

              <Section title="Ubicación">
                <InfoRow label="Ciudad" value={proveedor.ciudad} />
                <InfoRow label="Estado" value={proveedor.estado} />
                <InfoRow label="País" value={proveedor.pais} />
                <InfoRow
                  label="Dirección"
                  value={
                    [
                      proveedor.calle,
                      proveedor.numero,
                      proveedor.colonia,
                      proveedor.municipio,
                      proveedor.codigo_postal,
                    ]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
              </Section>
            </TabsContent>

            {/* ── Tab: Cuentas ── */}
            <TabsContent value="cuentas" className="p-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setSelectedCuenta(null);
                    setIsCuentaOpen(true);
                  }}
                >
                  Agregar cuenta
                </Button>
              </div>
              {loadingCuentas ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  Cargando cuentas...
                </p>
              ) : cuentas.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  Este proveedor no tiene cuentas registradas.
                </p>
              ) : (
                <Table
                  registros={cuentas.map((c) => ({
                    alias: c.alias,
                    banco: c.banco,
                    cuenta: c.cuenta,
                    titular: c.titular,
                    correo: c,
                    cta: c.cta,
                    tipo_cta: c.tipo_cta,
                    caratula: c,
                    comentario: c.comentarios,
                    ultima_actualizacion: c.updated_at,
                    activar: c,
                    acciones: c,
                  }))}
                  renderers={{
                    ultima_actualizacion: ({
                      value,
                    }: {
                      value: string | null;
                    }) =>
                      value ? (
                        <DateTime value={value} />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      ),
                    correo: ({ value }: { value: ProveedorCuenta }) => (
                      <span
                        className="text-xs text-gray-700 break-all"
                        title={value.email || "—"}
                      >
                        {value.email || "—"}
                      </span>
                    ),
                    tipo_cta: ({ value }: { value: string | null }) => (
                      <span className="text-xs text-gray-700">
                        {value || "—"}
                      </span>
                    ),
                    comentario: ({ value }: { value: string | null }) => (
                      <span className="text-xs text-gray-700">
                        {value || "—"}
                      </span>
                    ),

                    cta: ({ value }: { value: string | null }) => (
                      <span className="text-xs text-gray-700">
                        {value || "—"}
                      </span>
                    ),
                    caratula: ({ value }: { value: ProveedorCuenta }) =>
                      value.url_caratula ? (
                        <a
                          href={value.url_caratula}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      ),
                    activar: ({ value }: { value: ProveedorCuenta }) => (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value.active === 1 ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            value.active === 1
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    ),
                    acciones: ({ value }: { value: ProveedorCuenta }) => (
                      <div className="flex items-center gap-1">
                        <Button
                          icon={Pencil}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCuenta(value);
                            setIsCuentaOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          icon={Trash2}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCuenta(value.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </div>
                    ),
                  }}
                />
              )}
            </TabsContent>

            {/* ── Tab: Archivos ── */}
            <TabsContent value="archivos" className="p-4 space-y-4">
              {/* Zona de subida */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = "";
                }}
              />

              {pendingFile ? (
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <FileIcon mime_type={pendingFile.type} />
                      <span className="font-medium">{pendingFile.name}</span>
                    </div>
                    <button
                      onClick={() => setPendingFile(null)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <TextInput
                    label="Nombre del archivo"
                    value={nombreArchivo}
                    onChange={setNombreArchivo}
                    placeholder="Ej. Contrato de convenio 2024"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingFile(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      icon={Upload}
                      onClick={handleUpload}
                      disabled={uploading || !nombreArchivo.trim()}
                    >
                      {uploading ? "Subiendo..." : "Subir archivo"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl py-8 flex flex-col items-center gap-2 text-center transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Haz clic para seleccionar un archivo
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, imágenes, documentos
                  </p>
                </button>
              )}

              {/* Lista de archivos */}
              {loadingArchivos ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  Cargando archivos...
                </p>
              ) : archivos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No hay archivos subidos aún.
                </p>
              ) : (
                <div className="space-y-2">
                  {archivos.map((archivo) => (
                    <div
                      key={archivo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group"
                    >
                      <FileIcon mime_type={archivo.mime_type} />
                      <a
                        href={archivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-gray-700 hover:text-blue-600 hover:underline truncate"
                      >
                        {archivo.nombre}
                      </a>
                      <span className="text-xs text-gray-400 shrink-0">
                        {archivo.created_at?.split("T")[0]}
                      </span>
                      <button
                        onClick={() => handleDeleteArchivo(archivo.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Modal>

      <ModalCuentasCRUD
        isOpen={isCuentaOpen}
        onClose={() => {
          setIsCuentaOpen(false);
          setSelectedCuenta(null);
        }}
        onSave={handleSaveCuenta}
        id_proveedor={proveedor.id}
        selectedCuenta={selectedCuenta}
      />
    </>
  );
};
