"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";

// --- TEMPORAL: solo para checar rápido el JSON de unos XML, borrar después ---

type Estado = "idle" | "loading" | "success" | "error";

type FilaXml = {
  id: number;
  url: string;
  estado: Estado;
  json?: unknown;
  error?: string;
};

let nextId = 1;
const nuevaFila = (): FilaXml => ({ id: nextId++, url: "", estado: "idle" });

function xmlNodeToJson(node: Node): unknown {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue?.trim() || undefined;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return undefined;

  const el = node as Element;
  const obj: Record<string, unknown> = {};

  if (el.attributes.length > 0) {
    obj["@attributes"] = Object.fromEntries(
      Array.from(el.attributes).map((a) => [a.name, a.value]),
    );
  }

  const hijosElemento = Array.from(el.childNodes).filter(
    (n) => n.nodeType === Node.ELEMENT_NODE,
  );

  if (hijosElemento.length === 0) {
    const texto = el.textContent?.trim();
    if (texto) {
      return Object.keys(obj).length ? { ...obj, "#text": texto } : texto;
    }
    return Object.keys(obj).length ? obj : null;
  }

  for (const hijo of hijosElemento as Element[]) {
    const nombre = hijo.nodeName;
    const valor = xmlNodeToJson(hijo);
    if (obj[nombre] === undefined) {
      obj[nombre] = valor;
    } else if (Array.isArray(obj[nombre])) {
      (obj[nombre] as unknown[]).push(valor);
    } else {
      obj[nombre] = [obj[nombre], valor];
    }
  }

  return obj;
}

async function fetchXmlComoJson(url: string): Promise<unknown> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Error HTTP: ${resp.status}`);
  const texto = await resp.text();
  const doc = new DOMParser().parseFromString(texto, "text/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("El XML no se pudo parsear");
  return { [doc.documentElement.nodeName]: xmlNodeToJson(doc.documentElement) };
}

function XmlUrlToJsonList() {
  const [filas, setFilas] = useState<FilaXml[]>([nuevaFila()]);

  const actualizarFila = (id: number, patch: Partial<FilaXml>) =>
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleBuscar = async (fila: FilaXml) => {
    const url = fila.url.trim();
    if (!url) return;

    actualizarFila(fila.id, { estado: "loading", error: undefined });

    try {
      const json = await fetchXmlComoJson(url);
      actualizarFila(fila.id, { estado: "success", json });
      setFilas((prev) =>
        fila.id === prev[prev.length - 1]?.id ? [...prev, nuevaFila()] : prev,
      );
    } catch (err) {
      actualizarFila(fila.id, {
        estado: "error",
        error: err instanceof Error ? err.message : "Error al obtener el XML",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {filas.map((fila) => (
        <div
          key={fila.id}
          className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex gap-2">
            <TextInput
              value={fila.url}
              onChange={(value) => actualizarFila(fila.id, { url: value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBuscar(fila);
              }}
              placeholder="https://.../factura.xml"
              className="flex-1"
            />
            <Button
              onClick={() => handleBuscar(fila)}
              disabled={fila.estado === "loading"}
              icon={fila.estado === "loading" ? Loader2 : Search}
            >
              Ver JSON
            </Button>
          </div>

          {fila.estado === "error" && (
            <p className="text-sm text-red-600">{fila.error}</p>
          )}

          {fila.estado === "success" && (
            <pre className="max-h-96 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800">
              {JSON.stringify(fila.json, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

// --- fin bloque temporal ---

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <h1>
        seguimos en proceso pero hola {user.name}, esta es tu pagina de inicio
      </h1>
      <div className="mt-6">
        <XmlUrlToJsonList />
      </div>
    </>
  );
}
