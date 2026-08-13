import { CfdiInvalidoError, XmlParseError } from "./errors";

// Parser XML → objeto: exclusivamente XML string → Document + helpers de
// lectura namespace-agnostic. Sin lógica de negocio (eso vive en normalizer.ts).
export interface ParsedCfdiDocument {
  doc: Document;
}

function normalizeLocalName(name: string): string {
  return name.toLowerCase().split(":").pop()?.trim() ?? "";
}

// Busca en TODO el subárbol (descendientes), sin importar el nivel. Útil para
// nodos que no se repiten dentro de Conceptos (Emisor, Receptor, TimbreFiscalDigital,
// ImpuestosLocales).
export function getAllByLocalName(
  root: Document | Element | null | undefined,
  localName: string,
): Element[] {
  if (!root) return [];
  const target = normalizeLocalName(localName);
  return Array.from(root.getElementsByTagName("*")).filter(
    (el) => normalizeLocalName(el.tagName) === target,
  );
}

export function getFirstByLocalName(
  root: Document | Element | null | undefined,
  localName: string,
): Element | null {
  return getAllByLocalName(root, localName)[0] ?? null;
}

// Busca solo entre los HIJOS DIRECTOS. Necesario para nodos que también pueden
// aparecer anidados dentro de cada Concepto (Impuestos, Traslado, Retencion) —
// una búsqueda profunda desde la raíz confundiría el Impuestos del comprobante
// con el de un concepto individual.
export function getDirectChildrenByLocalName(
  parent: Element | null | undefined,
  localName: string,
): Element[] {
  if (!parent) return [];
  const target = normalizeLocalName(localName);
  return Array.from(parent.children).filter(
    (el) => normalizeLocalName(el.tagName) === target,
  );
}

export function getDirectChildByLocalName(
  parent: Element | null | undefined,
  localName: string,
): Element | null {
  return getDirectChildrenByLocalName(parent, localName)[0] ?? null;
}

export function getAttr(
  element: Element | null | undefined,
  attr: string,
): string | undefined {
  const value = element?.getAttribute(attr);
  return value != null && value !== "" ? value : undefined;
}

export function toNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const clean = String(value).replace(/,/g, "").replace(/\$/g, "").trim();
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export function parseCfdiXml(xmlString: string): ParsedCfdiDocument {
  if (!xmlString || !xmlString.trim()) {
    throw new XmlParseError("El contenido descargado está vacío.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new XmlParseError("El XML está mal formado y no se pudo interpretar.");
  }

  const rootLocalName = normalizeLocalName(doc.documentElement?.tagName ?? "");
  if (rootLocalName === "html") {
    throw new XmlParseError("La URL no devolvió un XML (parece una página HTML).");
  }

  const comprobante = getFirstByLocalName(doc, "Comprobante");
  if (!comprobante) {
    throw new CfdiInvalidoError(
      "El archivo no contiene un nodo Comprobante: no parece ser un CFDI.",
    );
  }

  return { doc };
}
