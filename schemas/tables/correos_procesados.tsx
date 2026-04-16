"use client";

import { useState } from "react";
import { AgentProcess, CorreoProcesado } from "@/types/database_tables";
import { DateTime } from "@/v3/atom/TableItemsComponent";
import Modal from "@/components/organism/Modal";
import Button from "@/components/atom/Button";
import { AlertCircle, Brain, BrainCircuit, Hand } from "lucide-react";
import { FormSeleccionarHoteles } from "@/components/organism/FormSeleccionarHoteles";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/useAlert";

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

const buildAgentSubtitle = (ap: AgentProcess): string => {
  if (!ap || !Object.values(ap).some(Boolean)) return "";
  const parts: string[] = [];
  if ("hotel" in ap && ap.hotel) parts.push(`Hotel: ${ap.hotel}`);
  if ("ciudad" in ap && ap.ciudad) parts.push(`Ciudad: ${ap.ciudad}`);
  if ("check_in" in ap && ap.check_in) parts.push(`Check-in: ${ap.check_in}`);
  if ("check_out" in ap && ap.check_out)
    parts.push(`Check-out: ${ap.check_out}`);
  if ("codigo_postal" in ap && ap.codigo_postal)
    parts.push(`CP: ${ap.codigo_postal}`);
  return parts.join(" · ");
};

const AccionesCell = ({ value }: { value: CorreoProcesado }) => {
  const [open, setOpen] = useState(false);
  const { error } = useAlert();
  const { user } = useAuth();

  if (value.procesado == 1) return <span className="text-gray-400">—</span>;

  const agentInfo = buildAgentSubtitle(value.agent_process);
  const subtitle = [
    value?.subject.split("Solicitud cotizacion hospedaje ")[1] ?? "Sin asunto",
    agentInfo,
  ]
    .filter(Boolean)
    .join(" — ");

  const handleSubmit = async (hoteles: Hotel[]) => {
    if (!user?.id) {
      error("Por favor actualiza la ventana y vuelve a intentarlo");
      return;
    }
    const payload = {
      correo: value,
      hotel_ids: hoteles.map((h) => h.id_hotel),
      user: { id: user?.id, name: user?.name },
    };

    try {
      const res = await fetch(
        "http://localhost:5678/webhook-test/e6f345aa-2be8-4c69-80fb-b7e46d5edfd8",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mi_super_key_segura",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          title="Procesar manualmente"
          subtitle={subtitle}
        >
          <FormSeleccionarHoteles onSubmit={handleSubmit} />
        </Modal>
      )}
      <Button
        size="sm"
        variant="secondary"
        icon={Hand}
        onClick={() => setOpen(true)}
      >
        Procesar manualmente
      </Button>
    </>
  );
};
