"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentProcess, CorreoProcesado } from "@/types/database_tables";
import { DateTime } from "@/v3/atom/TableItemsComponent";
import Modal from "@/components/organism/Modal";
import Button from "@/components/atom/Button";
import { AlertCircle, BrainCircuit, Hand } from "lucide-react";

export type CorreoProcesadoItem = Pick<
  CorreoProcesado,
  | "subject"
  | "from_email"
  | "status"
  | "procesado"
  | "fecha_procesado"
  | "created_at"
  | "error"
  | "agent_process"
> & {
  acciones: CorreoProcesado;
};

export const mapCorreoProcesado = (
  correo: CorreoProcesado,
): CorreoProcesadoItem => ({
  subject: correo.subject.split("Solicitud cotizacion hospedaje ")[1],
  from_email: correo.from_email,
  status: correo.status,
  procesado: correo.procesado,
  fecha_procesado: correo.fecha_procesado,
  created_at: correo.created_at,
  error: correo.error,
  agent_process: correo.agent_process,
  acciones: correo,
});

export const createCorreoRenderers = () => ({
  status: ({ value }: { value: string }) => {
    const style =
      STATUS_STYLES[value?.toLowerCase()] ??
      "bg-gray-100 text-gray-600 border border-gray-300";
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style}`}
      >
        {value ?? "—"}
      </span>
    );
  },
  procesado: ({ value }: { value: 0 | 1 }) => (
    <span>{value === 1 ? "✅" : "❌"}</span>
  ),
  fecha_procesado: ({ value }: { value: string | null }) => (
    <DateTime value={value} />
  ),
  created_at: ({ value }: { value: string }) => <DateTime value={value} />,
  error: ({ value }: { value: string | null }) => <ErrorCell value={value} />,
  agent_process: ({ value }: { value: AgentProcess }) => (
    <AgentCell value={JSON.stringify(value)} />
  ),
  acciones: ({ value }: { value: CorreoProcesado }) => (
    <AccionesCell value={value} />
  ),
});

const STATUS_STYLES: Record<string, string> = {
  procesado: "bg-green-100 text-green-700 border border-green-300",
  pendiente: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  error: "bg-red-100 text-red-700 border border-red-300",
};

const ErrorCell = ({ value }: { value: string | null }) => {
  const [open, setOpen] = useState(false);

  if (!value) return <span className="text-gray-400">—</span>;

  let display: React.ReactNode;
  try {
    const parsed = JSON.parse(value);
    display = (
      <pre className="text-xs text-red-700 whitespace-pre-wrap break-words max-w-xl">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    display = (
      <p className="text-sm text-red-700 whitespace-pre-wrap break-words max-w-xl">
        {value}
      </p>
    );
  }

  return (
    <>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          title="Error del correo"
          subtitle="Detalle del error encontrado al procesar este correo"
        >
          <div className="p-2">{display}</div>
        </Modal>
      )}
      <Button
        size="sm"
        variant="warning ghost"
        icon={AlertCircle}
        onClick={() => setOpen(true)}
      >
        Ver error
      </Button>
    </>
  );
};
const AgentCell = ({ value }: { value: string | null }) => {
  const [open, setOpen] = useState(false);

  let parsed;
  let display: React.ReactNode;
  try {
    parsed = JSON.parse(value);
    display = (
      <pre className="text-xs whitespace-pre-wrap break-words max-w-xl">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    display = (
      <p className="text-sm whitespace-pre-wrap break-words max-w-xl">
        {value}
      </p>
    );
  }

  if (!Object.values(parsed).some((v) => Boolean(v)))
    return <span className="text-gray-400">—</span>;

  return (
    <>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          title="Error del correo"
          subtitle="Detalle del error encontrado al procesar este correo"
        >
          <div className="p-2">{display}</div>
        </Modal>
      )}
      <Button
        size="sm"
        variant="warning ghost"
        icon={BrainCircuit}
        onClick={() => setOpen(true)}
      >
        Ver proceso del agente
      </Button>
    </>
  );
};

const AccionesCell = ({ value }: { value: CorreoProcesado }) => {
  const router = useRouter();

  if (value.procesado == 1) return <span className="text-gray-400">—</span>;

  const handleProcesarManual = () => {
    const ap = value.agent_process as {
      hotel?: string | null;
      ciudad?: string | null;
      check_in?: string | null;
      check_out?: string | null;
      codigo_postal?: string | null;
    };

    sessionStorage.setItem(
      "cotizacion_correo",
      JSON.stringify({
        id_correo: value.id_correo,
        subject: value.subject ?? null,
        body_email: value.body_email ?? null,
        hoteles: value.hoteles ?? null,
      }),
    );

    const params = new URLSearchParams();
    if (ap.hotel) params.set("hotel", ap.hotel);
    if (ap.ciudad) params.set("ciudad", ap.ciudad);
    if (ap.check_in) params.set("check_in", ap.check_in);
    if (ap.check_out) params.set("check_out", ap.check_out);
    if (ap.codigo_postal) params.set("codigo_postal", ap.codigo_postal);

    const query = params.toString();
    router.push(`/dashboard/cotizacion/generar${query ? `?${query}` : ""}`);
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      icon={Hand}
      onClick={handleProcesarManual}
    >
      Procesar manualmente
    </Button>
  );
};
