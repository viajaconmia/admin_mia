export async function parsearXML(xmlFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const xmlString = e.target?.result as string;

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
        if (parserError) {
          throw new Error("XML inválido o mal formado");
        }

        const getAttr = (element: Element | null | undefined, attr: string): string =>
          element?.getAttribute(attr) || "";

        const toNumber = (value: string): number => {
          if (!value) return 0;

          const clean = String(value)
            .replace(/,/g, "")
            .replace(/\$/g, "")
            .trim();

          const n = Number(clean);
          return Number.isFinite(n) ? n : 0;
        };

        const round2 = (value: number): number => {
          return Math.round(value * 100) / 100;
        };

        const normalizeName = (name: string): string => {
          return name.toLowerCase().split(":").pop()?.trim() || "";
        };

        const getElementsByLocalName = (
          root: Document | Element,
          localName: string
        ): Element[] => {
          return Array.from(root.getElementsByTagName("*")).filter(
            (el) => normalizeName(el.tagName) === normalizeName(localName)
          );
        };

        const getFirstByLocalName = (
          root: Document | Element,
          localName: string
        ): Element | null => {
          return getElementsByLocalName(root, localName)[0] || null;
        };

        const buscarPropinaEnXML = (xmlDoc: Document) => {
          const resultados: Array<{
            valor: string;
            monto: number;
            nodo: string;
            tipo: "atributo" | "nodo";
            nombre: string;
          }> = [];

          const elementos = Array.from(xmlDoc.getElementsByTagName("*"));

          elementos.forEach((elemento) => {
            // Buscar atributos llamados propina
            Array.from(elemento.attributes || []).forEach((attr) => {
              if (normalizeName(attr.name) === "propina") {
                resultados.push({
                  valor: attr.value,
                  monto: toNumber(attr.value),
                  nodo: elemento.tagName,
                  tipo: "atributo",
                  nombre: attr.name,
                });
              }
            });

            // Buscar nodos llamados propina
            if (normalizeName(elemento.tagName) === "propina") {
              const valor = elemento.textContent?.trim() || "";

              resultados.push({
                valor,
                monto: toNumber(valor),
                nodo: elemento.tagName,
                tipo: "nodo",
                nombre: elemento.tagName,
              });
            }
          });

          const montoTotal = round2(
            resultados.reduce((acc, item) => acc + item.monto, 0)
          );

          return {
            tienePropina: resultados.length > 0 && montoTotal > 0,
            monto: montoTotal.toFixed(2),
            encontrados: resultados,
          };
        };

        const comprobante = getFirstByLocalName(xmlDoc, "Comprobante");
        const emisor = getFirstByLocalName(xmlDoc, "Emisor");
        const receptor = getFirstByLocalName(xmlDoc, "Receptor");
        const timbre = getFirstByLocalName(xmlDoc, "TimbreFiscalDigital");

        const impuestos = getFirstByLocalName(xmlDoc, "Impuestos");

        const trasladoGlobal =
          impuestos?.getElementsByTagName("cfdi:Traslado")[0] ||
          getFirstByLocalName(impuestos as Element, "Traslado") ||
          null;

        const impuestosLocales = getFirstByLocalName(xmlDoc, "ImpuestosLocales");

        const trasladoLocal = impuestosLocales
          ? getFirstByLocalName(impuestosLocales, "TrasladosLocales")
          : null;

        const addendaHoteleria = getFirstByLocalName(xmlDoc, "Hoteleria");

        const propinaDetectada = buscarPropinaEnXML(xmlDoc);

        const conceptos = getElementsByLocalName(xmlDoc, "Concepto").map(
          (concepto) => {
            const traslado = getFirstByLocalName(concepto, "Traslado");

            return {
              cantidad: getAttr(concepto, "Cantidad"),
              descripcion: getAttr(concepto, "Descripcion"),
              valorUnitario: getAttr(concepto, "ValorUnitario"),
              importe: getAttr(concepto, "Importe"),
              unidad: getAttr(concepto, "Unidad"),
              claveProdServ: getAttr(concepto, "ClaveProdServ"),
              claveUnidad: getAttr(concepto, "ClaveUnidad"),
              objetoImp: getAttr(concepto, "ObjetoImp"),
              impuestos: traslado
                ? {
                    impuesto: getAttr(traslado, "Impuesto"),
                    tipoFactor: getAttr(traslado, "TipoFactor"),
                    tasaOCuota: getAttr(traslado, "TasaOCuota"),
                    importe: getAttr(traslado, "Importe"),
                    base: getAttr(traslado, "Base"),
                  }
                : null,
            };
          }
        );

        const data = {
          comprobante: {
            serie: getAttr(comprobante, "Serie"),
            folio: getAttr(comprobante, "Folio"),
            fecha: getAttr(comprobante, "Fecha"),
            subtotal: getAttr(comprobante, "SubTotal"),
            total: getAttr(comprobante, "Total"),
            moneda: getAttr(comprobante, "Moneda"),
            tipoCambio: getAttr(comprobante, "TipoCambio"),
            tipoDeComprobante: getAttr(comprobante, "TipoDeComprobante"),
            formaPago: getAttr(comprobante, "FormaPago"),
            metodoPago: getAttr(comprobante, "MetodoPago"),
            lugarExpedicion: getAttr(comprobante, "LugarExpedicion"),
            condicionesDePago: getAttr(comprobante, "CondicionesDePago"),
            exportacion: getAttr(comprobante, "Exportacion"),
            noCertificado: getAttr(comprobante, "NoCertificado"),
            version: getAttr(comprobante, "Version"),
            certificado: getAttr(comprobante, "Certificado"),
            sello: getAttr(comprobante, "Sello"),
          },

          emisor: {
            rfc: getAttr(emisor, "Rfc"),
            nombre: getAttr(emisor, "Nombre"),
            regimenFiscal: getAttr(emisor, "RegimenFiscal"),
          },

          receptor: {
            rfc: getAttr(receptor, "Rfc"),
            nombre: getAttr(receptor, "Nombre"),
            usoCFDI: getAttr(receptor, "UsoCFDI"),
            regimenFiscal: getAttr(receptor, "RegimenFiscalReceptor"),
            domicilioFiscal: getAttr(receptor, "DomicilioFiscalReceptor"),
          },

          conceptos,

          propina: propinaDetectada,

          impuestos: {
            totalTrasladado: getAttr(impuestos, "TotalImpuestosTrasladados"),
            traslado: trasladoGlobal
              ? {
                  impuesto: getAttr(trasladoGlobal, "Impuesto"),
                  tasa: getAttr(trasladoGlobal, "TasaOCuota"),
                  importe: getAttr(trasladoGlobal, "Importe"),
                  base: getAttr(trasladoGlobal, "Base"),
                  tipoFactor: getAttr(trasladoGlobal, "TipoFactor"),
                }
              : null,
          },

          impuestosLocales: impuestosLocales
            ? {
                totalRetenciones: getAttr(
                  impuestosLocales,
                  "TotaldeRetenciones"
                ),
                totalTraslados: getAttr(impuestosLocales, "TotaldeTraslados"),
                version: getAttr(impuestosLocales, "version"),
                traslado: trasladoLocal
                  ? {
                      impuestoLocal: getAttr(
                        trasladoLocal,
                        "ImpLocTrasladado"
                      ),
                      importe: getAttr(trasladoLocal, "Importe"),
                      tasa: getAttr(trasladoLocal, "TasadeTraslado"),
                    }
                  : null,
              }
            : null,

          timbreFiscal: {
            uuid: getAttr(timbre, "UUID"),
            fechaTimbrado: getAttr(timbre, "FechaTimbrado"),
            selloCFD: getAttr(timbre, "SelloCFD"),
            selloSAT: getAttr(timbre, "SelloSAT"),
            noCertificadoSAT: getAttr(timbre, "NoCertificadoSAT"),
            rfcProvCertif: getAttr(timbre, "RfcProvCertif"),
            version: getAttr(timbre, "Version"),
          },

          addenda: addendaHoteleria
            ? {
                hoteleria: {
                  agencia: getAttr(addendaHoteleria, "agencia"),
                  cajero: getAttr(addendaHoteleria, "cajero"),
                  compania: getAttr(addendaHoteleria, "compania"),
                  contracCode: getAttr(addendaHoteleria, "contracCode"),
                  extension: getAttr(addendaHoteleria, "extension"),
                  fechaLlegada: getAttr(addendaHoteleria, "fechaLlegada"),
                  fechaSalida: getAttr(addendaHoteleria, "fechaSalida"),
                  folio: getAttr(addendaHoteleria, "folio"),
                  habitacion: getAttr(addendaHoteleria, "habitacion"),
                  huesped: getAttr(addendaHoteleria, "huesped"),
                  importeaPagar: getAttr(addendaHoteleria, "importeaPagar"),
                  propina: getAttr(addendaHoteleria, "propina"),
                  numeroFormato: getAttr(addendaHoteleria, "numeroFormato"),
                  numeroReferencia: getAttr(
                    addendaHoteleria,
                    "numeroReferencia"
                  ),
                  reservacion: getAttr(addendaHoteleria, "reservacion"),
                },
              }
            : null,
        };

        console.log(data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Error reading XML file"));
    reader.readAsText(xmlFile);
  });
}