export class XmlFetchError extends Error {
  constructor(
    message = "No se pudo descargar el XML. Verifica la URL o que el servidor permita CORS.",
  ) {
    super(message);
    this.name = "XmlFetchError";
    Object.setPrototypeOf(this, XmlFetchError.prototype);
  }
}

export class XmlParseError extends Error {
  constructor(message = "El archivo no es un XML válido.") {
    super(message);
    this.name = "XmlParseError";
    Object.setPrototypeOf(this, XmlParseError.prototype);
  }
}

export class CfdiInvalidoError extends Error {
  constructor(message = "El archivo no parece ser un CFDI válido.") {
    super(message);
    this.name = "CfdiInvalidoError";
    Object.setPrototypeOf(this, CfdiInvalidoError.prototype);
  }
}

export function mensajeErrorFacturaXml(
  err: unknown,
  fallback = "Ocurrió un error al analizar la factura",
): string {
  if (
    err instanceof XmlFetchError ||
    err instanceof XmlParseError ||
    err instanceof CfdiInvalidoError
  ) {
    return err.message;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
