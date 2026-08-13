import { XmlFetchError } from "./errors";

// Punto 1 y 17: separa la obtención del XML del procesamiento. UrlXmlSource es
// la única implementación por ahora; FileXmlSource se agrega después
// implementando la misma interfaz, sin tocar parser/normalizer/strategies.
export interface XmlSource {
  getXml(): Promise<string>;
}

export class UrlXmlSource implements XmlSource {
  constructor(private readonly url: string) {}

  async getXml(): Promise<string> {
    let response: Response;
    try {
      response = await fetch(this.url);
    } catch {
      throw new XmlFetchError(
        "No se pudo descargar el XML. Verifica la URL o que el servidor permita CORS.",
      );
    }

    if (!response.ok) {
      throw new XmlFetchError(
        `El servidor respondió con un error (HTTP ${response.status}) al descargar el XML.`,
      );
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      throw new XmlFetchError("La URL no devolvió contenido.");
    }

    return text;
  }
}
